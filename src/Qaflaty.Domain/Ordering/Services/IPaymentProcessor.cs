using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.ValueObjects;
using Qaflaty.Domain.Ordering.Enums;

namespace Qaflaty.Domain.Ordering.Services;

public interface IPaymentProcessor
{
    Task<PaymentResult> ProcessAsync(PaymentRequest request, CancellationToken ct = default);
    Task<PaymentResult> RefundAsync(RefundRequest request, CancellationToken ct = default);
}

public record PaymentRequest(OrderId OrderId, Money Amount, PaymentMethod Method);

public record RefundRequest(OrderId OrderId, string TransactionId, Money Amount);

public record PaymentResult(bool Success, string? TransactionId, string? ErrorMessage);
