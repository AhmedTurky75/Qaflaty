using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Ordering.DTOs;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Ordering.Enums;
using Qaflaty.Domain.Ordering.Repositories;

namespace Qaflaty.Application.Ordering.Queries.GetStoreReturns;

public class GetStoreReturnsQueryHandler : IQueryHandler<GetStoreReturnsQuery, IReadOnlyList<ReturnRequestDto>>
{
    private readonly IReturnRequestRepository _returnRepository;

    public GetStoreReturnsQueryHandler(IReturnRequestRepository returnRepository)
    {
        _returnRepository = returnRepository;
    }

    public async Task<Result<IReadOnlyList<ReturnRequestDto>>> Handle(GetStoreReturnsQuery request, CancellationToken ct)
    {
        ReturnStatus? status = null;
        if (!string.IsNullOrWhiteSpace(request.Status) &&
            Enum.TryParse<ReturnStatus>(request.Status, out var parsed))
            status = parsed;

        var returns = await _returnRepository.GetByStoreAsync(request.StoreId, status, ct);
        IReadOnlyList<ReturnRequestDto> dtos = returns.Select(r => r.ToDto()).ToList();
        return Result.Success(dtos);
    }
}
