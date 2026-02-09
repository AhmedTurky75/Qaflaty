using Qaflaty.Domain.Common.Primitives;
using Qaflaty.Domain.Ordering.Enums;

namespace Qaflaty.Domain.Ordering.ValueObjects;

public sealed class PaymentInfo : ValueObject
{
    public PaymentMethod Method { get; private set; }
    public PaymentStatus Status { get; private set; }
    public string? TransactionId { get; private set; }
    public DateTime? PaidAt { get; private set; }
    public string? FailureReason { get; private set; }

    private PaymentInfo() { }

    private PaymentInfo(PaymentMethod method)
    {
        Method = method;
        Status = PaymentStatus.Pending;
    }

    public static PaymentInfo Create(PaymentMethod method)
    {
        return new PaymentInfo(method);
    }

    public void MarkAsPaid(string transactionId)
    {
        Status = PaymentStatus.Paid;
        TransactionId = transactionId;
        PaidAt = DateTime.UtcNow;
        FailureReason = null;
    }

    public void MarkAsFailed(string reason)
    {
        Status = PaymentStatus.Failed;
        FailureReason = reason;
    }

    public void MarkAsRefunded(string transactionId)
    {
        Status = PaymentStatus.Refunded;
        TransactionId = transactionId;
    }

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Method;
        yield return Status;
        yield return TransactionId;
        yield return PaidAt;
        yield return FailureReason;
    }
}
