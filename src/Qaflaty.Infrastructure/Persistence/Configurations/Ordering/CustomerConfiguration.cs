using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Ordering.Aggregates.Customer;

namespace Qaflaty.Infrastructure.Persistence.Configurations.Ordering;

public class CustomerConfiguration : IEntityTypeConfiguration<Customer>
{
    public void Configure(EntityTypeBuilder<Customer> builder)
    {
        builder.ToTable("customers");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Id)
            .HasConversion(id => id.Value, value => new CustomerId(value))
            .HasColumnName("id");

        builder.Property(c => c.StoreId)
            .HasConversion(id => id.Value, value => new StoreId(value))
            .HasColumnName("store_id");

        builder.OwnsOne(c => c.Contact, contact =>
        {
            contact.OwnsOne(ct => ct.FullName, name =>
            {
                name.Property(n => n.Value)
                    .HasColumnName("full_name")
                    .HasMaxLength(100)
                    .IsRequired();
            });

            contact.OwnsOne(ct => ct.Phone, phone =>
            {
                phone.Property(p => p.Value)
                    .HasColumnName("phone")
                    .HasMaxLength(20)
                    .IsRequired();
            });

            contact.OwnsOne(ct => ct.Email, email =>
            {
                email.Property(e => e.Value)
                    .HasColumnName("email")
                    .HasMaxLength(255);
            });
        });

        builder.OwnsOne(c => c.Address, address =>
        {
            address.Property(a => a.Street).HasColumnName("street").HasMaxLength(200).IsRequired();
            address.Property(a => a.City).HasColumnName("city").HasMaxLength(100).IsRequired();
            address.Property(a => a.District).HasColumnName("district").HasMaxLength(100);
            address.Property(a => a.PostalCode).HasColumnName("postal_code").HasMaxLength(20);
            address.Property(a => a.Country).HasColumnName("country").HasMaxLength(100);
            address.Property(a => a.AdditionalInfo).HasColumnName("additional_info").HasMaxLength(500);
        });

        builder.Property(c => c.Notes)
            .HasColumnName("notes")
            .HasMaxLength(2000);

        builder.Property(c => c.CreatedAt)
            .HasColumnName("created_at");

        builder.HasIndex(c => c.StoreId);

        builder.Ignore(c => c.DomainEvents);
    }
}
