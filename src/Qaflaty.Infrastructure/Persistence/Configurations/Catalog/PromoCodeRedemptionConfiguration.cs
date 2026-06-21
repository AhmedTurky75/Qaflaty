using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qaflaty.Domain.Catalog.Aggregates.PromoCode;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Infrastructure.Persistence.Configurations.Catalog;

public class PromoCodeRedemptionConfiguration : IEntityTypeConfiguration<PromoCodeRedemption>
{
    public void Configure(EntityTypeBuilder<PromoCodeRedemption> builder)
    {
        builder.ToTable("promo_code_redemptions");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.Id)
            .HasConversion(id => id.Value, value => new PromoCodeRedemptionId(value))
            .HasColumnName("id");

        builder.Property(r => r.PromoCodeId)
            .HasConversion(id => id.Value, value => new PromoCodeId(value))
            .HasColumnName("promo_code_id");

        builder.Property(r => r.StoreId)
            .HasConversion(id => id.Value, value => new StoreId(value))
            .HasColumnName("store_id");

        builder.Property(r => r.OrderId)
            .HasConversion(id => id.Value, value => new OrderId(value))
            .HasColumnName("order_id");

        builder.Property(r => r.CustomerId)
            .HasConversion(id => id.Value, value => new CustomerId(value))
            .HasColumnName("customer_id");

        builder.Property(r => r.Code)
            .HasColumnName("code")
            .HasMaxLength(40)
            .IsRequired();

        builder.Property(r => r.DiscountAmount)
            .HasColumnName("discount_amount")
            .HasColumnType("decimal(18,2)");

        builder.Property(r => r.RedeemedAt)
            .HasColumnName("redeemed_at");

        builder.HasIndex(r => new { r.PromoCodeId, r.CustomerId });
        builder.HasIndex(r => r.OrderId);

        builder.Ignore(r => r.DomainEvents);
    }
}
