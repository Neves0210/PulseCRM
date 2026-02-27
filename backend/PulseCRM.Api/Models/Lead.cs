namespace PulseCRM.Api.Models;

public class Lead
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = default!;

    public Guid? OwnerUserId { get; set; } // opcional
    public User? OwnerUser { get; set; }

    public string Name { get; set; } = default!;
    public string? Email { get; set; }
    public string? Phone { get; set; }

    public string Status { get; set; } = "New";   // New, Contacted, Qualified, Lost...
    public string? Source { get; set; }           // Instagram, Indicação, Site...

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
}