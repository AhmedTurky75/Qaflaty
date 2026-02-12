using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Storefront.Aggregates.Wishlist;

namespace Qaflaty.Infrastructure.Persistence.Configurations.Storefront;

public class WishlistItemConfiguration : IEntityTypeConfiguration<WishlistItem>
{
    public void Configure(EntityTypeBuilder<WishlistItem> builder)
    {
        builder.ToTable("wishlist_items");

        builder.HasKey(i => i.Id);

        builder.Property(i => i.Id)
            .HasColumnName("id");

        builder.Property(i => i.WishlistId)
            .HasConversion(id => id.Value, value => new WishlistId(value))
            .HasColumnName("wishlist_id");

        builder.Property(i => i.ProductId)
            .HasConversion(id => id.Value, value => new ProductId(value))
            .HasColumnName("product_id");

        builder.Property(i => i.VariantId)
            .HasColumnName("variant_id");

        builder.Property(i => i.AddedAt)
            .HasColumnName("added_at");

        builder.HasIndex(i => new { i.WishlistId, i.ProductId, i.VariantId }).IsUnique();
    }
}
