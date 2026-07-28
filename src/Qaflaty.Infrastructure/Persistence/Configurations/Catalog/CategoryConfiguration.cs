using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qaflaty.Domain.Catalog.Aggregates.Category;
using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Infrastructure.Persistence.Configurations.Catalog;

public class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.ToTable("categories");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Id)
            .HasConversion(id => id.Value, value => new CategoryId(value))
            .HasColumnName("id");

        builder.Property(c => c.StoreId)
            .HasConversion(id => id.Value, value => new StoreId(value))
            .HasColumnName("store_id");

        builder.Property(c => c.ParentId)
            .HasConversion(
                id => id != null ? id.Value.Value : (Guid?)null,
                value => value.HasValue ? new CategoryId(value.Value) : null)
            .HasColumnName("parent_id");

        builder.OwnsOne(c => c.Name, name =>
        {
            name.Property(n => n.English)
                .HasColumnName("name")
                .HasMaxLength(100)
                .IsRequired();
            name.Property(n => n.Arabic)
                .HasColumnName("name_ar")
                .HasMaxLength(100)
                .IsRequired();
            name.Ignore(n => n.Value);
        });

        builder.OwnsOne(c => c.Slug, slug =>
        {
            slug.Property(s => s.Value)
                .HasColumnName("slug")
                .HasMaxLength(100)
                .IsRequired();
        });

        // Optional storefront HTML block. Owned + nullable: the two columns are null together when
        // the merchant authored no content for the category.
        builder.OwnsOne(c => c.Content, content =>
        {
            content.Property(x => x.English)
                .HasColumnName("content_html")
                .HasMaxLength(CategoryContent.MaxLength);
            content.Property(x => x.Arabic)
                .HasColumnName("content_html_ar")
                .HasMaxLength(CategoryContent.MaxLength);
        });

        builder.Property(c => c.ImageUrl)
            .HasColumnName("image_url")
            .HasMaxLength(Category.MaxImageUrlLength);

        builder.Property(c => c.IconName)
            .HasColumnName("icon_name")
            .HasMaxLength(Category.MaxIconNameLength);

        builder.Property(c => c.SortOrder)
            .HasColumnName("sort_order");

        builder.Property(c => c.CreatedAt)
            .HasColumnName("created_at");

        // Categories are listed store-wide ordered by their merchant-assigned rank.
        builder.HasIndex(c => new { c.StoreId, c.SortOrder });

        builder.HasIndex(c => c.StoreId);

        builder.Ignore(c => c.DomainEvents);
    }
}
