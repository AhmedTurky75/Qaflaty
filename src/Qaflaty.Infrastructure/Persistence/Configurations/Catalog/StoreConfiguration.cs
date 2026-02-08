using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qaflaty.Domain.Catalog.Aggregates.Store;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Infrastructure.Persistence.Configurations.Catalog;

public class StoreConfiguration : IEntityTypeConfiguration<Store>
{
    public void Configure(EntityTypeBuilder<Store> builder)
    {
        builder.ToTable("stores");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.Id)
            .HasConversion(id => id.Value, value => new StoreId(value))
            .HasColumnName("id");

        builder.Property(s => s.MerchantId)
            .HasConversion(id => id.Value, value => new MerchantId(value))
            .HasColumnName("merchant_id");

        builder.OwnsOne(s => s.Slug, slug =>
        {
            slug.Property(sl => sl.Value)
                .HasColumnName("slug")
                .HasMaxLength(50)
                .IsRequired();

            slug.HasIndex(sl => sl.Value).IsUnique();
        });

        builder.OwnsOne(s => s.Name, name =>
        {
            name.Property(n => n.Value)
                .HasColumnName("name")
                .HasMaxLength(100)
                .IsRequired();
        });

        builder.Property(s => s.Description)
            .HasColumnName("description")
            .HasMaxLength(500);

        builder.Property(s => s.CustomDomain)
            .HasColumnName("custom_domain")
            .HasMaxLength(255);

        builder.OwnsOne(s => s.Branding, branding =>
        {
            branding.Property(b => b.LogoUrl)
                .HasColumnName("logo_url")
                .HasMaxLength(500);

            branding.Property(b => b.PrimaryColor)
                .HasColumnName("primary_color")
                .HasMaxLength(7)
                .HasDefaultValue("#3B82F6");
        });

        builder.Property(s => s.Status)
            .HasColumnName("status")
            .HasConversion<string>();

        builder.OwnsOne(s => s.DeliverySettings, ds =>
        {
            ds.OwnsOne(d => d.DeliveryFee, fee =>
            {
                fee.Property(f => f.Amount).HasColumnName("delivery_fee").HasColumnType("decimal(18,2)");
                fee.Property(f => f.Currency).HasColumnName("delivery_fee_currency").HasConversion<string>();
            });

            ds.OwnsOne(d => d.FreeDeliveryThreshold, threshold =>
            {
                threshold.Property(t => t.Amount).HasColumnName("free_delivery_threshold").HasColumnType("decimal(18,2)");
                threshold.Property(t => t.Currency).HasColumnName("free_delivery_threshold_currency").HasConversion<string>();
            });
        });

        builder.Property(s => s.CreatedAt)
            .HasColumnName("created_at");

        builder.Property(s => s.UpdatedAt)
            .HasColumnName("updated_at");

        builder.HasIndex(s => s.CustomDomain)
            .IsUnique()
            .HasFilter("custom_domain IS NOT NULL");

        builder.Ignore(s => s.DomainEvents);
    }
}
