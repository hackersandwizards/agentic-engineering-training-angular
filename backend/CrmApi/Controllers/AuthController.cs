using CrmApi.Auth;
using CrmApi.Data;
using CrmApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Controllers;

[ApiController]
[Route("api/v1")]
public class AuthController : BaseApiController
{
    private readonly JwtService _jwt;

    public AuthController(AppDbContext db, JwtService jwt) : base(db)
    {
        _jwt = jwt;
    }

    [HttpPost("login/access-token")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var email = request.Username ?? request.Email;
        if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(request.Password))
            return BadDetail("Email and password are required");

        if (!IsValidEmail(email))
            return BadDetail("Invalid email format");

        var user = await Db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.Password))
            return BadDetail("Incorrect email or password");

        if (!user.IsActive)
            return BadDetail("User account is inactive");

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
            IsSuperuser = false
        };

        Db.Users.Add(user);
        await Db.SaveChangesAsync();

        return StatusCode(201, UserResponse.From(user));
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
