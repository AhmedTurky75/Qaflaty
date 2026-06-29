using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qaflaty.Domain.Common.Identifiers;
using ProductViewEntity = Qaflaty.Domain.Storefront.Aggregates.ProductView.ProductView;

namespace Qaflaty.Infrastructure.Persistence.Configurations.Storefront;

public class ProductViewConfiguration : IEntityTypeConfiguration<ProductViewEntity>
{
    public void Configure(EntityTypeBuilder<ProductViewEntity> builder)
    {
        builder.ToTable("product_views");

        builder.HasKey(v => v.Id);

        builder.Property(v => v.Id)
            .HasConversion(id => id.Value, value => new ProductViewId(value))
            .HasColumnName("id");

        builder.Property(v => v.StoreId)
            .HasConversion(id => id.Value, value => new StoreId(value))
            .HasColumnName("store_id");

        builder.Property(v => v.ProductId)
            .HasConversion(id => id.Value, value => new ProductId(value))
            .HasColumnName("product_id");

        builder.Property(v => v.CustomerId)
            .HasConversion(
                id => id != null ? id.Value.Value : (Guid?)null,
                value => value != null ? new StoreCustomerId(value.Value) : (StoreCustomerId?)null)
            .HasColumnName("customer_id");

        builder.Property(v => v.SessionId)
            .HasColumnName("session_id")
            .HasMaxLength(100);

        builder.Property(v => v.ViewedAt)
            .HasColumnName("viewed_at");

        builder.HasIndex(v => new { v.StoreId, v.ViewedAt });
        builder.HasIndex(v => new { v.ProductId, v.ViewedAt });
        builder.HasIndex(v => v.SessionId);
        builder.HasIndex(v => v.CustomerId);

        builder.Ignore(v => v.DomainEvents);
    }
}
