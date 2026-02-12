using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Storefront.Aggregates.Cart;

namespace Qaflaty.Infrastructure.Persistence.Configurations.Storefront;

public class CartConfiguration : IEntityTypeConfiguration<Cart>
{
    public void Configure(EntityTypeBuilder<Cart> builder)
    {
        builder.ToTable("carts");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Id)
            .HasConversion(id => id.Value, value => new CartId(value))
            .HasColumnName("id");

        builder.Property(c => c.CustomerId)
            .HasConversion(id => id.Value, value => new StoreCustomerId(value))
            .HasColumnName("customer_id");

        builder.Property(c => c.CreatedAt)
            .HasColumnName("created_at");

        builder.Property(c => c.UpdatedAt)
            .HasColumnName("updated_at");

        builder.HasMany(c => c.Items)
            .WithOne()
            .HasForeignKey(i => i.CartId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Ignore(c => c.TotalItems);
        builder.Ignore(c => c.DomainEvents);

        builder.HasIndex(c => c.CustomerId).IsUnique();
    }
}
