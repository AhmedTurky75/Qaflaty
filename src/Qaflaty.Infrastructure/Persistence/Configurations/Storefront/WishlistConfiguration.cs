using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Storefront.Aggregates.Wishlist;

namespace Qaflaty.Infrastructure.Persistence.Configurations.Storefront;

public class WishlistConfiguration : IEntityTypeConfiguration<Wishlist>
{
    public void Configure(EntityTypeBuilder<Wishlist> builder)
    {
        builder.ToTable("wishlists");

        builder.HasKey(w => w.Id);

        builder.Property(w => w.Id)
            .HasConversion(id => id.Value, value => new WishlistId(value))
            .HasColumnName("id");

        builder.Property(w => w.CustomerId)
            .HasConversion(id => id.Value, value => new StoreCustomerId(value))
            .HasColumnName("customer_id");

        builder.Property(w => w.CreatedAt)
            .HasColumnName("created_at");

        builder.Property(w => w.UpdatedAt)
            .HasColumnName("updated_at");

        builder.HasMany(w => w.Items)
            .WithOne()
            .HasForeignKey(i => i.WishlistId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(w => w.CustomerId).IsUnique();

        builder.Ignore(w => w.DomainEvents);
    }
}
