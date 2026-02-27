using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PulseCRM.Api.Data;
using PulseCRM.Api.Models;
using PulseCRM.Api.Tenants;

namespace PulseCRM.Api.Leads;

[ApiController]
[Route("leads")]
[Authorize]
public class LeadsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly TenantContext _tenant;

    public LeadsController(AppDbContext db, TenantContext tenant)
    {
        _db = db;
        _tenant = tenant;
    }

    public record CreateLeadRequest(
        string Name,
        string? Email,
        string? Phone,
        string? Status,
        string? Source,
        Guid? OwnerUserId
    );

    public record UpdateLeadRequest(
        string Name,
        string? Email,
        string? Phone,
        string? Status,
        string? Source,
        Guid? OwnerUserId
    );

    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        [FromQuery] string? source = null,
        [FromQuery] string? search = null,
        [FromQuery] string? sortBy = "createdAt",
        [FromQuery] string? sortDir = "desc"
    )
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize < 1 ? 20 : pageSize;
        pageSize = pageSize > 100 ? 100 : pageSize;

        var q = _db.Leads
            .AsNoTracking()
            .Where(x => x.TenantId == _tenant.TenantId);

        if (!string.IsNullOrWhiteSpace(status))
        {
            var s = status.Trim();
            q = q.Where(x => x.Status == s);
        }

        if (!string.IsNullOrWhiteSpace(source))
        {
            var src = source.Trim();
            q = q.Where(x => x.Source == src);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            var pattern = $"%{term}%";

            q = q.Where(x =>
                EF.Functions.ILike(x.Name, pattern) ||
                (x.Email != null && EF.Functions.ILike(x.Email, pattern)) ||
                (x.Phone != null && EF.Functions.ILike(x.Phone, pattern))
            );
        }

        var total = await q.CountAsync();

        var desc = string.Equals(sortDir, "desc", StringComparison.OrdinalIgnoreCase);
        var key = (sortBy ?? "createdAt").Trim().ToLowerInvariant();

        q = key switch
        {
            "name" => desc ? q.OrderByDescending(x => x.Name) : q.OrderBy(x => x.Name),
            "status" => desc ? q.OrderByDescending(x => x.Status) : q.OrderBy(x => x.Status),
            _ => desc ? q.OrderByDescending(x => x.CreatedAtUtc) : q.OrderBy(x => x.CreatedAtUtc),
        };

        var items = await q
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new
            {
                x.Id,
                x.Name,
                x.Email,
                x.Phone,
                x.Status,
                x.Source,
                x.OwnerUserId,
                x.CreatedAtUtc,
                x.UpdatedAtUtc
            })
            .ToListAsync();

        return Ok(new { total, page, pageSize, items });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var lead = await _db.Leads
            .Where(x => x.TenantId == _tenant.TenantId && x.Id == id)
            .Select(x => new
            {
                x.Id,
                x.Name,
                x.Email,
                x.Phone,
                x.Status,
                x.Source,
                x.OwnerUserId,
                x.CreatedAtUtc,
                x.UpdatedAtUtc
            })
            .FirstOrDefaultAsync();

        if (lead is null) return NotFound();
        return Ok(lead);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateLeadRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Name))
            return BadRequest(new { error = "Name is required" });

        var lead = new Lead
        {
            TenantId = _tenant.TenantId,
            Name = req.Name.Trim(),
            Email = req.Email?.Trim(),
            Phone = req.Phone?.Trim(),
            Status = string.IsNullOrWhiteSpace(req.Status) ? "New" : req.Status.Trim(),
            Source = req.Source?.Trim(),
            OwnerUserId = req.OwnerUserId,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        _db.Leads.Add(lead);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(Get), new { id = lead.Id }, new { lead.Id });
    }

    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateLeadRequest req)
    {
        var lead = await _db.Leads.FirstOrDefaultAsync(x =>
            x.TenantId == _tenant.TenantId && x.Id == id);

        if (lead is null) return NotFound();

        if (req.Name is not null)
        {
            if (string.IsNullOrWhiteSpace(req.Name))
                return BadRequest(new { error = "Name cannot be empty" });

            lead.Name = req.Name.Trim();
        }

        if (req.Email is not null)
            lead.Email = string.IsNullOrWhiteSpace(req.Email) ? null : req.Email.Trim();

        if (req.Phone is not null)
            lead.Phone = string.IsNullOrWhiteSpace(req.Phone) ? null : req.Phone.Trim();

        if (req.Source is not null)
            lead.Source = string.IsNullOrWhiteSpace(req.Source) ? null : req.Source.Trim();

        if (req.Status is not null)
        {
            var st = req.Status.Trim();
            var allowed = new[] { "New", "Contacted", "Qualified", "Lost" };
            if (!allowed.Contains(st))
                return BadRequest(new { error = "Invalid Status" });

            lead.Status = st;
        }

        lead.UpdatedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var lead = await _db.Leads.FirstOrDefaultAsync(x =>
            x.TenantId == _tenant.TenantId && x.Id == id);

        if (lead is null) return NotFound();

        _db.Leads.Remove(lead);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}