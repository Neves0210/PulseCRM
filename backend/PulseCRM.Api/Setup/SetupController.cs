using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PulseCRM.Api.Auth;
using PulseCRM.Api.Data;
using PulseCRM.Api.Models;

namespace PulseCRM.Api.Setup;

[ApiController]
[Route("setup")]
public class SetupController : ControllerBase
{
    private readonly AppDbContext _db;

    public SetupController(AppDbContext db) => _db = db;

    public record SeedRequest(string TenantName, string AdminName, string AdminEmail, string AdminPassword);

    [HttpPost("seed")]
    public async Task<IActionResult> Seed([FromBody] SeedRequest req)
    {
        // Impede rodar várias vezes (portfólio: simples)
        var anyTenant = await _db.Tenants.AnyAsync();
        if (anyTenant)
            return Conflict(new { error = "Database already seeded" });

        var tenant = new Tenant { Name = req.TenantName };
        _db.Tenants.Add(tenant);

        var admin = new User
        {
            TenantId = tenant.Id,
            Name = req.AdminName,
            Email = req.AdminEmail.ToLowerInvariant(),
            PasswordHash = PasswordHasher.Hash(req.AdminPassword),
            Role = "Admin",
            IsActive = true
        };

        _db.Users.Add(admin);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            tenantId = tenant.Id,
            adminUserId = admin.Id
        });
    }
}