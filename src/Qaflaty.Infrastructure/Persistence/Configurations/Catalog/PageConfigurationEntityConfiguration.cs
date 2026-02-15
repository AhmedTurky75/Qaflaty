using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qaflaty.Domain.Catalog.Aggregates.PageConfiguration;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Infrastructure.Persistence.Configurations.Catalog;

public class PageConfigurationEntityConfiguration : IEntityTypeConfiguration<PageConfiguration>
{
    public void Configure(EntityTypeBuilder<PageConfiguration> builder)
    {
        builder.ToTable("page_configurations");

        builder.HasKey(pc => pc.Id);

        builder.Property(pc => pc.Id)
            .HasConversion(id => id.Value, value => new PageConfigurationId(value))
            .HasColumnName("id");

        builder.Property(pc => pc.StoreId)
            .HasConversion(id => id.Value, value => new StoreId(value))
            .HasColumnName("store_id");

        builder.Property(pc => pc.PageType)
            .HasColumnName("page_type")
            .HasConversion<string>();

        builder.Property(pc => pc.Slug)
            .HasColumnName("slug")
            .HasMaxLength(100)
            .IsRequired();

        // BilingualText Title - stored as owned type
        builder.OwnsOne(pc => pc.Title, t =>
        {
            t.Property(bt => bt.Arabic).HasColumnName("title_ar").HasMaxLength(200).IsRequired();
            t.Property(bt => bt.English).HasColumnName("title_en").HasMaxLength(200).IsRequired();
        });

        builder.Property(pc => pc.IsEnabled)
            .HasColumnName("is_enabled");

        // PageSeoSettings - owned type
        builder.OwnsOne(pc => pc.SeoSettings, seo =>
        {
            seo.OwnsOne(s => s.MetaTitle, mt =>
            {
                mt.Property(bt => bt.Arabic).HasColumnName("seo_title_ar").HasMaxLength(200);
                mt.Property(bt => bt.English).HasColumnName("seo_title_en").HasMaxLength(200);
            });
            seo.OwnsOne(s => s.MetaDescription, md =>
            {
                md.Property(bt => bt.Arabic).HasColumnName("seo_description_ar").HasMaxLength(500);
                md.Property(bt => bt.English).HasColumnName("seo_description_en").HasMaxLength(500);
            });
            seo.Property(s => s.OgImageUrl).HasColumnName("seo_og_image_url").HasMaxLength(500);
            seo.Property(s => s.NoIndex).HasColumnName("seo_no_index").HasDefaultValue(false);
            seo.Property(s => s.NoFollow).HasColumnName("seo_no_follow").HasDefaultValue(false);
        });

        builder.Property(pc => pc.ContentJson)
            .HasColumnName("content_json")
            .HasColumnType("jsonb");

        builder.Property(pc => pc.CreatedAt).HasColumnName("created_at");
        builder.Property(pc => pc.UpdatedAt).HasColumnName("updated_at");

        // Sections navigation
        builder.HasMany(pc => pc.Sections)
            .WithOne()
            .HasForeignKey(sc => sc.PageConfigurationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Navigation(pc => pc.Sections).AutoInclude();

        builder.HasIndex(pc => new { pc.StoreId, pc.Slug }).IsUnique();

        builder.Ignore(pc => pc.DomainEvents);
    }
}
