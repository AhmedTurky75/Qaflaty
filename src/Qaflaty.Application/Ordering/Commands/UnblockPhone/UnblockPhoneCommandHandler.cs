using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Ordering.Errors;
using Qaflaty.Domain.Ordering.Repositories;

namespace Qaflaty.Application.Ordering.Commands.UnblockPhone;

public class UnblockPhoneCommandHandler : ICommandHandler<UnblockPhoneCommand>
{
    private readonly IBlockedPhoneRepository _blockedPhoneRepository;
    private readonly IStoreRepository _storeRepository;
    private readonly ICurrentUserService _currentUserService;

    public UnblockPhoneCommandHandler(
        IBlockedPhoneRepository blockedPhoneRepository,
        IStoreRepository storeRepository,
        ICurrentUserService currentUserService)
    {
        _blockedPhoneRepository = blockedPhoneRepository;
        _storeRepository = storeRepository;
        _currentUserService = currentUserService;
    }

    public async Task<Result> Handle(UnblockPhoneCommand request, CancellationToken cancellationToken)
    {
        var storeId = new StoreId(request.StoreId);

        var store = await _storeRepository.GetByIdAsync(storeId, cancellationToken);
        if (store == null ||
            !await _storeRepository.CanMerchantAccessStoreAsync(
                _currentUserService.MerchantId ?? default, store.Id, cancellationToken))
            return Result.Failure(Error.Unauthorized);

        var blocked = await _blockedPhoneRepository.GetByIdAsync(
            new BlockedPhoneId(request.BlockedPhoneId), cancellationToken);

        if (blocked == null || blocked.StoreId != storeId)
            return Result.Failure(OrderingErrors.BlockedPhoneNotFound);

        _blockedPhoneRepository.Remove(blocked);
        return Result.Success();
    }
}
