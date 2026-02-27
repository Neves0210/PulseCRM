using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PulseCRM.Api.Data;
using PulseCRM.Api.Models;
using PulseCRM.Api.Tenants;
using System.Text.Json;

namespace PulseCRM.Api.Deals;

[ApiController]
[Route("deals")]
[Authorize]
public class DealsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly TenantContext _tenant;

    public DealsController(AppDbContext db, TenantContext tenant)
    {
        _db = db;
        _tenant = tenant;
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] Guid? stageId = null)
    {
        var q = _db.Deals.AsNoTracking()
            .Where(x => x.TenantId == _tenant.TenantId);

        if (stageId.HasValue)
            q = q.Where(x => x.StageId == stageId.Value);

        var items = await q
            .OrderByDescending(x => x.UpdatedAtUtc)
            .Select(x => new
            {
                x.Id,
                x.Title,
                x.Company,
                x.Amount,
                x.Status,
                x.StageId,
                x.CreatedAtUtc,
                x.UpdatedAtUtc
            })
            .ToListAsync();

        return Ok(items);
    }

    public record CreateDealRequest(Guid StageId, string Title, string? Company, decimal? Amount);

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateDealRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Title))
            return BadRequest(new { error = "Title is required" });

        var stageExists = await _db.PipelineStages.AnyAsync(s =>
            s.TenantId == _tenant.TenantId && s.Id == req.StageId);

        if (!stageExists) return BadRequest(new { error = "Invalid StageId" });

        var deal = new Deal
        {
            TenantId = _tenant.TenantId,
            StageId = req.StageId,
            Title = req.Title.Trim(),
            Company = req.Company?.Trim(),
            Amount = req.Amount,
            Status = "Open",
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        _db.Deals.Add(deal);
        await _db.SaveChangesAsync();

        return Ok(new { deal.Id });
    }

    public record MoveDealRequest(Guid ToStageId);

    [HttpPatch("{id:guid}/move")]
    public async Task<IActionResult> Move(Guid id, [FromBody] MoveDealRequest req)
    {
        var deal = await _db.Deals.FirstOrDefaultAsync(x =>
            x.TenantId == _tenant.TenantId && x.Id == id);

        if (deal is null) return NotFound();

        // Busca o stage de destino (em vez de só AnyAsync)
        var toStage = await _db.PipelineStages
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.TenantId == _tenant.TenantId && s.Id == req.ToStageId);

        if (toStage is null) return BadRequest(new { error = "Invalid ToStageId" });

        var from = deal.StageId;
        if (from == req.ToStageId) return NoContent();

        deal.StageId = req.ToStageId;
        deal.UpdatedAtUtc = DateTime.UtcNow;

        // ✅ Ajusta status conforme coluna
        var stageName = (toStage.Name ?? "").Trim().ToLowerInvariant();
        if (stageName == "won") deal.Status = "Won";
        else if (stageName == "lost") deal.Status = "Lost";
        else deal.Status = "Open";

        var userIdStr = User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        _ = Guid.TryParse(userIdStr, out var userId);

        _db.DealStageHistories.Add(new DealStageHistory
        {
            TenantId = _tenant.TenantId,
            DealId = deal.Id,
            FromStageId = from,
            ToStageId = req.ToStageId,
            MovedByUserId = userId == Guid.Empty ? deal.Id : userId, // fallback
            MovedAtUtc = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
        return NoContent();
    }

    public record UpdateDealRequest(string? Title, string? Company, JsonElement? Amount);

    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateDealRequest req)
    {
        var deal = await _db.Deals.FirstOrDefaultAsync(x =>
            x.TenantId == _tenant.TenantId && x.Id == id);

        if (deal is null) return NotFound();

        // Title
        if (req.Title is not null)
        {
            if (string.IsNullOrWhiteSpace(req.Title))
                return BadRequest(new { error = "Title cannot be empty" });

            deal.Title = req.Title.Trim();
        }

        // Company
        if (req.Company is not null)
            deal.Company = string.IsNullOrWhiteSpace(req.Company) ? null : req.Company.Trim();

        // Amount (pode ser número, null, ou ausente)
        if (req.Amount.HasValue)
        {
            var el = req.Amount.Value;
            if (el.ValueKind == JsonValueKind.Null)
            {
                deal.Amount = null;
            }
            else if (el.ValueKind == JsonValueKind.Number)
            {
                // decimal via double não é ideal, mas funciona bem aqui; se quiser, trocamos pra string depois
                deal.Amount = el.GetDecimal();
            }
            else
            {
                return BadRequest(new { error = "Amount must be a number or null" });
            }
        }

        deal.UpdatedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var deal = await _db.Deals.FirstOrDefaultAsync(x =>
            x.TenantId == _tenant.TenantId && x.Id == id);

        if (deal is null) return NotFound();

        _db.Deals.Remove(deal);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}