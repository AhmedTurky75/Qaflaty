using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Storefront.Aggregates.ProductReview;

namespace Qaflaty.Infrastructure.Persistence.Configurations.Storefront;

public class ProductReviewConfiguration : IEntityTypeConfiguration<ProductReview>
{
    public void Configure(EntityTypeBuilder<ProductReview> builder)
    {
        builder.ToTable("product_reviews");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.Id)
            .HasConversion(id => id.Value, value => new ProductReviewId(value))
            .HasColumnName("id");

        builder.Property(r => r.StoreId)
            .HasConversion(id => id.Value, value => new StoreId(value))
            .HasColumnName("store_id");

        builder.Property(r => r.ProductId)
            .HasConversion(id => id.Value, value => new ProductId(value))
            .HasColumnName("product_id");

        builder.Property(r => r.CustomerId)
            .HasConversion(id => id.Value, value => new StoreCustomerId(value))
            .HasColumnName("customer_id");

        builder.Property(r => r.CustomerName)
            .HasColumnName("customer_name")
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(r => r.OrderId)
            .HasConversion(
                id => id != null ? id.Value.Value : (Guid?)null,
                value => value != null ? new OrderId(value.Value) : (OrderId?)null)
            .HasColumnName("order_id");

        builder.Property(r => r.Rating)
            .HasColumnName("rating");

        builder.Property(r => r.Title)
            .HasColumnName("title")
            .HasMaxLength(200);

        builder.Property(r => r.Comment)
            .HasColumnName("comment")
            .HasMaxLength(4000);

        builder.Property(r => r.Status)
            .HasConversion<int>()
            .HasColumnName("status");

        builder.Property(r => r.IsVerifiedPurchase)
            .HasColumnName("is_verified_purchase");

        builder.Property(r => r.IsPinned)
            .HasColumnName("is_pinned");

        builder.Property(r => r.HelpfulCount)
            .HasColumnName("helpful_count");

        builder.Property(r => r.CreatedAt)
            .HasColumnName("created_at");

        builder.Property(r => r.UpdatedAt)
            .HasColumnName("updated_at");

        builder.Property(r => r.ApprovedAt)
            .HasColumnName("approved_at");

        builder.HasMany(r => r.Media)
            .WithOne()
            .HasForeignKey(m => m.ReviewId)
            .OnDelete(DeleteBehavior.Cascade);

        // One review per customer per product.
        builder.HasIndex(r => new { r.CustomerId, r.ProductId }).IsUnique();
        builder.HasIndex(r => new { r.ProductId, r.Status });
        builder.HasIndex(r => r.StoreId);

        builder.Ignore(r => r.DomainEvents);
    }
}
