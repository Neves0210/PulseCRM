namespace PulseCRM.Api.Models;

public class Deal
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = default!;

    public Guid StageId { get; set; }
    public PipelineStage Stage { get; set; } = default!;

    public string Title { get; set; } = default!;     // ex: "Plano anual - Empresa X"
    public string? Company { get; set; }              // ex: "Empresa X"
    public decimal? Amount { get; set; }              // ex: 12000.00

    public string Status { get; set; } = "Open";      // Open, Won, Lost

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
}