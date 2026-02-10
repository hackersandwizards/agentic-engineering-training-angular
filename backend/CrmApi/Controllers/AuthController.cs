using CrmApi.Auth;
using CrmApi.Data;
using CrmApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Controllers;

[ApiController]
[Route("api/v1")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly JwtService _jwt;

    public AuthController(AppDbContext db, JwtService jwt)
    {
        _db = db;
        _jwt = jwt;
    }

    [HttpPost("login/access-token")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var email = request.Username ?? request.Email;
        if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(request.Password))
            return BadRequest(new { detail = "Email and password are required" });

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.Password))
            return BadRequest(new { detail = "Incorrect email or password" });

        if (!user.IsActive)
            return BadRequest(new { detail = "User account is inactive" });

        var token = _jwt.GenerateToken(user);

        return Ok(new
        {
            access_token = token,
            token_type = "bearer",
            user = UserResponse.From(user)
        });
    }

    [Authorize]
    [HttpPost("login/test-token")]
    public async Task<IActionResult> TestToken()
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized();
        return Ok(UserResponse.From(user));
    }

    [HttpPost("users/signup")]
    public async Task<IActionResult> Signup([FromBody] SignupRequest request)
    {
        if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
            return BadRequest(new { detail = "Email and password are required" });

        if (request.Password.Length < 8 || request.Password.Length > 40)
            return BadRequest(new { detail = "Password must be between 8 and 40 characters" });

        if (await _db.Users.AnyAsync(u => u.Email == request.Email))
            return BadRequest(new { detail = "A user with this email already exists" });

        var user = new User
        {
            Email = request.Email,
            Password = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FullName = request.FullName,
            IsActive = true,
            IsSuperuser = false
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return StatusCode(201, UserResponse.From(user));
    }

    private async Task<User?> GetCurrentUser()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                     ?? User.FindFirst("sub")?.Value;
        if (userId == null || !Guid.TryParse(userId, out var id)) return null;
        return await _db.Users.FindAsync(id);
    }
}

public record LoginRequest
{
    public string? Username { get; init; }
    public string? Email { get; init; }
    public string? Password { get; init; }
}

public record SignupRequest
{
    public string? Email { get; init; }
    public string? Password { get; init; }
    public string? FullName { get; init; }
}

public record UserResponse
{
    public Guid Id { get; init; }
    public string Email { get; init; } = string.Empty;
    public string? FullName { get; init; }
    public bool IsActive { get; init; }
    public bool IsSuperuser { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }

    public static UserResponse From(User user) => new()
    {
        Id = user.Id,
        Email = user.Email,
        FullName = user.FullName,
        IsActive = user.IsActive,
        IsSuperuser = user.IsSuperuser,
        CreatedAt = user.CreatedAt,
        UpdatedAt = user.UpdatedAt
    };
}
