using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qaflaty.Domain.Identity.Aggregates.LoginOtp;

namespace Qaflaty.Infrastructure.Persistence.Configurations.Identity;

public class LoginOtpConfiguration : IEntityTypeConfiguration<LoginOtp>
{
    public void Configure(EntityTypeBuilder<LoginOtp> builder)
    {
        builder.ToTable("login_otps");

        builder.HasKey(o => o.Id);

        builder.Property(o => o.Id)
            .HasColumnName("id");

        builder.Property(o => o.Email)
            .HasColumnName("email")
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(o => o.Code)
            .HasColumnName("code")
            .HasMaxLength(6)
            .IsRequired();

        builder.Property(o => o.Purpose)
            .HasColumnName("purpose")
            .HasConversion<string>()
            .IsRequired();

        builder.Property(o => o.CreatedAt)
            .HasColumnName("created_at");

        builder.Property(o => o.ExpiresAt)
            .HasColumnName("expires_at");

        builder.Property(o => o.IsUsed)
            .HasColumnName("is_used")
            .HasDefaultValue(false);

        builder.Property(o => o.AttemptCount)
            .HasColumnName("attempt_count")
            .HasDefaultValue(0);

        builder.HasIndex(o => new { o.Email, o.Purpose });
    }
}
