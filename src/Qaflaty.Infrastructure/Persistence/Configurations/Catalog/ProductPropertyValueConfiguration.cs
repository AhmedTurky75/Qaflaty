using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qaflaty.Domain.Catalog.Aggregates.Product;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Infrastructure.Persistence.Configurations.Catalog;

public class ProductPropertyValueConfiguration : IEntityTypeConfiguration<ProductPropertyValue>
{
    public void Configure(EntityTypeBuilder<ProductPropertyValue> builder)
    {
        builder.ToTable("product_property_values");

        builder.HasKey(v => v.Id);
        builder.Property(v => v.Id)
            .HasColumnName("id")
            .ValueGeneratedNever();

        builder.Property(v => v.ProductId)
            .HasConversion(id => id.Value, value => new ProductId(value))
            .HasColumnName("product_id");

        builder.Property(v => v.DefinitionId)
            .HasConversion(id => id.Value, value => new ProductPropertyDefinitionId(value))
            .HasColumnName("definition_id");

        builder.Property(v => v.Value)
            .HasColumnName("value")
            .HasMaxLength(2000)
            .IsRequired();

        builder.HasIndex(v => new { v.ProductId, v.DefinitionId }).IsUnique();
    }
}
