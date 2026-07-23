using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Storefront.Aggregates.Downsell;

namespace Qaflaty.Infrastructure.Persistence.Configurations.Storefront;

public class DownsellOfferConfiguration : IEntityTypeConfiguration<DownsellOffer>
{
    public void Configure(EntityTypeBuilder<DownsellOffer> builder)
    {
        builder.ToTable("downsell_offers");

        builder.HasKey(o => o.Id);

        builder.Property(o => o.Id).HasColumnName("id");

        builder.Property(o => o.StoreId)
            .HasConversion(id => id.Value, value => new StoreId(value))
            .HasColumnName("store_id");

        builder.Property(o => o.ProductId)
            .HasConversion(id => id.Value, value => new ProductId(value))
            .HasColumnName("product_id");

        builder.Property(o => o.PromoCodeId)
            .HasConversion(
                id => id == null ? (Guid?)null : id.Value.Value,
                value => value == null ? (PromoCodeId?)null : new PromoCodeId(value.Value))
            .HasColumnName("promo_code_id");

        builder.Property(o => o.IsEnabled).HasColumnName("is_enabled");

        builder.HasIndex(o => o.ProductId).IsUnique();
    }
}
