using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qaflaty.Domain.Catalog.Aggregates.District;

namespace Qaflaty.Infrastructure.Persistence.Configurations.Catalog;

public class DistrictConfiguration : IEntityTypeConfiguration<District>
{
    public void Configure(EntityTypeBuilder<District> builder)
    {
        builder.ToTable("districts");
        builder.HasKey(d => d.Id);
        builder.Property(d => d.Id).HasColumnName("id").ValueGeneratedNever();
        builder.Property(d => d.CityId).HasColumnName("city_id");
        builder.Property(d => d.Name).HasColumnName("name").HasMaxLength(100).IsRequired();
        builder.Property(d => d.NameAr).HasColumnName("name_ar").HasMaxLength(100).IsRequired(false);
        builder.Property(d => d.IsActive).HasColumnName("is_active").HasDefaultValue(true);
        builder.HasIndex(d => d.CityId);
    }
}
