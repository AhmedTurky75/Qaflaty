using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;
using Qaflaty.Domain.Common.ValueObjects;
using Qaflaty.Domain.Ordering.Enums;
using Qaflaty.Domain.Ordering.Errors;

namespace Qaflaty.Domain.Ordering.Aggregates.Return;

/// <summary>
/// A customer-initiated request to return some or all items of a delivered order. The merchant
/// approves or rejects it; on approval the refund is issued and the order marked refunded.
/// </summary>
public sealed class ReturnRequest : AggregateRoot<ReturnRequestId>
{
    public const int MaxReasonLength = 1000;

    public StoreId StoreId { get; private set; }
    public OrderId OrderId { get; private set; }
    public CustomerId CustomerId { get; private set; }
    public string OrderNumber { get; private set; } = null!;
    public ReturnStatus Status { get; private set; }
    public string Reason { get; private set; } = null!;
    public Money RefundAmount { get; private set; } = null!;
    public string? MerchantNote { get; private set; }
    public string? RefundTransactionId { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }
    public DateTime? ResolvedAt { get; private set; }

    private readonly List<ReturnRequestItem> _items = [];
    public IReadOnlyList<ReturnRequestItem> Items => _items.AsReadOnly();

    private ReturnRequest() : base(ReturnRequestId.Empty) { }

    /// <summary>
    /// Creates a return for a delivered order. <paramref name="selections"/> maps a product id to the
    /// quantity being returned; each is validated against what was actually ordered.
    /// </summary>
    public static Result<ReturnRequest> Create(
        Order.Order order,
        IReadOnlyCollection<(ProductId ProductId, int Quantity)> selections,
        string reason)
    {
        if (order.Status != OrderStatus.Delivered)
            return Result.Failure<ReturnRequest>(ReturnErrors.OrderNotEligible);

        if (string.IsNullOrWhiteSpace(reason))
            return Result.Failure<ReturnRequest>(ReturnErrors.ReasonRequired);

        if (selections is null || selections.Count == 0)
            return Result.Failure<ReturnRequest>(ReturnErrors.NoItems);

        var id = ReturnRequestId.New();
        var now = DateTime.UtcNow;
        var request = new ReturnRequest
        {
            Id = id,
            StoreId = order.StoreId,
            OrderId = order.Id,
            CustomerId = order.CustomerId,
            OrderNumber = order.OrderNumber.Value,
            Status = ReturnStatus.Requested,
            Reason = reason.Trim()[..Math.Min(reason.Trim().Length, MaxReasonLength)],
            CreatedAt = now,
            UpdatedAt = now
        };

        var currency = order.Pricing.Total.Currency;
        var refund = Money.Zero(currency);

        foreach (var (productId, quantity) in selections)
        {
            var orderItem = order.Items.FirstOrDefault(i => i.ProductId.Value == productId.Value);
            if (orderItem is null)
                return Result.Failure<ReturnRequest>(ReturnErrors.ItemNotInOrder);

            if (quantity < 1 || quantity > orderItem.Quantity)
                return Result.Failure<ReturnRequest>(ReturnErrors.InvalidQuantity);

            var item = ReturnRequestItem.Create(
                id, orderItem.ProductId, orderItem.ProductName, orderItem.UnitPrice, quantity);
            request._items.Add(item);
            refund = refund.Add(item.LineTotal);
        }

        request.RefundAmount = refund;
        return Result.Success(request);
    }

    public Result Approve(string? merchantNote)
    {
        if (Status != ReturnStatus.Requested)
            return Result.Failure(ReturnErrors.InvalidStatusTransition);

        Status = ReturnStatus.Approved;
        MerchantNote = merchantNote?.Trim();
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public Result Reject(string reason)
    {
        if (Status != ReturnStatus.Requested)
            return Result.Failure(ReturnErrors.InvalidStatusTransition);

        if (string.IsNullOrWhiteSpace(reason))
            return Result.Failure(ReturnErrors.ReasonRequired);

        Status = ReturnStatus.Rejected;
        MerchantNote = reason.Trim();
        ResolvedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    /// <summary>Marks the (approved) return as refunded once the payment processor confirms.</summary>
    public Result MarkRefunded(string transactionId)
    {
        if (Status != ReturnStatus.Approved)
            return Result.Failure(ReturnErrors.InvalidStatusTransition);

        Status = ReturnStatus.Refunded;
        RefundTransactionId = transactionId;
        ResolvedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public Result Cancel()
    {
        if (Status != ReturnStatus.Requested)
            return Result.Failure(ReturnErrors.InvalidStatusTransition);

        Status = ReturnStatus.Cancelled;
        ResolvedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }
}
