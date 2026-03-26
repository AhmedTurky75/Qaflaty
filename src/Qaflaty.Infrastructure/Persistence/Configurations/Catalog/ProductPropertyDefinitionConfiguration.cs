using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qaflaty.Domain.Catalog.Aggregates.Product;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Infrastructure.Persistence.Configurations.Catalog;

public class ProductPropertyDefinitionConfiguration : IEntityTypeConfiguration<ProductPropertyDefinition>
{
    public void Configure(EntityTypeBuilder<ProductPropertyDefinition> builder)
    {
        builder.ToTable("product_property_definitions");

        builder.HasKey(d => d.Id);
        builder.Property(d => d.Id)
            .HasConversion(id => id.Value, value => new ProductPropertyDefinitionId(value))
            .HasColumnName("id");

        builder.Property(d => d.StoreId)
            .HasConversion(id => id.Value, value => new StoreId(value))
            .HasColumnName("store_id");

        builder.Property(d => d.Name)
            .HasColumnName("name")
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(d => d.DisplayName)
            .HasColumnName("display_name")
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(d => d.Type)
            .HasColumnName("type")
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(d => d.Options)
            .HasColumnName("options")
            .HasColumnType("jsonb")
            .IsRequired();

        builder.Property(d => d.IsRequired)
            .HasColumnName("is_required");

        builder.Property(d => d.IsFilterable)
            .HasColumnName("is_filterable");

        builder.Property(d => d.SortOrder)
            .HasColumnName("sort_order")
            .HasDefaultValue(0);

        builder.Property(d => d.CreatedAt).HasColumnName("created_at");
        builder.Property(d => d.UpdatedAt).HasColumnName("updated_at");

        builder.HasIndex(d => new { d.StoreId, d.Name }).IsUnique();

        builder.Ignore(d => d.DomainEvents);
    }
}
