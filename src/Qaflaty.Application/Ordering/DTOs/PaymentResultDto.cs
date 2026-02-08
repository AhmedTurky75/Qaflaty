namespace Qaflaty.Application.Ordering.DTOs;

public record PaymentResultDto(
    bool Success,
    string? TransactionId,
    string? ErrorMessage
);
