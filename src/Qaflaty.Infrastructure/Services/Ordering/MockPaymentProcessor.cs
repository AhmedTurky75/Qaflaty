using Qaflaty.Domain.Ordering.Services;

namespace Qaflaty.Infrastructure.Services.Ordering;

public class MockPaymentProcessor : IPaymentProcessor
{
    public async Task<PaymentResult> ProcessAsync(PaymentRequest request, CancellationToken ct = default)
    {
        // Simulate network delay
        await Task.Delay(500, ct);

        // Generate transaction ID
        //Question : Why we use only the first 20 char of GUID ? This may break uniqness.
        var transactionId = $"TXN-{Guid.NewGuid():N}"[..20];

        // Mock: always succeed for now
        return new PaymentResult(true, transactionId, null);
    }

    public async Task<PaymentResult> RefundAsync(RefundRequest request, CancellationToken ct = default)
    {
        // Simulate network delay
        await Task.Delay(300, ct);

        //Question : Why we use only the first 20 char of GUID ? This may break uniqness.
        var refundTransactionId = $"RFN-{Guid.NewGuid():N}"[..20];

        return new PaymentResult(true, refundTransactionId, null);
    }
}
