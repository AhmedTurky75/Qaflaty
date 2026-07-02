using Qaflaty.Domain.Ordering.Aggregates.Return;

namespace Qaflaty.Application.Ordering.DTOs;

/// <summary>A product + quantity a customer wants to return.</summary>
public record ReturnItemSelection(Guid ProductId, int Quantity);

public record ReturnRequestItemDto(
    Guid ProductId,
    string ProductName,
    MoneyDto UnitPrice,
    int Quantity,
    MoneyDto LineTotal);

public record ReturnRequestDto(
    Guid Id,
    Guid OrderId,
    string OrderNumber,
    Guid CustomerId,
    string Status,
    string Reason,
    MoneyDto RefundAmount,
    string? MerchantNote,
    string? RefundTransactionId,
    List<ReturnRequestItemDto> Items,
    DateTime CreatedAt,
    DateTime? ResolvedAt);

public static class ReturnRequestMapper
{
    public static ReturnRequestDto ToDto(this ReturnRequest r, string currencyCode = "EGP") => new(
        r.Id.Value,
        r.OrderId.Value,
        r.OrderNumber,
        r.CustomerId.Value,
        r.Status.ToString(),
        r.Reason,
        new MoneyDto(r.RefundAmount.Amount, currencyCode),
        r.MerchantNote,
        r.RefundTransactionId,
        r.Items.Select(i => new ReturnRequestItemDto(
            i.ProductId.Value,
            i.ProductName,
            new MoneyDto(i.UnitPrice.Amount, currencyCode),
            i.Quantity,
            new MoneyDto(i.LineTotal.Amount, currencyCode)
        )).ToList(),
        r.CreatedAt,
        r.ResolvedAt);
}
