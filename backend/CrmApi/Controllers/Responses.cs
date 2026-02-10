using CrmApi.Models;

namespace CrmApi.Controllers;

public record DetailResponse(string Detail);

public record MessageResponse(string Message);

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
