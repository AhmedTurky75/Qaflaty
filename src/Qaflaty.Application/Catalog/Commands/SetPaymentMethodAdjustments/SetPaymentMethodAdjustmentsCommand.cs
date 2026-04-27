using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Commands.SetPaymentMethodAdjustments;

public record PaymentMethodAdjustmentRequest(
    string PaymentMethod,
    string AdjustmentType,
    decimal Value,
    string? DisplayLabel,
    bool IsEnabled = true);

public record SetPaymentMethodAdjustmentsCommand(
    Guid StoreId,
    List<PaymentMethodAdjustmentRequest> Adjustments
) : ICommand<List<PaymentMethodAdjustmentDto>>;
