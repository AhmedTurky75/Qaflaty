using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Ordering.Aggregates.BlockedPhone;

namespace Qaflaty.Infrastructure.Persistence.Configurations.Ordering;

public class BlockedPhoneConfiguration : IEntityTypeConfiguration<BlockedPhone>
{
    public void Configure(EntityTypeBuilder<BlockedPhone> builder)
    {
        builder.ToTable("blocked_phones");

        builder.HasKey(b => b.Id);

        builder.Property(b => b.Id)
            .HasConversion(id => id.Value, value => new BlockedPhoneId(value))
            .HasColumnName("id");

        builder.Property(b => b.StoreId)
            .HasConversion(id => id.Value, value => new StoreId(value))
            .HasColumnName("store_id");

        builder.OwnsOne(b => b.Phone, phone =>
        {
            phone.Property(p => p.Value)
                .HasColumnName("phone")
                .HasMaxLength(20)
                .IsRequired();

            phone.Property(p => p.CountryCode)
                .HasColumnName("phone_country_code")
                .HasMaxLength(2);

            // One block per number per store — the lookup on every checkout rides this index.
            phone.HasIndex(p => p.Value);
        });

        builder.Property(b => b.Reason)
            .HasColumnName("reason")
            .HasMaxLength(500);

        builder.Property(b => b.BlockedBy)
            .HasColumnName("blocked_by")
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(b => b.SourceOrderId)
            .HasConversion(
                id => id.HasValue ? id.Value.Value : (Guid?)null,
                value => value.HasValue ? new OrderId(value.Value) : null)
            .HasColumnName("source_order_id");

        builder.Property(b => b.BlockedAt)
            .HasColumnName("blocked_at");

        builder.Property(b => b.UpdatedAt)
            .HasColumnName("updated_at");

        builder.HasIndex(b => b.StoreId);

        builder.Ignore(b => b.DomainEvents);
    }
}
