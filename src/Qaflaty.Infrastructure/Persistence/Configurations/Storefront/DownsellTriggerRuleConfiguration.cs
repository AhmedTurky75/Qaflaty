using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Storefront.Aggregates.Downsell;

namespace Qaflaty.Infrastructure.Persistence.Configurations.Storefront;

public class DownsellTriggerRuleConfiguration : IEntityTypeConfiguration<DownsellTriggerRule>
{
    public void Configure(EntityTypeBuilder<DownsellTriggerRule> builder)
    {
        builder.ToTable("downsell_trigger_rules");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.Id).HasColumnName("id");

        builder.Property(r => r.StoreId)
            .HasConversion(id => id.Value, value => new StoreId(value))
            .HasColumnName("store_id");

        builder.Property(r => r.TriggerType).HasColumnName("trigger_type").HasConversion<int>();
        builder.Property(r => r.Surface).HasColumnName("surface").HasConversion<int>();
        builder.Property(r => r.ThresholdSeconds).HasColumnName("threshold_seconds");
        builder.Property(r => r.IsEnabled).HasColumnName("is_enabled");
        builder.Property(r => r.Priority).HasColumnName("priority");

        builder.HasIndex(r => new { r.StoreId, r.TriggerType, r.Surface }).IsUnique();
    }
}
