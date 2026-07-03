using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qaflaty.Domain.Catalog.Aggregates.DeliveryZone;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Infrastructure.Persistence.Configurations.Catalog;

public class DeliveryZoneConfiguration : IEntityTypeConfiguration<DeliveryZone>
{
    public void Configure(EntityTypeBuilder<DeliveryZone> builder)
    {
        builder.ToTable("delivery_zones");

        builder.HasKey(z => z.Id);

        builder.Property(z => z.Id)
            .HasConversion(id => id.Value, value => new DeliveryZoneId(value))
            .HasColumnName("id");

        builder.Property(z => z.StoreId)
            .HasConversion(id => id.Value, value => new StoreId(value))
            .HasColumnName("store_id");

        builder.Property(z => z.Level)
            .HasColumnName("level")
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(z => z.ReferenceId)
            .HasColumnName("reference_id")
            .IsRequired();

        builder.Property(z => z.IsDeliveryEnabled)
            .HasColumnName("is_delivery_enabled")
            .HasDefaultValue(true);

        builder.Property(z => z.CustomDeliveryFee)
            .HasColumnName("custom_delivery_fee")
            .HasColumnType("decimal(10,2)")
            .IsRequired(false);

        builder.Property(z => z.CreatedAt).HasColumnName("created_at");
        builder.Property(z => z.UpdatedAt).HasColumnName("updated_at");

        builder.HasIndex(z => new { z.StoreId, z.Level, z.ReferenceId }).IsUnique();

        builder.Ignore(z => z.DomainEvents);
    }
}
