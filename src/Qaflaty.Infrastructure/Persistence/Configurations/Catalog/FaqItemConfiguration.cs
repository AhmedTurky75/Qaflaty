using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qaflaty.Domain.Catalog.Aggregates.FaqItem;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Infrastructure.Persistence.Configurations.Catalog;

public class FaqItemConfiguration : IEntityTypeConfiguration<FaqItem>
{
    public void Configure(EntityTypeBuilder<FaqItem> builder)
    {
        builder.ToTable("faq_items");

        builder.HasKey(f => f.Id);

        builder.Property(f => f.Id)
            .HasConversion(id => id.Value, value => new FaqItemId(value))
            .HasColumnName("id");

        builder.Property(f => f.StoreId)
            .HasConversion(id => id.Value, value => new StoreId(value))
            .HasColumnName("store_id");

        builder.OwnsOne(f => f.Question, q =>
        {
            q.Property(bt => bt.Arabic).HasColumnName("question_ar").HasMaxLength(500).IsRequired();
            q.Property(bt => bt.English).HasColumnName("question_en").HasMaxLength(500).IsRequired();
        });

        builder.OwnsOne(f => f.Answer, a =>
        {
            a.Property(bt => bt.Arabic).HasColumnName("answer_ar").HasMaxLength(2000).IsRequired();
            a.Property(bt => bt.English).HasColumnName("answer_en").HasMaxLength(2000).IsRequired();
        });

        builder.Property(f => f.SortOrder)
            .HasColumnName("sort_order");

        builder.Property(f => f.IsPublished)
            .HasColumnName("is_published")
            .HasDefaultValue(true);

        builder.Property(f => f.CreatedAt).HasColumnName("created_at");
        builder.Property(f => f.UpdatedAt).HasColumnName("updated_at");

        builder.HasIndex(f => new { f.StoreId, f.SortOrder });
    }
}
