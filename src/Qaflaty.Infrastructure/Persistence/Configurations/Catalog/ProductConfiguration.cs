using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qaflaty.Domain.Catalog.Aggregates.Product;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Infrastructure.Persistence.Configurations.Catalog;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("products");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Id)
            .HasConversion(id => id.Value, value => new ProductId(value))
            .HasColumnName("id");

        builder.Property(p => p.StoreId)
            .HasConversion(id => id.Value, value => new StoreId(value))
            .HasColumnName("store_id");

        builder.Property(p => p.CategoryId)
            .HasConversion(
                id => id != null ? id.Value.Value : (Guid?)null,
                value => value.HasValue ? new CategoryId(value.Value) : null)
            .HasColumnName("category_id");

        builder.OwnsOne(p => p.Name, name =>
        {
            name.Property(n => n.Value)
                .HasColumnName("name")
                .HasMaxLength(200)
                .IsRequired();
        });

        builder.OwnsOne(p => p.Slug, slug =>
        {
            slug.Property(s => s.Value)
                .HasColumnName("slug")
                .HasMaxLength(100)
                .IsRequired();
        });

        builder.Property(p => p.Description)
            .HasColumnName("description")
            .HasMaxLength(2000);

        builder.OwnsOne(p => p.Pricing, pricing =>
        {
            pricing.OwnsOne(pr => pr.Price, money =>
            {
                money.Property(m => m.Amount).HasColumnName("price").HasColumnType("decimal(18,2)");
                money.Property(m => m.Currency).HasColumnName("price_currency").HasConversion<string>();
            });

            pricing.OwnsOne(pr => pr.CompareAtPrice, money =>
            {
                money.Property(m => m.Amount).HasColumnName("compare_at_price").HasColumnType("decimal(18,2)");
                money.Property(m => m.Currency).HasColumnName("compare_at_price_currency").HasConversion<string>();
            });
        });

        builder.OwnsOne(p => p.Inventory, inv =>
        {
            inv.Property(i => i.Quantity).HasColumnName("stock_quantity");
            inv.Property(i => i.Sku).HasColumnName("sku").HasMaxLength(100);
            inv.Property(i => i.TrackInventory).HasColumnName("track_inventory");
        });

        builder.Property(p => p.Status)
            .HasColumnName("status")
            .HasConversion<string>();

        // Images stored as JSON in PostgreSQL
        // Access via backing field _images
        builder.Ignore(p => p.Images);

        // Variant Options stored as JSONB
        builder.OwnsMany(p => p.VariantOptions, variantOptions =>
        {
            variantOptions.ToJson("variant_options");
            variantOptions.Property(vo => vo.Name).HasMaxLength(50);
        });

        // Variant relationships
        builder.HasMany(p => p.Variants)
            .WithOne()
            .HasForeignKey(v => v.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        // Inventory movements
        builder.HasMany(p => p.InventoryMovements)
            .WithOne()
            .HasForeignKey(im => im.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        // HasVariants is a computed property in the domain model, not a database column
        builder.Ignore(p => p.HasVariants);

        builder.Property(p => p.CreatedAt)
            .HasColumnName("created_at");

        builder.Property(p => p.UpdatedAt)
            .HasColumnName("updated_at");

        // Unique slug per store index is handled by the slug column within OwnsOne

        builder.Ignore(p => p.DomainEvents);
    }
}
