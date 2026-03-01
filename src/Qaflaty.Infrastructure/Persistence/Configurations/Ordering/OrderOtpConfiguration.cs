using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Ordering.Aggregates.Order;

namespace Qaflaty.Infrastructure.Persistence.Configurations.Ordering;

public class OrderOtpConfiguration : IEntityTypeConfiguration<OrderOtp>
{
    public void Configure(EntityTypeBuilder<OrderOtp> builder)
    {
        builder.ToTable("order_otps");

        builder.HasKey(o => o.Id);

        builder.Property(o => o.Id)
            .HasColumnName("id");

        builder.Property(o => o.OrderId)
            .HasConversion(id => id.Value, value => new OrderId(value))
            .HasColumnName("order_id")
            .IsRequired();

        builder.Property(o => o.Code)
            .HasColumnName("code")
            .HasMaxLength(6)
            .IsRequired();

        builder.Property(o => o.Email)
            .HasColumnName("email")
            .HasMaxLength(256)
            .IsRequired();

        builder.Property(o => o.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        builder.Property(o => o.ExpiresAt)
            .HasColumnName("expires_at")
            .IsRequired();

        builder.Property(o => o.IsUsed)
            .HasColumnName("is_used")
            .IsRequired();

        builder.Property(o => o.AttemptCount)
            .HasColumnName("attempt_count")
            .IsRequired();

        builder.HasIndex(o => o.OrderId);
    }
}
