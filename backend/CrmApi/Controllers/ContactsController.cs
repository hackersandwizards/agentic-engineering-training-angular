using CrmApi.Data;
using CrmApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Controllers;

[ApiController]
[Route("api/v1/contacts")]
[Authorize]
public class ContactsController : ControllerBase
{
    private readonly AppDbContext _db;

    public ContactsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> Index([FromQuery] int skip = 0, [FromQuery] int limit = 100)
    {
        limit = Math.Min(limit, 100);
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized();

        var query = _db.Contacts
            .Include(c => c.Owner)
            .AsQueryable();

        if (!user.IsSuperuser)
            query = query.Where(c => c.OwnerId == user.Id);

        var contacts = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip(skip)
            .Take(limit)
            .ToListAsync();

        var countQuery = _db.Contacts.AsQueryable();
        if (!user.IsSuperuser)
            countQuery = countQuery.Where(c => c.OwnerId == user.Id);
        var count = await countQuery.CountAsync();

        return Ok(new
        {
            data = contacts.Select(ContactResponse.From),
            count
        });
    }

    [HttpPost]
    public async Task<IActionResult> Store([FromBody] CreateContactRequest request)
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized();

        if (string.IsNullOrEmpty(request.Organisation))
            return BadRequest(new { detail = "Organisation is required" });

        if (request.Organisation.Length > 255)
            return BadRequest(new { detail = "Organisation must be 255 characters or less" });

        var contact = new Contact
        {
            Organisation = request.Organisation,
            Description = request.Description,
            OwnerId = user.Id
        };

        _db.Contacts.Add(contact);
        await _db.SaveChangesAsync();

        var created = await _db.Contacts
            .Include(c => c.Owner)
            .FirstAsync(c => c.Id == contact.Id);

        return StatusCode(201, ContactResponse.From(created));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Show(Guid id)
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized();

        var contact = await _db.Contacts
            .Include(c => c.Owner)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (contact == null)
            return NotFound(new { detail = "Contact not found" });

        if (contact.OwnerId != user.Id && !user.IsSuperuser)
            return StatusCode(403, new { detail = "Not enough permissions" });

        return Ok(ContactResponse.From(contact));
    }

    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateContactRequest request)
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized();

        var contact = await _db.Contacts
            .Include(c => c.Owner)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (contact == null)
            return NotFound(new { detail = "Contact not found" });

        if (contact.OwnerId != user.Id && !user.IsSuperuser)
            return StatusCode(403, new { detail = "Not enough permissions" });

        if (request.Organisation != null)
        {
            if (request.Organisation.Length == 0)
                return BadRequest(new { detail = "Organisation is required" });
            if (request.Organisation.Length > 255)
                return BadRequest(new { detail = "Organisation must be 255 characters or less" });
            contact.Organisation = request.Organisation;
        }

        if (request.Description != null)
            contact.Description = request.Description;

        await _db.SaveChangesAsync();

        var fresh = await _db.Contacts
            .Include(c => c.Owner)
            .FirstAsync(c => c.Id == contact.Id);

        return Ok(ContactResponse.From(fresh));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Destroy(Guid id)
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized();

        var contact = await _db.Contacts.FindAsync(id);
        if (contact == null)
            return NotFound(new { detail = "Contact not found" });

        if (contact.OwnerId != user.Id && !user.IsSuperuser)
            return StatusCode(403, new { detail = "Not enough permissions" });

        _db.Contacts.Remove(contact);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Contact deleted successfully" });
    }

    private async Task<User?> GetCurrentUser()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                     ?? User.FindFirst("sub")?.Value;
        if (userId == null || !Guid.TryParse(userId, out var id)) return null;
        return await _db.Users.FindAsync(id);
    }
}

public record CreateContactRequest
{
    public string? Organisation { get; init; }
    public string? Description { get; init; }
}

public record UpdateContactRequest
{
    public string? Organisation { get; init; }
    public string? Description { get; init; }
}

public record ContactResponse
{
    public Guid Id { get; init; }
    public string Organisation { get; init; } = string.Empty;
    public string? Description { get; init; }
    public Guid OwnerId { get; init; }
    public ContactOwnerResponse? Owner { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }

    public static ContactResponse From(Contact contact) => new()
    {
        Id = contact.Id,
        Organisation = contact.Organisation,
        Description = contact.Description,
        OwnerId = contact.OwnerId,
        Owner = contact.Owner != null ? new ContactOwnerResponse
        {
            Id = contact.Owner.Id,
            Email = contact.Owner.Email,
            FullName = contact.Owner.FullName
        } : null,
        CreatedAt = contact.CreatedAt,
        UpdatedAt = contact.UpdatedAt
    };
}

public record ContactOwnerResponse
{
    public Guid Id { get; init; }
    public string Email { get; init; } = string.Empty;
    public string? FullName { get; init; }
}
