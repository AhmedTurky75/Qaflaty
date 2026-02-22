using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Storefront.Aggregates.Cart;

namespace Qaflaty.Infrastructure.Persistence.Configurations.Storefront;

public class CartItemConfiguration : IEntityTypeConfiguration<CartItem>
{
    public void Configure(EntityTypeBuilder<CartItem> builder)
    {
        builder.ToTable("cart_items");

        builder.HasKey(i => i.Id);

        builder.Property(i => i.Id)
            .HasColumnName("id")
            .ValueGeneratedNever();

        builder.Property(i => i.CartId)
            .HasConversion(id => id.Value, value => new CartId(value))
            .HasColumnName("cart_id");

        builder.Property(i => i.ProductId)
            .HasConversion(id => id.Value, value => new ProductId(value))
            .HasColumnName("product_id");

        builder.Property(i => i.VariantId)
            .HasColumnName("variant_id");

        builder.Property(i => i.Quantity)
            .HasColumnName("quantity");

        builder.Property(i => i.AddedAt)
            .HasColumnName("added_at");

        builder.Property(i => i.UpdatedAt)
            .HasColumnName("updated_at");

        builder.HasIndex(i => new { i.CartId, i.ProductId, i.VariantId }).IsUnique();
    }
}
