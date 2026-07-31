using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Application.Catalog.Queries.GetPromoCodes;

public class GetPromoCodesQueryHandler : IQueryHandler<GetPromoCodesQuery, IReadOnlyList<PromoCodeDto>>
{
    private readonly IPromoCodeRepository _promoCodeRepository;

    public GetPromoCodesQueryHandler(IPromoCodeRepository promoCodeRepository)
    {
        _promoCodeRepository = promoCodeRepository;
    }

    public async Task<Result<IReadOnlyList<PromoCodeDto>>> Handle(GetPromoCodesQuery request, CancellationToken ct)
    {
        var codes = await _promoCodeRepository.GetByStoreAsync(request.StoreId, ct);
        IReadOnlyList<PromoCodeDto> dtos = codes.Select(c => c.ToDto()).ToList();
        return Result.Success(dtos);
    }
}
