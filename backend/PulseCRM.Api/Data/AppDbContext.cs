using Microsoft.EntityFrameworkCore;
using PulseCRM.Api.Models;

namespace PulseCRM.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
    public DbSet<Lead> Leads => Set<Lead>();
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Tenant>(e =>
        {
            e.ToTable("tenants");
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(200).IsRequired();
            e.Property(x => x.CreatedAtUtc).IsRequired();
        });

        modelBuilder.Entity<User>(e =>
        {
            e.ToTable("users");
            e.HasKey(x => x.Id);

            e.Property(x => x.Name).HasMaxLength(200).IsRequired();
            e.Property(x => x.Email).HasMaxLength(200).IsRequired();
            e.HasIndex(x => new { x.TenantId, x.Email }).IsUnique();

            e.Property(x => x.PasswordHash).IsRequired();
            e.Property(x => x.Role).HasMaxLength(50).IsRequired();
            e.Property(x => x.CreatedAtUtc).IsRequired();

            e.HasOne(x => x.Tenant)
             .WithMany()
             .HasForeignKey(x => x.TenantId)
             .OnDelete(DeleteBehavior.Cascade);
        });
        modelBuilder.Entity<Lead>(e =>
        {
            e.ToTable("leads");
            e.HasKey(x => x.Id);

            e.Property(x => x.Name).HasMaxLength(200).IsRequired();
            e.Property(x => x.Email).HasMaxLength(200);
            e.Property(x => x.Phone).HasMaxLength(50);

            e.Property(x => x.Status).HasMaxLength(50).IsRequired();
            e.Property(x => x.Source).HasMaxLength(100);

            e.Property(x => x.CreatedAtUtc).IsRequired();
            e.Property(x => x.UpdatedAtUtc).IsRequired();

            e.HasIndex(x => new { x.TenantId, x.CreatedAtUtc });
            e.HasIndex(x => new { x.TenantId, x.Status });

            e.HasOne(x => x.Tenant)
                .WithMany()
                .HasForeignKey(x => x.TenantId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(x => x.OwnerUser)
                .WithMany()
                .HasForeignKey(x => x.OwnerUserId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}