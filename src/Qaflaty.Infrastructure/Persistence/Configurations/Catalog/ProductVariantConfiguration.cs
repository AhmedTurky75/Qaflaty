using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qaflaty.Domain.Catalog.Aggregates.Product;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.ValueObjects;

namespace Qaflaty.Infrastructure.Persistence.Configurations.Catalog;

public class ProductVariantConfiguration : IEntityTypeConfiguration<ProductVariant>
{
    public void Configure(EntityTypeBuilder<ProductVariant> builder)
    {
        builder.ToTable("product_variants");

        builder.HasKey(v => v.Id);

        builder.Property(v => v.Id)
            .HasColumnName("id");

        builder.Property(v => v.ProductId)
            .HasConversion(id => id.Value, value => new ProductId(value))
            .HasColumnName("product_id");

        // Attributes stored as JSONB for flexibility
        builder.Property(v => v.Attributes)
            .HasColumnName("attributes")
            .HasColumnType("jsonb")
            .IsRequired();

        builder.Property(v => v.Sku)
            .HasColumnName("sku")
            .HasMaxLength(100)
            .IsRequired();

        // Price override as Money value object
        builder.OwnsOne(v => v.PriceOverride, money =>
        {
            money.Property(m => m.Amount)
                .HasColumnName("price_override")
                .HasColumnType("decimal(18,2)");

            money.Property(m => m.Currency)
                .HasColumnName("price_override_currency")
                .HasConversion<string>();
        });

        builder.Property(v => v.Quantity)
            .HasColumnName("quantity")
            .IsRequired();

        builder.Property(v => v.AllowBackorder)
            .HasColumnName("allow_backorder")
            .HasDefaultValue(false);

        builder.Property(v => v.CreatedAt)
            .HasColumnName("created_at");

        builder.Property(v => v.UpdatedAt)
            .HasColumnName("updated_at");

        // Indexes
        builder.HasIndex(v => v.Sku).IsUnique();
        builder.HasIndex(v => v.ProductId);
    }
}
