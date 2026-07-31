using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Ordering.DTOs;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Ordering.Enums;
using Qaflaty.Domain.Ordering.Repositories;

namespace Qaflaty.Application.Ordering.Queries.GetStoreReturns;

public class GetStoreReturnsQueryHandler : IQueryHandler<GetStoreReturnsQuery, IReadOnlyList<ReturnRequestDto>>
{
    private readonly IReturnRequestRepository _returnRepository;
    private readonly IStoreRepository _storeRepository;

    public GetStoreReturnsQueryHandler(
        IReturnRequestRepository returnRepository,
        IStoreRepository storeRepository)
    {
        _returnRepository = returnRepository;
        _storeRepository = storeRepository;
    }

    public async Task<Result<IReadOnlyList<ReturnRequestDto>>> Handle(GetStoreReturnsQuery request, CancellationToken ct)
    {
        ReturnStatus? status = null;
        if (!string.IsNullOrWhiteSpace(request.Status) &&
            Enum.TryParse<ReturnStatus>(request.Status, out var parsed))
            status = parsed;

        var store = await _storeRepository.GetByIdAsync(request.StoreId, ct);
        var currencyCode = store?.Currency.Code ?? "EGP";

        var returns = await _returnRepository.GetByStoreAsync(request.StoreId, status, ct);
        IReadOnlyList<ReturnRequestDto> dtos = returns.Select(r => r.ToDto(currencyCode)).ToList();
        return Result.Success(dtos);
    }
}
