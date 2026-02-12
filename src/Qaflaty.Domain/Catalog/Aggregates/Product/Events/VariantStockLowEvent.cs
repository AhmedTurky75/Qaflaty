using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.Aggregates.Product.Events;

public sealed record VariantStockLowEvent(
    ProductId ProductId,
    Guid VariantId,
    string Sku,
    int CurrentQuantity,
    int Threshold
) : DomainEvent;
