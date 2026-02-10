using System.Text.Json.Serialization;

namespace CrmApi.Models;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Email { get; set; } = string.Empty;

    [JsonIgnore]
    public string Password { get; set; } = string.Empty;

    public string? FullName { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsSuperuser { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Contact> Contacts { get; set; } = new List<Contact>();
}
