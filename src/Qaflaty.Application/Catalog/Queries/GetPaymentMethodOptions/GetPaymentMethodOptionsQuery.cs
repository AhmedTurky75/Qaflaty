using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Queries.GetPaymentMethodOptions;

/// <summary>Returns the full catalog of available payment method options with their default display metadata.</summary>
public record GetPaymentMethodOptionsQuery : IQuery<List<PaymentMethodOptionDto>>;
