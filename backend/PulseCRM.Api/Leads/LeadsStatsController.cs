using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PulseCRM.Api.Data;
using PulseCRM.Api.Tenants;

namespace PulseCRM.Api.Leads;

[ApiController]
[Route("leads")]
[Authorize]
public class LeadsStatsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly TenantContext _tenant;

    public LeadsStatsController(AppDbContext db, TenantContext tenant)
    {
        _db = db;
        _tenant = tenant;
    }

    [HttpGet("stats")]
    public async Task<IActionResult> Stats()
    {
        var baseQ = _db.Leads
            .AsNoTracking()
            .Where(x => x.TenantId == _tenant.TenantId);

        var total = await baseQ.CountAsync();

        var byStatus = await baseQ
            .GroupBy(x => x.Status)
            .Select(g => new { status = g.Key, count = g.Count() })
            .OrderByDescending(x => x.count)
            .ToListAsync();

        var topSources = await baseQ
            .Where(x => x.Source != null && x.Source != "")
            .GroupBy(x => x.Source!)
            .Select(g => new { source = g.Key, count = g.Count() })
            .OrderByDescending(x => x.count)
            .Take(5)
            .ToListAsync();

        var latest = await baseQ
            .OrderByDescending(x => x.CreatedAtUtc)
            .Take(5)
            .Select(x => new
            {
                x.Id,
                x.Name,
                x.Status,
                x.Source,
                x.CreatedAtUtc
            })
            .ToListAsync();

        return Ok(new { total, byStatus, topSources, latest });
    }
}