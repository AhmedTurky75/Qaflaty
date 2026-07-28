using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Ordering.DTOs;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.ValueObjects;
using Qaflaty.Domain.Ordering.Aggregates.BlockedPhone;
using Qaflaty.Domain.Ordering.Errors;
using Qaflaty.Domain.Ordering.Repositories;

namespace Qaflaty.Application.Ordering.Commands.BlockPhone;

public class BlockPhoneCommandHandler : ICommandHandler<BlockPhoneCommand, BlockedPhoneDto>
{
    private readonly IBlockedPhoneRepository _blockedPhoneRepository;
    private readonly IStoreRepository _storeRepository;
    private readonly ICurrentUserService _currentUserService;

    public BlockPhoneCommandHandler(
        IBlockedPhoneRepository blockedPhoneRepository,
        IStoreRepository storeRepository,
        ICurrentUserService currentUserService)
    {
        _blockedPhoneRepository = blockedPhoneRepository;
        _storeRepository = storeRepository;
        _currentUserService = currentUserService;
    }

    public async Task<Result<BlockedPhoneDto>> Handle(BlockPhoneCommand request, CancellationToken cancellationToken)
    {
        var storeId = new StoreId(request.StoreId);

        var store = await _storeRepository.GetByIdAsync(storeId, cancellationToken);
        if (store == null ||
            !await _storeRepository.CanMerchantAccessStoreAsync(
                _currentUserService.MerchantId ?? default, store.Id, cancellationToken))
            return Result.Failure<BlockedPhoneDto>(Error.Unauthorized);

        // Normalise to E.164 so the checkout lookup is a plain string match regardless of how the
        // merchant typed the number.
        var phoneResult = PhoneNumber.Create(request.Phone, request.CountryCode);
        if (phoneResult.IsFailure)
            return Result.Failure<BlockedPhoneDto>(phoneResult.Error);

        var existing = await _blockedPhoneRepository.GetByPhoneAsync(storeId, phoneResult.Value, cancellationToken);
        if (existing != null)
            return Result.Failure<BlockedPhoneDto>(OrderingErrors.PhoneAlreadyBlocked);

        var blockedResult = BlockedPhone.Create(
            storeId,
            phoneResult.Value,
            _currentUserService.Email ?? "System",
            request.Reason);

        if (blockedResult.IsFailure)
            return Result.Failure<BlockedPhoneDto>(blockedResult.Error);

        await _blockedPhoneRepository.AddAsync(blockedResult.Value, cancellationToken);

        var blocked = blockedResult.Value;
        return Result.Success(new BlockedPhoneDto(
            blocked.Id.Value,
            blocked.Phone.Value,
            blocked.Phone.CountryCode,
            blocked.Reason,
            blocked.BlockedBy,
            null,
            null,
            blocked.BlockedAt));
    }
}
