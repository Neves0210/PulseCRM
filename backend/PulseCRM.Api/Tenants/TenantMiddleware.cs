using Microsoft.EntityFrameworkCore;
using PulseCRM.Api.Data;

namespace PulseCRM.Api.Tenants;

public class TenantMiddleware
{
    private readonly RequestDelegate _next;

    public TenantMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context, AppDbContext db, TenantContext tenantCtx)
    {
        var path = (context.Request.Path.Value ?? "").ToLowerInvariant();

        // Rotas públicas
        if (path == "/" ||
            path.StartsWith("/swagger") ||
            path.StartsWith("/health") ||
            path.StartsWith("/ready") ||
            path.StartsWith("/setup"))
        {
            await _next(context);
            return;
        }

        if (!context.Request.Headers.TryGetValue("X-Tenant-Id", out var header) ||
            !Guid.TryParse(header.ToString(), out var tenantId))
        {
            context.Response.StatusCode = 400;
            await context.Response.WriteAsJsonAsync(new
            {
                error = "Missing or invalid X-Tenant-Id header"
            });
            return;
        }

        var exists = await db.Tenants.AnyAsync(t => t.Id == tenantId);
        if (!exists)
        {
            context.Response.StatusCode = 404;
            await context.Response.WriteAsJsonAsync(new { error = "Tenant not found" });
            return;
        }

        tenantCtx.Set(tenantId);
        await _next(context);
    }
}