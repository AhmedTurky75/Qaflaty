using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Ordering.Aggregates.Order;

namespace Qaflaty.Infrastructure.Persistence.Configurations.Ordering;

public class OrderItemConfiguration : IEntityTypeConfiguration<OrderItem>
{
    public void Configure(EntityTypeBuilder<OrderItem> builder)
    {
        builder.ToTable("order_items");

        builder.HasKey(oi => oi.Id);

        builder.Property(oi => oi.Id)
            .HasConversion(id => id.Value, value => new OrderItemId(value))
            .HasColumnName("id");

        builder.Property(oi => oi.ProductId)
            .HasConversion(id => id.Value, value => new ProductId(value))
            .HasColumnName("product_id");

        builder.Property(oi => oi.ProductName)
            .HasColumnName("product_name")
            .HasMaxLength(200)
            .IsRequired();

        builder.OwnsOne(oi => oi.UnitPrice, money =>
        {
            money.Property(m => m.Amount).HasColumnName("unit_price").HasColumnType("decimal(18,2)");
            money.Property(m => m.Currency).HasColumnName("unit_price_currency").HasConversion<string>();
        });

        builder.Property(oi => oi.Quantity)
            .HasColumnName("quantity");

        builder.Ignore(oi => oi.Total);

        builder.Property<OrderId>("OrderId")
            .HasConversion(id => id.Value, value => new OrderId(value))
            .HasColumnName("order_id");
    }
}
