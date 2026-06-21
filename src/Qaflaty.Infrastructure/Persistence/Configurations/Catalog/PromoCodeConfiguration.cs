using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qaflaty.Domain.Catalog.Aggregates.PromoCode;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Infrastructure.Persistence.Configurations.Catalog;

public class PromoCodeConfiguration : IEntityTypeConfiguration<PromoCode>
{
    public void Configure(EntityTypeBuilder<PromoCode> builder)
    {
        builder.ToTable("promo_codes");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Id)
            .HasConversion(id => id.Value, value => new PromoCodeId(value))
            .HasColumnName("id");

        builder.Property(p => p.StoreId)
            .HasConversion(id => id.Value, value => new StoreId(value))
            .HasColumnName("store_id");

        builder.Property(p => p.Code)
            .HasColumnName("code")
            .HasMaxLength(40)
            .IsRequired();

        builder.Property(p => p.Description)
            .HasColumnName("description")
            .HasMaxLength(500);

        builder.Property(p => p.DiscountType)
            .HasConversion<int>()
            .HasColumnName("discount_type");

        builder.Property(p => p.Value)
            .HasColumnName("value")
            .HasColumnType("decimal(18,2)");

        builder.Property(p => p.MinimumOrderAmount)
            .HasColumnName("minimum_order_amount")
            .HasColumnType("decimal(18,2)");

        builder.Property(p => p.MaxDiscountAmount)
            .HasColumnName("max_discount_amount")
            .HasColumnType("decimal(18,2)");

        builder.Property(p => p.StartsAt)
            .HasColumnName("starts_at");

        builder.Property(p => p.ExpiresAt)
            .HasColumnName("expires_at");

        builder.Property(p => p.UsageLimit)
            .HasColumnName("usage_limit");

        builder.Property(p => p.UsageLimitPerCustomer)
            .HasColumnName("usage_limit_per_customer");

        builder.Property(p => p.TimesUsed)
            .HasColumnName("times_used");

        builder.Property(p => p.IsActive)
            .HasColumnName("is_active");

        builder.Property(p => p.CreatedAt)
            .HasColumnName("created_at");

        builder.Property(p => p.UpdatedAt)
            .HasColumnName("updated_at");

        // One code string per store (codes are stored uppercased).
        builder.HasIndex(p => new { p.StoreId, p.Code }).IsUnique();

        builder.Ignore(p => p.DomainEvents);
    }
}
