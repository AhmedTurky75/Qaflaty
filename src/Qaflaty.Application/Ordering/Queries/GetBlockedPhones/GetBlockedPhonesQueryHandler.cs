using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Common.Models;
using Qaflaty.Application.Ordering.DTOs;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Ordering.Repositories;

namespace Qaflaty.Application.Ordering.Queries.GetBlockedPhones;

public class GetBlockedPhonesQueryHandler : IQueryHandler<GetBlockedPhonesQuery, PaginatedList<BlockedPhoneDto>>
{
    private readonly IBlockedPhoneRepository _blockedPhoneRepository;
    private readonly IOrderRepository _orderRepository;
    private readonly IStoreRepository _storeRepository;
    private readonly ICurrentUserService _currentUserService;

    public GetBlockedPhonesQueryHandler(
        IBlockedPhoneRepository blockedPhoneRepository,
        IOrderRepository orderRepository,
        IStoreRepository storeRepository,
        ICurrentUserService currentUserService)
    {
        _blockedPhoneRepository = blockedPhoneRepository;
        _orderRepository = orderRepository;
        _storeRepository = storeRepository;
        _currentUserService = currentUserService;
    }

    public async Task<Result<PaginatedList<BlockedPhoneDto>>> Handle(
        GetBlockedPhonesQuery request,
        CancellationToken cancellationToken)
    {
        var storeId = new StoreId(request.StoreId);

        var store = await _storeRepository.GetByIdAsync(storeId, cancellationToken);
        if (store == null ||
            !await _storeRepository.CanMerchantAccessStoreAsync(
                _currentUserService.MerchantId ?? default, store.Id, cancellationToken))
            return Result.Failure<PaginatedList<BlockedPhoneDto>>(Error.Unauthorized);

        var (items, totalCount) = await _blockedPhoneRepository.GetPagedAsync(
            storeId, request.Search, request.PageNumber, request.PageSize, cancellationToken);

        var dtos = new List<BlockedPhoneDto>(items.Count);
        foreach (var blocked in items)
        {
            // Resolve the originating order number so the merchant can trace why a number was
            // blocked. Bounded by page size, so a per-row lookup is acceptable here.
            string? sourceOrderNumber = null;
            if (blocked.SourceOrderId.HasValue)
            {
                var order = await _orderRepository.GetByIdAsync(blocked.SourceOrderId.Value, cancellationToken);
                sourceOrderNumber = order?.OrderNumber.Value;
            }

            dtos.Add(new BlockedPhoneDto(
                blocked.Id.Value,
                blocked.Phone.Value,
                blocked.Phone.CountryCode,
                blocked.Reason,
                blocked.BlockedBy,
                blocked.SourceOrderId?.Value,
                sourceOrderNumber,
                blocked.BlockedAt));
        }

        return Result.Success(new PaginatedList<BlockedPhoneDto>(
            dtos, totalCount, request.PageNumber, request.PageSize));
    }
}
