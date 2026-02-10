using CrmApi.Data;
using CrmApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Controllers;

[ApiController]
[Route("api/v1")]
[Authorize]
public class UsersController : BaseApiController
{
    public UsersController(AppDbContext db) : base(db) {}

    // --- Current user routes ---

    [HttpGet("users/me")]
    public async Task<IActionResult> Me()
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized();
        return Ok(UserResponse.From(user));
    }

    [HttpPatch("users/me")]
    public async Task<IActionResult> UpdateMe([FromBody] UpdateMeRequest request)
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized();

        if (request.Email != null)
        {
            if (!IsValidEmail(request.Email))
                return BadDetail("Invalid email format");

            if (await Db.Users.AnyAsync(u => u.Email == request.Email && u.Id != user.Id))
                return BadDetail("A user with this email already exists");
            user.Email = request.Email;
        }

        if (request.FullName != null)
            user.FullName = request.FullName;

        await Db.SaveChangesAsync();

        return Ok(UserResponse.From(user));
    }

    [HttpPatch("users/me/password")]
    public async Task<IActionResult> UpdatePassword([FromBody] UpdatePasswordRequest request)
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized();

        if (string.IsNullOrEmpty(request.CurrentPassword) || string.IsNullOrEmpty(request.NewPassword))
            return BadDetail("Current password and new password are required");

        if (request.NewPassword.Length < 8 || request.NewPassword.Length > 40)
            return BadDetail("Password must be between 8 and 40 characters");

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.Password))
            return BadDetail("Incorrect password");

        if (request.CurrentPassword == request.NewPassword)
            return BadDetail("New password must be different from current password");

        user.Password = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await Db.SaveChangesAsync();

        return Ok(new MessageResponse("Password updated successfully"));
    }

    [HttpDelete("users/me")]
    public async Task<IActionResult> DeleteMe()
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized();

        if (user.IsSuperuser)
            return ForbidDetail("Super users are not allowed to delete themselves");

        Db.Users.Remove(user);
        await Db.SaveChangesAsync();

        return Ok(new MessageResponse("User deleted successfully"));
    }

    // --- Admin routes (superuser only) ---

    [HttpGet("users")]
    [Authorize(Policy = "Superuser")]
    public async Task<IActionResult> Index([FromQuery] int skip = 0, [FromQuery] int limit = 100)
    {
        limit = Math.Min(limit, 100);

        var users = await Db.Users
            .OrderByDescending(u => u.CreatedAt)
            .Skip(skip)
            .Take(limit)
            .ToListAsync();

        var count = await Db.Users.CountAsync();

        return Ok(new
        {
            data = users.Select(UserResponse.From),
            count
        });
    }

    [HttpPost("users")]
    [Authorize(Policy = "Superuser")]
    public async Task<IActionResult> Store([FromBody] CreateUserRequest request)
    {
        if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
            return BadDetail("Email and password are required");

        if (!IsValidEmail(request.Email))
            return BadDetail("Invalid email format");

        if (request.Password.Length < 8 || request.Password.Length > 40)
            return BadDetail("Password must be between 8 and 40 characters");

        if (await Db.Users.AnyAsync(u => u.Email == request.Email))
            return BadDetail("A user with this email already exists");

        var user = new User
        {
            Email = request.Email,
            Password = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FullName = request.FullName,
            IsActive = true,
            IsSuperuser = request.IsSuperuser ?? false
        };

        Db.Users.Add(user);
        await Db.SaveChangesAsync();

        return StatusCode(201, UserResponse.From(user));
    }

    [HttpGet("users/{id:guid}")]
    [Authorize(Policy = "Superuser")]
    public async Task<IActionResult> Show(Guid id)
    {
        var user = await Db.Users.FindAsync(id);
        if (user == null)
            return NotFoundDetail("User not found");

        return Ok(UserResponse.From(user));
    }

    [HttpPatch("users/{id:guid}")]
    [Authorize(Policy = "Superuser")]
    public async Task<IActionResult> Update(Guid id, [FromBody] AdminUpdateUserRequest request)
    {
        var user = await Db.Users.FindAsync(id);
        if (user == null)
            return NotFoundDetail("User not found");

        if (request.Email != null)
        {
            if (!IsValidEmail(request.Email))
                return BadDetail("Invalid email format");

            if (await Db.Users.AnyAsync(u => u.Email == request.Email && u.Id != user.Id))
                return BadDetail("A user with this email already exists");
            user.Email = request.Email;
        }

        if (!string.IsNullOrEmpty(request.Password))
        {
            if (request.Password.Length < 8 || request.Password.Length > 40)
                return BadDetail("Password must be between 8 and 40 characters");
            user.Password = BCrypt.Net.BCrypt.HashPassword(request.Password);
        }

        if (request.FullName != null)
            user.FullName = request.FullName;

        if (request.IsSuperuser.HasValue)
            user.IsSuperuser = request.IsSuperuser.Value;

        if (request.IsActive.HasValue)
            user.IsActive = request.IsActive.Value;

        await Db.SaveChangesAsync();

        return Ok(UserResponse.From(user));
    }

    [HttpDelete("users/{id:guid}")]
    [Authorize(Policy = "Superuser")]
    public async Task<IActionResult> Destroy(Guid id)
    {
        var currentUser = await GetCurrentUser();
        if (currentUser == null) return Unauthorized();

        if (currentUser.Id == id)
            return ForbidDetail("Super users are not allowed to delete themselves");

        var user = await Db.Users.FindAsync(id);
        if (user == null)
            return NotFoundDetail("User not found");

        Db.Users.Remove(user);
        await Db.SaveChangesAsync();

        return Ok(new MessageResponse("User deleted successfully"));
    }
}

public record UpdateMeRequest
{
    public string? Email { get; init; }
    public string? FullName { get; init; }
}

public record UpdatePasswordRequest
{
    public string? CurrentPassword { get; init; }
    public string? NewPassword { get; init; }
}

public record CreateUserRequest
{
    public string? Email { get; init; }
    public string? Password { get; init; }
    public string? FullName { get; init; }
    public bool? IsSuperuser { get; init; }
}

public record AdminUpdateUserRequest
{
    public string? Email { get; init; }
    public string? Password { get; init; }
    public string? FullName { get; init; }
    public bool? IsSuperuser { get; init; }
    public bool? IsActive { get; init; }
}
