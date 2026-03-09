using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Identity.Aggregates.Merchant;
using Qaflaty.Domain.Identity.Enums;

namespace Qaflaty.Infrastructure.Persistence.Configurations.Identity;

public class MerchantStoreAssignmentConfiguration : IEntityTypeConfiguration<MerchantStoreAssignment>
{
    public void Configure(EntityTypeBuilder<MerchantStoreAssignment> builder)
    {
        builder.ToTable("merchant_store_assignments");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.Id)
            .HasColumnName("id");

        builder.Property(a => a.MerchantId)
            .HasConversion(id => id.Value, value => new MerchantId(value))
            .HasColumnName("merchant_id");

        builder.Property(a => a.StoreId)
            .HasConversion(id => id.Value, value => new StoreId(value))
            .HasColumnName("store_id");

        builder.Property(a => a.Role)
            .HasColumnName("role")
            .HasConversion<string>();

        builder.Property(a => a.IsActive)
            .HasColumnName("is_active")
            .HasDefaultValue(true);

        builder.Property(a => a.InvitedBy)
            .HasConversion(
                id => id.HasValue ? id.Value.Value : (Guid?)null,
                value => value.HasValue ? new MerchantId(value.Value) : (MerchantId?)null)
            .HasColumnName("invited_by");

        builder.Property(a => a.CreatedAt)
            .HasColumnName("created_at");

        builder.HasIndex(a => new { a.MerchantId, a.StoreId });
    }
}
