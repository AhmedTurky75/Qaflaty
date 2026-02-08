using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Queries.GetMerchantStores;

public record GetMerchantStoresQuery : IQuery<List<StoreListDto>>;
