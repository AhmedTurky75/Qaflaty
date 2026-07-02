using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Ordering.Aggregates.Return;
using Qaflaty.Infrastructure.Persistence.Converters;

namespace Qaflaty.Infrastructure.Persistence.Configurations.Ordering;

public class ReturnRequestConfiguration : IEntityTypeConfiguration<ReturnRequest>
{
    public void Configure(EntityTypeBuilder<ReturnRequest> builder)
    {
        builder.ToTable("return_requests");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.Id)
            .HasConversion(id => id.Value, value => new ReturnRequestId(value))
            .HasColumnName("id");

        builder.Property(r => r.StoreId)
            .HasConversion(id => id.Value, value => new StoreId(value))
            .HasColumnName("store_id");

        builder.Property(r => r.OrderId)
            .HasConversion(id => id.Value, value => new OrderId(value))
            .HasColumnName("order_id");

        builder.Property(r => r.CustomerId)
            .HasConversion(id => id.Value, value => new CustomerId(value))
            .HasColumnName("customer_id");

        builder.Property(r => r.OrderNumber)
            .HasColumnName("order_number")
            .HasMaxLength(10)
            .IsRequired();

        builder.Property(r => r.Status)
            .HasConversion<int>()
            .HasColumnName("status");

        builder.Property(r => r.Reason)
            .HasColumnName("reason")
            .HasMaxLength(1000)
            .IsRequired();

        builder.OwnsOne(r => r.RefundAmount, money =>
        {
            money.Property(m => m.Amount).HasColumnName("refund_amount").HasColumnType("decimal(18,2)");
        });

        builder.Navigation(r => r.RefundAmount).IsRequired();

        builder.Property(r => r.MerchantNote)
            .HasColumnName("merchant_note")
            .HasMaxLength(1000);

        builder.Property(r => r.RefundTransactionId)
            .HasColumnName("refund_transaction_id")
            .HasMaxLength(200);

        builder.Property(r => r.CreatedAt).HasColumnName("created_at");
        builder.Property(r => r.UpdatedAt).HasColumnName("updated_at");
        builder.Property(r => r.ResolvedAt).HasColumnName("resolved_at");

        builder.HasMany(r => r.Items)
            .WithOne()
            .HasForeignKey(i => i.ReturnRequestId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(r => r.StoreId);
        builder.HasIndex(r => r.OrderId);

        builder.Ignore(r => r.DomainEvents);
    }
}
