namespace PulseCRM.Api.Models;

public class DealStageHistory
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }

    public Guid DealId { get; set; }
    public Deal Deal { get; set; } = default!;

    public Guid FromStageId { get; set; }
    public Guid ToStageId { get; set; }

    public Guid MovedByUserId { get; set; }
    public DateTime MovedAtUtc { get; set; } = DateTime.UtcNow;
}