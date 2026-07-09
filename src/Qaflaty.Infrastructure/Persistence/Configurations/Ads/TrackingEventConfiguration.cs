using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qaflaty.Domain.Ads.Aggregates.TrackingEvent;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Infrastructure.Persistence.Configurations.Ads;

public class TrackingEventConfiguration : IEntityTypeConfiguration<TrackingEvent>
{
    public void Configure(EntityTypeBuilder<TrackingEvent> builder)
    {
        builder.ToTable("tracking_events");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.Id)
            .HasConversion(id => id.Value, value => new TrackingEventId(value))
            .HasColumnName("id");

        builder.Property(t => t.StoreId)
            .HasConversion(id => id.Value, value => new StoreId(value))
            .HasColumnName("store_id");

        builder.Property(t => t.EventKey).HasColumnName("event_key");

        builder.Property(t => t.EventType)
            .HasColumnName("event_type")
            .HasConversion<string>();

        builder.Property(t => t.Channel)
            .HasColumnName("channel")
            .HasConversion<string>();

        builder.Property(t => t.OrderId)
            .HasConversion(
                id => id != null ? id.Value.Value : (Guid?)null,
                value => value.HasValue ? new OrderId(value.Value) : null)
            .HasColumnName("order_id");

        builder.Property(t => t.CustomerRef).HasColumnName("customer_ref").HasMaxLength(200);
        builder.Property(t => t.PayloadJson).HasColumnName("payload_json").HasColumnType("jsonb");
        builder.Property(t => t.CorrelationId).HasColumnName("correlation_id");
        builder.Property(t => t.CreatedAt).HasColumnName("created_at");

        builder.HasIndex(t => new { t.StoreId, t.EventKey, t.Channel });
        builder.HasIndex(t => t.OrderId);
        builder.HasIndex(t => t.CorrelationId);
        builder.HasIndex(t => t.CreatedAt);

        builder.HasMany(t => t.DispatchLogs)
            .WithOne()
            .HasForeignKey("TrackingEventId")
            .OnDelete(DeleteBehavior.Cascade);

        builder.Ignore(t => t.DomainEvents);
    }
}
