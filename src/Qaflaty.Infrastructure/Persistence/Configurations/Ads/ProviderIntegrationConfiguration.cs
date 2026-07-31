using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qaflaty.Domain.Ads.Aggregates.ProviderIntegration;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Infrastructure.Persistence.Configurations.Ads;

public class ProviderIntegrationConfiguration : IEntityTypeConfiguration<ProviderIntegration>
{
    public void Configure(EntityTypeBuilder<ProviderIntegration> builder)
    {
        builder.ToTable("provider_integrations");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Id)
            .HasConversion(id => id.Value, value => new ProviderIntegrationId(value))
            .HasColumnName("id");

        builder.Property(p => p.StoreId)
            .HasConversion(id => id.Value, value => new StoreId(value))
            .HasColumnName("store_id");

        builder.Property(p => p.Provider)
            .HasColumnName("provider")
            .HasConversion<string>();

        builder.Property(p => p.Status)
            .HasColumnName("status")
            .HasConversion<string>();

        builder.Property(p => p.ProtectedCredentialsJson)
            .HasColumnName("credentials_protected")
            .IsRequired();

        builder.Property(p => p.BrowserTrackingEnabled).HasColumnName("browser_enabled");
        builder.Property(p => p.ServerTrackingEnabled).HasColumnName("server_enabled");
        builder.Property(p => p.HealthScore).HasColumnName("health_score");
        builder.Property(p => p.LastEventAt).HasColumnName("last_event_at");
        builder.Property(p => p.LastErrorCode).HasColumnName("last_error_code").HasMaxLength(200);
        builder.Property(p => p.LastErrorMessage).HasColumnName("last_error_message").HasMaxLength(1000);
        builder.Property(p => p.LastVerifiedAt).HasColumnName("last_verified_at");
        builder.Property(p => p.CreatedAt).HasColumnName("created_at");
        builder.Property(p => p.UpdatedAt).HasColumnName("updated_at");

        builder.HasIndex(p => new { p.StoreId, p.Provider }).IsUnique();

        builder.Ignore(p => p.DomainEvents);
        builder.Ignore(p => p.IsActive);
        builder.Ignore(p => p.IsDispatchable);
    }
}
