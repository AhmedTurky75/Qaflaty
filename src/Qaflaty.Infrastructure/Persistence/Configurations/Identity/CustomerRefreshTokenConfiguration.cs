using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Identity.Aggregates.StoreCustomer;

namespace Qaflaty.Infrastructure.Persistence.Configurations.Identity;

public class CustomerRefreshTokenConfiguration : IEntityTypeConfiguration<CustomerRefreshToken>
{
    public void Configure(EntityTypeBuilder<CustomerRefreshToken> builder)
    {
        builder.ToTable("customer_refresh_tokens");

        builder.HasKey(rt => rt.Id);

        builder.Property(rt => rt.Id)
            .HasColumnName("id");

        builder.Property(rt => rt.StoreCustomerId)
            .HasConversion(id => id.Value, value => new StoreCustomerId(value))
            .HasColumnName("store_customer_id");

        builder.Property(rt => rt.Token)
            .HasColumnName("token")
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(rt => rt.ExpiresAt)
            .HasColumnName("expires_at");

        builder.Property(rt => rt.CreatedAt)
            .HasColumnName("created_at");

        builder.Property(rt => rt.RevokedAt)
            .HasColumnName("revoked_at");

        builder.HasIndex(rt => rt.Token).IsUnique();
    }
}
