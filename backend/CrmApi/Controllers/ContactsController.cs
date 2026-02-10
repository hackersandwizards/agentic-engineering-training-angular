using CrmApi.Data;
using CrmApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Controllers;

[ApiController]
[Route("api/v1/contacts")]
[Authorize]
public class ContactsController : BaseApiController
{
    public ContactsController(AppDbContext db) : base(db) {}

    [HttpGet]
    public async Task<IActionResult> Index([FromQuery] int skip = 0, [FromQuery] int limit = 100)
    {
        limit = Math.Min(limit, 100);
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized();

        var baseQuery = Db.Contacts.AsQueryable();
        if (!user.IsSuperuser)
            baseQuery = baseQuery.Where(c => c.OwnerId == user.Id);

        var contacts = await baseQuery
            .Include(c => c.Owner)
            .OrderByDescending(c => c.CreatedAt)
            .Skip(skip)
            .Take(limit)
            .ToListAsync();

        var count = await baseQuery.CountAsync();

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
            return BadDetail("Organisation is required");

        if (request.Organisation.Length > 255)
            return BadDetail("Organisation must be 255 characters or less");

        var contact = new Contact
        {
            Organisation = request.Organisation,
            Description = request.Description,
            OwnerId = user.Id
        };

        Db.Contacts.Add(contact);
        await Db.SaveChangesAsync();

        var created = await Db.Contacts
            .Include(c => c.Owner)
            .FirstAsync(c => c.Id == contact.Id);

        return StatusCode(201, ContactResponse.From(created));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Show(Guid id)
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized();

        var contact = await Db.Contacts
            .Include(c => c.Owner)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (contact == null)
            return NotFoundDetail("Contact not found");

        if (contact.OwnerId != user.Id && !user.IsSuperuser)
            return ForbidDetail("Not enough permissions");

        return Ok(ContactResponse.From(contact));
    }

    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateContactRequest request)
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized();

        var contact = await Db.Contacts
            .Include(c => c.Owner)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (contact == null)
            return NotFoundDetail("Contact not found");

        if (contact.OwnerId != user.Id && !user.IsSuperuser)
            return ForbidDetail("Not enough permissions");

        if (request.Organisation != null)
        {
            if (request.Organisation.Length == 0)
                return BadDetail("Organisation is required");
            if (request.Organisation.Length > 255)
                return BadDetail("Organisation must be 255 characters or less");
            contact.Organisation = request.Organisation;
        }

        if (request.Description != null)
            contact.Description = request.Description;

        await Db.SaveChangesAsync();

        return Ok(ContactResponse.From(contact));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Destroy(Guid id)
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized();

        var contact = await Db.Contacts.FindAsync(id);
        if (contact == null)
            return NotFoundDetail("Contact not found");

        if (contact.OwnerId != user.Id && !user.IsSuperuser)
            return ForbidDetail("Not enough permissions");

        Db.Contacts.Remove(contact);
        await Db.SaveChangesAsync();

        return Ok(new MessageResponse("Contact deleted successfully"));
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
