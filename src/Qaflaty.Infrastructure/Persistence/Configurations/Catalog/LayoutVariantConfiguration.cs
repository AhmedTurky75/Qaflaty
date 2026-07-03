using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qaflaty.Domain.Catalog.Aggregates.LayoutVariant;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Infrastructure.Persistence.Configurations.Catalog;

public class LayoutVariantConfiguration : IEntityTypeConfiguration<LayoutVariant>
{
    public void Configure(EntityTypeBuilder<LayoutVariant> builder)
    {
        builder.ToTable("layout_variants");

        builder.HasKey(v => v.Id);

        builder.Property(v => v.Id)
            .HasConversion(id => id.Value, value => new LayoutVariantId(value))
            .HasColumnName("id");

        builder.Property(v => v.Type)
            .HasConversion<int>()
            .HasColumnName("type");

        builder.Property(v => v.Code)
            .HasColumnName("code")
            .HasMaxLength(LayoutVariant.MaxCodeLength)
            .IsRequired();

        builder.Property(v => v.NameEn)
            .HasColumnName("name_en")
            .HasMaxLength(LayoutVariant.MaxNameLength)
            .IsRequired();

        builder.Property(v => v.NameAr)
            .HasColumnName("name_ar")
            .HasMaxLength(LayoutVariant.MaxNameLength)
            .IsRequired();

        builder.Property(v => v.SortOrder)
            .HasColumnName("sort_order");

        builder.Property(v => v.IsActive)
            .HasColumnName("is_active");

        // One code per slot.
        builder.HasIndex(v => new { v.Type, v.Code }).IsUnique();

        builder.Ignore(v => v.DomainEvents);
    }
}
