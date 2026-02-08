using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Ordering.Aggregates.Order;

namespace Qaflaty.Infrastructure.Persistence.Configurations.Ordering;

public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("orders");

        builder.HasKey(o => o.Id);

        builder.Property(o => o.Id)
            .HasConversion(id => id.Value, value => new OrderId(value))
            .HasColumnName("id");

        builder.Property(o => o.StoreId)
            .HasConversion(id => id.Value, value => new StoreId(value))
            .HasColumnName("store_id");

        builder.Property(o => o.CustomerId)
            .HasConversion(id => id.Value, value => new CustomerId(value))
            .HasColumnName("customer_id");

        builder.OwnsOne(o => o.OrderNumber, on =>
        {
            on.Property(n => n.Value)
                .HasColumnName("order_number")
                .HasMaxLength(10)
                .IsRequired();

            on.HasIndex(n => n.Value);
        });

        builder.Property(o => o.Status)
            .HasColumnName("status")
            .HasConversion<string>();

        builder.OwnsOne(o => o.Pricing, pricing =>
        {
            pricing.OwnsOne(p => p.Subtotal, money =>
            {
                money.Property(m => m.Amount).HasColumnName("subtotal").HasColumnType("decimal(18,2)");
                money.Property(m => m.Currency).HasColumnName("subtotal_currency").HasConversion<string>();
            });

            pricing.OwnsOne(p => p.DeliveryFee, money =>
            {
                money.Property(m => m.Amount).HasColumnName("delivery_fee").HasColumnType("decimal(18,2)");
                money.Property(m => m.Currency).HasColumnName("delivery_fee_currency").HasConversion<string>();
            });

            pricing.OwnsOne(p => p.Total, money =>
            {
                money.Property(m => m.Amount).HasColumnName("total").HasColumnType("decimal(18,2)");
                money.Property(m => m.Currency).HasColumnName("total_currency").HasConversion<string>();
            });
        });

        builder.OwnsOne(o => o.Payment, payment =>
        {
            payment.Property(p => p.Method).HasColumnName("payment_method").HasConversion<string>();
            payment.Property(p => p.Status).HasColumnName("payment_status").HasConversion<string>();
            payment.Property(p => p.TransactionId).HasColumnName("transaction_id").HasMaxLength(200);
            payment.Property(p => p.PaidAt).HasColumnName("paid_at");
            payment.Property(p => p.FailureReason).HasColumnName("payment_failure_reason").HasMaxLength(500);
        });

        builder.OwnsOne(o => o.Delivery, delivery =>
        {
            delivery.OwnsOne(d => d.Address, address =>
            {
                address.Property(a => a.Street).HasColumnName("delivery_street").HasMaxLength(200).IsRequired();
                address.Property(a => a.City).HasColumnName("delivery_city").HasMaxLength(100).IsRequired();
                address.Property(a => a.District).HasColumnName("delivery_district").HasMaxLength(100);
                address.Property(a => a.PostalCode).HasColumnName("delivery_postal_code").HasMaxLength(20);
                address.Property(a => a.Country).HasColumnName("delivery_country").HasMaxLength(100);
                address.Property(a => a.AdditionalInfo).HasColumnName("delivery_additional_info").HasMaxLength(500);
            });

            delivery.Property(d => d.Instructions).HasColumnName("delivery_instructions").HasMaxLength(500);
        });

        builder.OwnsOne(o => o.Notes, notes =>
        {
            notes.Property(n => n.CustomerNotes).HasColumnName("customer_notes").HasMaxLength(1000);
            notes.Property(n => n.MerchantNotes).HasColumnName("merchant_notes").HasMaxLength(2000);
        });

        builder.Property(o => o.CreatedAt)
            .HasColumnName("created_at");

        builder.Property(o => o.UpdatedAt)
            .HasColumnName("updated_at");

        builder.HasMany(o => o.Items)
            .WithOne()
            .HasForeignKey("OrderId")
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(o => o.StatusHistory)
            .WithOne()
            .HasForeignKey("OrderId")
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(o => o.StoreId);
        builder.HasIndex(o => o.CustomerId);

        builder.Ignore(o => o.DomainEvents);
    }
}
