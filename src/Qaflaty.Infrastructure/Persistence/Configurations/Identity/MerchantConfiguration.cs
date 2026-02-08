using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Identity.Aggregates.Merchant;
using Qaflaty.Domain.Identity.ValueObjects;

namespace Qaflaty.Infrastructure.Persistence.Configurations.Identity;

public class MerchantConfiguration : IEntityTypeConfiguration<Merchant>
{
    public void Configure(EntityTypeBuilder<Merchant> builder)
    {
        builder.ToTable("merchants");

        builder.HasKey(m => m.Id);

        builder.Property(m => m.Id)
            .HasConversion(id => id.Value, value => new MerchantId(value))
            .HasColumnName("id");

        builder.OwnsOne(m => m.Email, email =>
        {
            email.Property(e => e.Value)
                .HasColumnName("email")
                .HasMaxLength(255)
                .IsRequired();

            email.HasIndex(e => e.Value).IsUnique();
        });

        builder.OwnsOne(m => m.PasswordHash, pw =>
        {
            pw.Property(p => p.Value)
                .HasColumnName("password_hash")
                .HasMaxLength(500)
                .IsRequired();
        });

        builder.OwnsOne(m => m.FullName, name =>
        {
            name.Property(n => n.Value)
                .HasColumnName("full_name")
                .HasMaxLength(100)
                .IsRequired();
        });

        builder.OwnsOne(m => m.Phone, phone =>
        {
            phone.Property(p => p.Value)
                .HasColumnName("phone")
                .HasMaxLength(20);
        });

        builder.Property(m => m.IsVerified)
            .HasColumnName("is_verified")
            .HasDefaultValue(false);

        builder.Property(m => m.CreatedAt)
            .HasColumnName("created_at");

        builder.Property(m => m.UpdatedAt)
            .HasColumnName("updated_at");

        builder.HasMany(m => m.RefreshTokens)
            .WithOne()
            .HasForeignKey(rt => rt.MerchantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Ignore(m => m.DomainEvents);
    }
}
