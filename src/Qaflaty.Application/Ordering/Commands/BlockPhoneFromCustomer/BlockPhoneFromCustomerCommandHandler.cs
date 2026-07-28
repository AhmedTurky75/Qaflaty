using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Ordering.DTOs;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Ordering.Aggregates.BlockedPhone;
using Qaflaty.Domain.Ordering.Errors;
using Qaflaty.Domain.Ordering.Repositories;

namespace Qaflaty.Application.Ordering.Commands.BlockPhoneFromCustomer;

public class BlockPhoneFromCustomerCommandHandler : ICommandHandler<BlockPhoneFromCustomerCommand, BlockedPhoneDto>
{
    private readonly IBlockedPhoneRepository _blockedPhoneRepository;
    private readonly ICustomerRepository _customerRepository;
    private readonly IStoreRepository _storeRepository;
    private readonly ICurrentUserService _currentUserService;

    public BlockPhoneFromCustomerCommandHandler(
        IBlockedPhoneRepository blockedPhoneRepository,
        ICustomerRepository customerRepository,
        IStoreRepository storeRepository,
        ICurrentUserService currentUserService)
    {
        _blockedPhoneRepository = blockedPhoneRepository;
        _customerRepository = customerRepository;
        _storeRepository = storeRepository;
        _currentUserService = currentUserService;
    }

    public async Task<Result<BlockedPhoneDto>> Handle(BlockPhoneFromCustomerCommand request, CancellationToken cancellationToken)
    {
        var storeId = new StoreId(request.StoreId);

        var store = await _storeRepository.GetByIdAsync(storeId, cancellationToken);
        if (store == null ||
            !await _storeRepository.CanMerchantAccessStoreAsync(
                _currentUserService.MerchantId ?? default, store.Id, cancellationToken))
            return Result.Failure<BlockedPhoneDto>(Error.Unauthorized);

        var customer = await _customerRepository.GetByIdAsync(new CustomerId(request.CustomerId), cancellationToken);
        if (customer == null || customer.StoreId != storeId)
            return Result.Failure<BlockedPhoneDto>(OrderingErrors.CustomerNotFound);

        var phone = customer.Contact.Phone;

        var existing = await _blockedPhoneRepository.GetByPhoneAsync(storeId, phone, cancellationToken);
        if (existing != null)
            return Result.Failure<BlockedPhoneDto>(OrderingErrors.PhoneAlreadyBlocked);

        var blockedResult = BlockedPhone.Create(
            storeId,
            phone,
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
