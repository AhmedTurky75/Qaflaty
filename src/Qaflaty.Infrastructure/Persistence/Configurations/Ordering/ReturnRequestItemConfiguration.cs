using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Ordering.Aggregates.Return;
using Qaflaty.Infrastructure.Persistence.Converters;

namespace Qaflaty.Infrastructure.Persistence.Configurations.Ordering;

public class ReturnRequestItemConfiguration : IEntityTypeConfiguration<ReturnRequestItem>
{
    public void Configure(EntityTypeBuilder<ReturnRequestItem> builder)
    {
        builder.ToTable("return_request_items");

        builder.HasKey(i => i.Id);

        builder.Property(i => i.Id)
            .HasColumnName("id");

        builder.Property(i => i.ReturnRequestId)
            .HasConversion(id => id.Value, value => new ReturnRequestId(value))
            .HasColumnName("return_request_id");

        builder.Property(i => i.ProductId)
            .HasConversion(id => id.Value, value => new ProductId(value))
            .HasColumnName("product_id");

        builder.Property(i => i.ProductName)
            .HasColumnName("product_name")
            .HasMaxLength(300)
            .IsRequired();

        builder.OwnsOne(i => i.UnitPrice, money =>
        {
            money.Property(m => m.Amount).HasColumnName("unit_price").HasColumnType("decimal(18,2)");
        });

        builder.Navigation(i => i.UnitPrice).IsRequired();

        builder.Property(i => i.Quantity)
            .HasColumnName("quantity");

        builder.Ignore(i => i.LineTotal);

        builder.HasIndex(i => i.ReturnRequestId);
    }
}
