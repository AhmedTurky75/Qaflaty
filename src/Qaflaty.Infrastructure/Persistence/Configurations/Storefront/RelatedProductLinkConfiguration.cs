using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Storefront.Aggregates.RelatedProduct;

namespace Qaflaty.Infrastructure.Persistence.Configurations.Storefront;

public class RelatedProductLinkConfiguration : IEntityTypeConfiguration<RelatedProductLink>
{
    public void Configure(EntityTypeBuilder<RelatedProductLink> builder)
    {
        builder.ToTable("related_product_links");

        builder.HasKey(l => l.Id);

        builder.Property(l => l.Id)
            .HasColumnName("id");

        builder.Property(l => l.StoreId)
            .HasConversion(id => id.Value, value => new StoreId(value))
            .HasColumnName("store_id");

        builder.Property(l => l.ProductId)
            .HasConversion(id => id.Value, value => new ProductId(value))
            .HasColumnName("product_id");

        builder.Property(l => l.RelatedProductId)
            .HasConversion(id => id.Value, value => new ProductId(value))
            .HasColumnName("related_product_id");

        builder.Property(l => l.SortOrder)
            .HasColumnName("sort_order");

        builder.HasIndex(l => l.ProductId);
        builder.HasIndex(l => new { l.ProductId, l.RelatedProductId }).IsUnique();
    }
}
