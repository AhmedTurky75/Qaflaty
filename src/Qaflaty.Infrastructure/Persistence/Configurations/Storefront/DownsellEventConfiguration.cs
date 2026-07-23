using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Storefront.Aggregates.Downsell;

namespace Qaflaty.Infrastructure.Persistence.Configurations.Storefront;

public class DownsellEventConfiguration : IEntityTypeConfiguration<DownsellEvent>
{
    public void Configure(EntityTypeBuilder<DownsellEvent> builder)
    {
        builder.ToTable("downsell_events");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Id).HasColumnName("id");

        builder.Property(e => e.StoreId)
            .HasConversion(id => id.Value, value => new StoreId(value))
            .HasColumnName("store_id");

        builder.Property(e => e.ProductId)
            .HasConversion(
                id => id == null ? (Guid?)null : id.Value.Value,
                value => value == null ? (ProductId?)null : new ProductId(value.Value))
            .HasColumnName("product_id");

        builder.Property(e => e.EventType).HasColumnName("event_type").HasConversion<int>();
        builder.Property(e => e.TriggerType).HasColumnName("trigger_type").HasConversion<int>();

        builder.Property(e => e.SessionKey)
            .HasColumnName("session_key")
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(e => e.OccurredAt).HasColumnName("occurred_at");

        builder.HasIndex(e => new { e.StoreId, e.OccurredAt });
    }
}
