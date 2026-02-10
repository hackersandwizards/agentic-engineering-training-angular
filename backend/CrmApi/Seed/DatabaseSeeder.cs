using CrmApi.Data;
using CrmApi.Models;
using Microsoft.EntityFrameworkCore;

namespace CrmApi.Seed;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        await db.Database.EnsureCreatedAsync();

        if (await db.Users.AnyAsync())
            return;

        var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
        var superEmail = config["Seed:SuperuserEmail"] ?? "dev@example.com";
        var superPassword = config["Seed:SuperuserPassword"] ?? "DevPassword";

        var superuser = new User
        {
            Email = superEmail,
            Password = BCrypt.Net.BCrypt.HashPassword(superPassword),
            FullName = "Dev Admin",
            IsActive = true,
            IsSuperuser = true
        };

        var alice = new User
        {
            Email = "alice@example.com",
            Password = BCrypt.Net.BCrypt.HashPassword("AlicePassword123"),
            FullName = "Alice Johnson",
            IsActive = true,
            IsSuperuser = false
        };

        var bob = new User
        {
            Email = "bob@example.com",
            Password = BCrypt.Net.BCrypt.HashPassword("BobPassword123"),
            FullName = "Bob Smith",
            IsActive = true,
            IsSuperuser = false
        };

        db.Users.AddRange(superuser, alice, bob);

        db.Contacts.AddRange(
            new Contact { Organisation = "OpenAI", Description = "AI research company", OwnerId = superuser.Id },
            new Contact { Organisation = "Anthropic", Description = "AI safety company", OwnerId = superuser.Id },
            new Contact { Organisation = "Google DeepMind", Description = "AI research lab", OwnerId = superuser.Id },
            new Contact { Organisation = "Meta AI", Description = "Meta's AI division", OwnerId = superuser.Id },
            new Contact { Organisation = "Microsoft Research", Description = "Research division", OwnerId = superuser.Id },
            new Contact { Organisation = "Acme Corp", Description = "General services company", OwnerId = alice.Id },
            new Contact { Organisation = "TechStart Inc", Description = "Technology startup", OwnerId = alice.Id },
            new Contact { Organisation = "DataFlow Systems", Description = "Data analytics provider", OwnerId = bob.Id },
            new Contact { Organisation = "CloudNine Hosting", Description = "Cloud hosting service", OwnerId = bob.Id },
            new Contact { Organisation = "SecureNet", Description = "Cybersecurity firm", OwnerId = bob.Id }
        );

        await db.SaveChangesAsync();
    }
}
