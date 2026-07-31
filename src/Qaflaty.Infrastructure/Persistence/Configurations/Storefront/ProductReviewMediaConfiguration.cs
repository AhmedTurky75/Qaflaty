using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Storefront.Aggregates.ProductReview;

namespace Qaflaty.Infrastructure.Persistence.Configurations.Storefront;

public class ProductReviewMediaConfiguration : IEntityTypeConfiguration<ProductReviewMedia>
{
    public void Configure(EntityTypeBuilder<ProductReviewMedia> builder)
    {
        builder.ToTable("product_review_media");

        builder.HasKey(m => m.Id);

        builder.Property(m => m.Id)
            .HasColumnName("id");

        builder.Property(m => m.ReviewId)
            .HasConversion(id => id.Value, value => new ProductReviewId(value))
            .HasColumnName("review_id");

        builder.Property(m => m.Url)
            .HasColumnName("url")
            .HasMaxLength(1000)
            .IsRequired();

        builder.Property(m => m.Type)
            .HasConversion<int>()
            .HasColumnName("type");

        builder.Property(m => m.SortOrder)
            .HasColumnName("sort_order");

        builder.HasIndex(m => m.ReviewId);
    }
}
