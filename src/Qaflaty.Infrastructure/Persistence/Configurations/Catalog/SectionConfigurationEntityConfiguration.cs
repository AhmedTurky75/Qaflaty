using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qaflaty.Domain.Catalog.Aggregates.PageConfiguration;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Infrastructure.Persistence.Configurations.Catalog;

public class SectionConfigurationEntityConfiguration : IEntityTypeConfiguration<SectionConfiguration>
{
    public void Configure(EntityTypeBuilder<SectionConfiguration> builder)
    {
        builder.ToTable("section_configurations");

        builder.HasKey(sc => sc.Id);

        builder.Property(sc => sc.Id)
            .HasConversion(id => id.Value, value => new SectionConfigurationId(value))
            .HasColumnName("id");

        builder.Property(sc => sc.PageConfigurationId)
            .HasConversion(id => id.Value, value => new PageConfigurationId(value))
            .HasColumnName("page_configuration_id");

        builder.Property(sc => sc.SectionType)
            .HasColumnName("section_type")
            .HasConversion<string>();

        builder.Property(sc => sc.VariantId)
            .HasColumnName("variant_id")
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(sc => sc.IsEnabled)
            .HasColumnName("is_enabled")
            .HasDefaultValue(true);

        builder.Property(sc => sc.SortOrder)
            .HasColumnName("sort_order");

        builder.Property(sc => sc.ContentJson)
            .HasColumnName("content_json")
            .HasColumnType("jsonb");

        builder.Property(sc => sc.SettingsJson)
            .HasColumnName("settings_json")
            .HasColumnType("jsonb");
    }
}
