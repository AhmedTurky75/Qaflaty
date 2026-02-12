using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qaflaty.Domain.Catalog.Aggregates.Product;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Infrastructure.Persistence.Configurations.Catalog;

public class InventoryMovementConfiguration : IEntityTypeConfiguration<InventoryMovement>
{
    public void Configure(EntityTypeBuilder<InventoryMovement> builder)
    {
        builder.ToTable("inventory_movements");

        builder.HasKey(im => im.Id);

        builder.Property(im => im.Id)
            .HasColumnName("id");

        builder.Property(im => im.ProductId)
            .HasConversion(id => id.Value, value => new ProductId(value))
            .HasColumnName("product_id");

        builder.Property(im => im.VariantId)
            .HasColumnName("variant_id");

        builder.Property(im => im.QuantityChange)
            .HasColumnName("quantity_change")
            .IsRequired();

        builder.Property(im => im.QuantityAfter)
            .HasColumnName("quantity_after")
            .IsRequired();

        builder.Property(im => im.Type)
            .HasColumnName("type")
            .HasConversion<string>()
            .IsRequired();

        builder.Property(im => im.Reason)
            .HasColumnName("reason")
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(im => im.OrderId)
            .HasConversion(
                id => id != null ? id.Value.Value : (Guid?)null,
                value => value.HasValue ? new OrderId(value.Value) : null)
            .HasColumnName("order_id");

        builder.Property(im => im.CreatedAt)
            .HasColumnName("created_at");

        // Indexes for querying
        builder.HasIndex(im => im.ProductId);
        builder.HasIndex(im => im.VariantId);
        builder.HasIndex(im => im.CreatedAt);
    }
}
