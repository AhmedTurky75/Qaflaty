using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Identity.Queries.GetStoreMerchants;

public record GetStoreMerchantsQuery(Guid StoreId) : IQuery<List<StoreMemberDto>>;

public record StoreMemberDto(
    Guid MerchantId,
    string Email,
    string FirstName,
    string LastName,
    string Role,
    bool IsActive
);
