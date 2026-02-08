using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Ordering.Aggregates.Order;

namespace Qaflaty.Infrastructure.Persistence.Configurations.Ordering;

public class OrderStatusChangeConfiguration : IEntityTypeConfiguration<OrderStatusChange>
{
    public void Configure(EntityTypeBuilder<OrderStatusChange> builder)
    {
        builder.ToTable("order_status_changes");

        builder.HasKey(sc => sc.Id);

        builder.Property(sc => sc.Id)
            .HasColumnName("id");

        builder.Property(sc => sc.FromStatus)
            .HasColumnName("from_status")
            .HasConversion<string>();

        builder.Property(sc => sc.ToStatus)
            .HasColumnName("to_status")
            .HasConversion<string>();

        builder.Property(sc => sc.ChangedAt)
            .HasColumnName("changed_at");

        builder.Property(sc => sc.ChangedBy)
            .HasColumnName("changed_by")
            .HasMaxLength(100);

        builder.Property(sc => sc.Notes)
            .HasColumnName("notes")
            .HasMaxLength(500);

        builder.Property<OrderId>("OrderId")
            .HasConversion(id => id.Value, value => new OrderId(value))
            .HasColumnName("order_id");
    }
}
