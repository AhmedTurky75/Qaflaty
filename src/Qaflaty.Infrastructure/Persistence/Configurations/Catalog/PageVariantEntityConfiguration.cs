using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qaflaty.Domain.Catalog.Aggregates.PageConfiguration;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Infrastructure.Persistence.Configurations.Catalog;

public class PageVariantEntityConfiguration : IEntityTypeConfiguration<PageVariant>
{
    public void Configure(EntityTypeBuilder<PageVariant> builder)
    {
        builder.ToTable("page_variants");

        builder.HasKey(v => v.Id);

        builder.Property(v => v.Id)
            .HasConversion(id => id.Value, value => new PageVariantId(value))
            .HasColumnName("id");

        builder.Property(v => v.PageConfigurationId)
            .HasConversion(id => id.Value, value => new PageConfigurationId(value))
            .HasColumnName("page_configuration_id");

        builder.Property(v => v.Name)
            .HasColumnName("name")
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(v => v.Weight)
            .HasColumnName("weight")
            .HasDefaultValue(1);

        builder.Property(v => v.IsActive)
            .HasColumnName("is_active")
            .HasDefaultValue(true);

        builder.Property(v => v.SectionsJson)
            .HasColumnName("sections_json")
            .HasColumnType("jsonb");

        builder.Property(v => v.Impressions)
            .HasColumnName("impressions")
            .HasDefaultValue(0L);

        builder.Property(v => v.Conversions)
            .HasColumnName("conversions")
            .HasDefaultValue(0L);
    }
}
