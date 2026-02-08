using Qaflaty.Domain.Catalog.Aggregates.Store;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Common.Interfaces;

public interface ITenantContext
{
    StoreId? CurrentStoreId { get; }
    Store? CurrentStore { get; }
    bool IsResolved { get; }
    void SetStore(Store store);
}
