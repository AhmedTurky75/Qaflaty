using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Domain.Catalog.Aggregates.Store;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Infrastructure.Services.Common;

public class TenantContext : ITenantContext
{
    public StoreId? CurrentStoreId { get; private set; }
    public Store? CurrentStore { get; private set; }
    public bool IsResolved => CurrentStore != null;

    public void SetStore(Store store)
    {
        CurrentStore = store;
        CurrentStoreId = store.Id;
    }
}
