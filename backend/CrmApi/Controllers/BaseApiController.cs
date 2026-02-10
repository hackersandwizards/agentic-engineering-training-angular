using System.Text.RegularExpressions;
using CrmApi.Data;
using CrmApi.Models;
using Microsoft.AspNetCore.Mvc;

namespace CrmApi.Controllers;

public abstract partial class BaseApiController : ControllerBase
{
    protected readonly AppDbContext Db;

    protected BaseApiController(AppDbContext db)
    {
        Db = db;
    }

    protected async Task<User?> GetCurrentUser()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                     ?? User.FindFirst("sub")?.Value;
        if (userId == null || !Guid.TryParse(userId, out var id)) return null;
        return await Db.Users.FindAsync(id);
    }

    protected BadRequestObjectResult BadDetail(string detail) =>
        BadRequest(new DetailResponse(detail));

    protected NotFoundObjectResult NotFoundDetail(string detail) =>
        NotFound(new DetailResponse(detail));

    protected ObjectResult ForbidDetail(string detail) =>
        StatusCode(403, new DetailResponse(detail));

    protected static bool IsValidEmail(string email) =>
        EmailRegex().IsMatch(email);

    [GeneratedRegex(@"^[^@\s]+@[^@\s]+\.[^@\s]+$")]
    private static partial Regex EmailRegex();
}
