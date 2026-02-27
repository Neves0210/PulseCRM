namespace PulseCRM.Api.Models;

public class PipelineStage
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = default!;

    public string Name { get; set; } = default!;
    public int Order { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}