using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qaflaty.Domain.Catalog.Aggregates.PaymentMethodDefinition;

namespace Qaflaty.Infrastructure.Persistence.Configurations.Catalog;

public class PaymentMethodDefinitionConfiguration : IEntityTypeConfiguration<PaymentMethodDefinition>
{
    public void Configure(EntityTypeBuilder<PaymentMethodDefinition> builder)
    {
        builder.ToTable("payment_method_definitions");

        builder.HasKey(d => d.Id);

        builder.Property(d => d.Id)
            .HasColumnName("id")
            .ValueGeneratedNever();

        builder.Property(d => d.Key)
            .HasColumnName("key")
            .HasMaxLength(50)
            .IsRequired();

        builder.HasIndex(d => d.Key).IsUnique();

        builder.Property(d => d.DefaultLabel)
            .HasColumnName("default_label")
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(d => d.DefaultDescription)
            .HasColumnName("default_description")
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(d => d.IsActive)
            .HasColumnName("is_active")
            .IsRequired();

        builder.Property(d => d.SortOrder)
            .HasColumnName("sort_order")
            .IsRequired();

        builder.HasData(
            PaymentMethodDefinition.Create(1, "COD", "Cash on Delivery", "Pay when you receive your order", 1),
            PaymentMethodDefinition.Create(2, "Visa", "Visa", "Pay with Visa card", 2)
        );
    }
}
