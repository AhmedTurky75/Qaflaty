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
            name.Property(n => n.FirstName)
                .HasColumnName("first_name")
                .HasMaxLength(50)
                .IsRequired();

            name.Property(n => n.LastName)
                .HasColumnName("last_name")
                .HasMaxLength(50)
                .IsRequired();

            name.Ignore(n => n.FullName);
            name.Ignore(n => n.Value);
        });

        builder.Property(c => c.Username)
            .HasColumnName("username")
            .HasMaxLength(50)
            .IsRequired();

        builder.HasIndex(c => c.Username).IsUnique();

        builder.OwnsOne(c => c.Phone, phone =>
        {
            phone.Property(p => p.Value)
                .HasColumnName("phone")
                .HasMaxLength(25);

            phone.Property(p => p.CountryCode)
                .HasColumnName("phone_country_code")
                .HasMaxLength(2)
                .IsRequired(false);
        });

        builder.OwnsOne(c => c.SecondaryPhone, phone =>
        {
            phone.Property(p => p.Value)
                .HasColumnName("secondary_phone")
                .HasMaxLength(25);

            phone.Property(p => p.CountryCode)
                .HasColumnName("secondary_phone_country_code")
                .HasMaxLength(2)
                .IsRequired(false);
        });

        builder.Property(c => c.IsVerified)
            .HasColumnName("is_verified")
            .HasDefaultValue(false);

        builder.Property(c => c.CreatedAt)
            .HasColumnName("created_at");

        builder.Property(c => c.UpdatedAt)
            .HasColumnName("updated_at");

        builder.OwnsMany(c => c.Addresses, addresses =>
        {
            addresses.ToTable("customer_addresses");

            addresses.WithOwner().HasForeignKey("store_customer_id");

            addresses.HasKey(a => a.Id);
            addresses.Property(a => a.Id)
                .HasColumnName("id")
                .ValueGeneratedNever();

            addresses.Property(a => a.Label)
                .HasColumnName("label")
                .HasMaxLength(50)
                .IsRequired();

            addresses.Property(a => a.Street)
                .HasColumnName("street")
                .HasMaxLength(255)
                .IsRequired();

            addresses.Property(a => a.City)
                .HasColumnName("city")
                .HasMaxLength(100)
                .IsRequired();

            addresses.Property(a => a.State)
                .HasColumnName("state")
                .HasMaxLength(100);

            addresses.Property(a => a.PostalCode)
                .HasColumnName("postal_code")
                .HasMaxLength(20);

            addresses.Property(a => a.Country)
                .HasColumnName("country")
                .HasMaxLength(100)
                .IsRequired();

            addresses.Property(a => a.IsDefault)
                .HasColumnName("is_default");

            addresses.Property(a => a.Latitude)
                .HasColumnName("latitude")
                .HasColumnType("decimal(10,7)")
                .IsRequired();

            addresses.Property(a => a.Longitude)
                .HasColumnName("longitude")
                .HasColumnType("decimal(10,7)")
                .IsRequired();

            addresses.Property(a => a.IsDeleted)
                .HasColumnName("is_deleted")
                .HasDefaultValue(false);

            addresses.Property(a => a.DeletedAt)
                .HasColumnName("deleted_at")
                .IsRequired(false);

            addresses.Property(a => a.CountryCode)
                .HasColumnName("country_code")
                .HasDefaultValue(0);

            addresses.Property(a => a.CityId)
                .HasColumnName("city_id")
                .IsRequired(false);

            addresses.Property(a => a.DistrictId)
                .HasColumnName("district_id")
                .IsRequired(false);
        });

        builder.HasMany(c => c.RefreshTokens)
            .WithOne()
            .HasForeignKey(rt => rt.StoreCustomerId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Ignore(c => c.DomainEvents);
    }
}
