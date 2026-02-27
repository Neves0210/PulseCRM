using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PulseCRM.Api.Data;
using PulseCRM.Api.Models;
using PulseCRM.Api.Tenants;

namespace PulseCRM.Api.Pipeline;

[ApiController]
[Route("pipeline")]
[Authorize]
public class PipelineController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly TenantContext _tenant;

    public PipelineController(AppDbContext db, TenantContext tenant)
    {
        _db = db;
        _tenant = tenant;
    }

    [HttpGet("stages")]
    public async Task<IActionResult> GetStages()
    {
        // seed básico se não existir nenhuma stage pro tenant
        var any = await _db.PipelineStages.AnyAsync(x => x.TenantId == _tenant.TenantId);
        if (!any)
        {
            var defaults = new[]
            {
                new PipelineStage { TenantId = _tenant.TenantId, Name = "New", Order = 1 },
                new PipelineStage { TenantId = _tenant.TenantId, Name = "Contacted", Order = 2 },
                new PipelineStage { TenantId = _tenant.TenantId, Name = "Qualified", Order = 3 },
                new PipelineStage { TenantId = _tenant.TenantId, Name = "Proposal", Order = 4 },
                new PipelineStage { TenantId = _tenant.TenantId, Name = "Won", Order = 5 },
                new PipelineStage { TenantId = _tenant.TenantId, Name = "Lost", Order = 6 },
            };
            _db.PipelineStages.AddRange(defaults);
            await _db.SaveChangesAsync();
        }

        var stages = await _db.PipelineStages
            .AsNoTracking()
            .Where(x => x.TenantId == _tenant.TenantId)
            .OrderBy(x => x.Order)
            .Select(x => new { x.Id, x.Name, x.Order })
            .ToListAsync();

        return Ok(stages);
    }
}