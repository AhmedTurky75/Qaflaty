using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Queries.GetStorefrontPaymentMethods;

public record GetStorefrontPaymentMethodsQuery(Guid StoreId) : IQuery<List<PaymentMethodAdjustmentDto>>;
