using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Identity.Repositories;

namespace Qaflaty.Application.Identity.Queries.GetStoreMerchants;

public class GetStoreMerchantsQueryHandler : IQueryHandler<GetStoreMerchantsQuery, List<StoreMemberDto>>
{
    private readonly IMerchantRepository _merchantRepository;

    public GetStoreMerchantsQueryHandler(IMerchantRepository merchantRepository)
    {
        _merchantRepository = merchantRepository;
    }

    public async Task<Result<List<StoreMemberDto>>> Handle(GetStoreMerchantsQuery request, CancellationToken cancellationToken)
    {
        var storeId = new StoreId(request.StoreId);

        var merchants = await _merchantRepository.GetByStoreIdAsync(storeId, cancellationToken);

        var members = merchants
            .Select(m =>
            {
                var assignment = m.StoreAssignments.FirstOrDefault(a => a.StoreId == storeId);
                return new StoreMemberDto(
                    m.Id.Value,
                    m.Email.Value,
                    m.FullName.FirstName,
                    m.FullName.LastName,
                    assignment?.Role.ToString() ?? "Unknown",
                    assignment?.IsActive ?? false
                );
            })
            .ToList();

        return Result.Success(members);
    }
}
