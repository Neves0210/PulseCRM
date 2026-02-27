using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PulseCRM.Api.Data;
using PulseCRM.Api.Tenants;

namespace PulseCRM.Api.Tenants;

[ApiController]
[Route("tenants")]
public class TenantsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly TenantContext _tenant;

    public TenantsController(AppDbContext db, TenantContext tenant)
    {
        _db = db;
        _tenant = tenant;
    }

    [HttpGet("current")]
    public async Task<IActionResult> Current()
    {
        var t = await _db.Tenants.FirstAsync(x => x.Id == _tenant.TenantId);
        return Ok(new { id = t.Id, name = t.Name, createdAtUtc = t.CreatedAtUtc });
    }
}