using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Identity.Aggregates.StoreCustomer;
using Qaflaty.Domain.Identity.ValueObjects;

namespace Qaflaty.Infrastructure.Persistence.Configurations.Identity;

public class StoreCustomerConfiguration : IEntityTypeConfiguration<StoreCustomer>
{
    public void Configure(EntityTypeBuilder<StoreCustomer> builder)
    {
        builder.ToTable("store_customers");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Id)
            .HasConversion(id => id.Value, value => new StoreCustomerId(value))
            .HasColumnName("id");

        builder.OwnsOne(c => c.Email, email =>
        {
            email.Property(e => e.Value)
                .HasColumnName("email")
                .HasMaxLength(255)
                .IsRequired();

            email.HasIndex(e => e.Value).IsUnique();
        });

        builder.OwnsOne(c => c.PasswordHash, pw =>
        {
            pw.Property(p => p.Value)
                .HasColumnName("password_hash")
                .HasMaxLength(500)
                .IsRequired();
        });

        builder.OwnsOne(c => c.FullName, name =>
        {
            name.Property(n => n.Value)
                .HasColumnName("full_name")
                .HasMaxLength(100)
                .IsRequired();
        });

        builder.OwnsOne(c => c.Phone, phone =>
        {
            phone.Property(p => p.Value)
                .HasColumnName("phone")
                .HasMaxLength(20);
        });

        builder.Property(c => c.IsVerified)
            .HasColumnName("is_verified")
            .HasDefaultValue(false);

        builder.Property(c => c.CreatedAt)
            .HasColumnName("created_at");

        builder.Property(c => c.UpdatedAt)
            .HasColumnName("updated_at");

        // Addresses stored as JSONB
        builder.OwnsMany(c => c.Addresses, addresses =>
        {
            addresses.ToJson("addresses");

            addresses.Property(a => a.Label)
                .HasMaxLength(50);

            addresses.Property(a => a.Street)
                .HasMaxLength(255);

            addresses.Property(a => a.City)
                .HasMaxLength(100);

            addresses.Property(a => a.State)
                .HasMaxLength(100);

            addresses.Property(a => a.PostalCode)
                .HasMaxLength(20);

            addresses.Property(a => a.Country)
                .HasMaxLength(100);

            addresses.Property(a => a.IsDefault);
        });

        builder.HasMany(c => c.RefreshTokens)
            .WithOne()
            .HasForeignKey(rt => rt.StoreCustomerId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Ignore(c => c.DomainEvents);
    }
}
