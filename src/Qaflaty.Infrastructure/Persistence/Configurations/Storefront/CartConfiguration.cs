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
            .HasConversion(
                (StoreCustomerId? id) => id == null ? (Guid?)null : id.Value.Value,
                (Guid? g) => g == null ? (StoreCustomerId?)null : new StoreCustomerId(g.Value))
            .HasColumnName("customer_id")
            .IsRequired(false);

        builder.Property(c => c.GuestId)
            .HasColumnName("guest_id")
            .HasMaxLength(36)
            .IsRequired(false);

        builder.Property(c => c.StoreId)
            .HasConversion(
                (StoreId? id) => id == null ? (Guid?)null : id.Value.Value,
                (Guid? g) => g == null ? (StoreId?)null : new StoreId(g.Value))
            .HasColumnName("store_id")
            .IsRequired(false);

        builder.Property(c => c.CreatedAt)
            .HasColumnName("created_at");

        builder.Property(c => c.UpdatedAt)
            .HasColumnName("updated_at");

        builder.HasMany(c => c.Items)
            .WithOne()
            .HasForeignKey(i => i.CartId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Navigation(c => c.Items)
            .HasField("_items")
            .UsePropertyAccessMode(PropertyAccessMode.Field);

        builder.Ignore(c => c.TotalItems);
        builder.Ignore(c => c.IsGuestCart);
        builder.Ignore(c => c.DomainEvents);

        // One cart per authenticated customer
        builder.HasIndex(c => c.CustomerId)
            .IsUnique()
            .HasFilter("customer_id IS NOT NULL");

        // One cart per guest session per store
        builder.HasIndex(c => new { c.GuestId, c.StoreId })
            .IsUnique()
            .HasFilter("guest_id IS NOT NULL");
    }
}
