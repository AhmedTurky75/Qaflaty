using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qaflaty.Domain.Catalog.Aggregates.Country;

namespace Qaflaty.Infrastructure.Persistence.Configurations.Catalog;

public class CountryConfiguration : IEntityTypeConfiguration<Country>
{
    public void Configure(EntityTypeBuilder<Country> builder)
    {
        builder.ToTable("countries");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).HasColumnName("id").ValueGeneratedNever();
        builder.Property(c => c.Name).HasColumnName("name").HasMaxLength(100).IsRequired();
        builder.Property(c => c.Code).HasColumnName("code").HasMaxLength(2).IsRequired();
        builder.Property(c => c.IsActive).HasColumnName("is_active").HasDefaultValue(true);
        builder.HasIndex(c => c.Code).IsUnique();
    }
}
