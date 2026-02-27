namespace PulseCRM.Api.Tenants;

public class TenantContext
{
    public Guid TenantId { get; private set; }
    public bool HasTenant => TenantId != Guid.Empty;
    public void Set(Guid tenantId) => TenantId = tenantId;
}