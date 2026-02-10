namespace CrmApi.Models;

public class Contact
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Organisation { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid OwnerId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public User Owner { get; set; } = null!;
}
