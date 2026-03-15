using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Identity.DTOs;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.ValueObjects;
using Qaflaty.Domain.Identity.Aggregates.Merchant;
using Qaflaty.Domain.Identity.Errors;
using Qaflaty.Domain.Identity.Repositories;
using Qaflaty.Domain.Identity.Services;
using Qaflaty.Domain.Identity.ValueObjects;

namespace Qaflaty.Application.Identity.Commands.InviteTeamMember;

public class InviteTeamMemberCommandHandler : ICommandHandler<InviteTeamMemberCommand, TeamMemberDto>
{
    private readonly IMerchantRepository _merchantRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ICurrentUserService _currentUserService;

    public InviteTeamMemberCommandHandler(
        IMerchantRepository merchantRepository,
        IPasswordHasher passwordHasher,
        ICurrentUserService currentUserService)
    {
        _merchantRepository = merchantRepository;
        _passwordHasher = passwordHasher;
        _currentUserService = currentUserService;
    }

    public async Task<Result<TeamMemberDto>> Handle(InviteTeamMemberCommand request, CancellationToken cancellationToken)
    {
        if (_currentUserService.MerchantId == null)
            return Result.Failure<TeamMemberDto>(IdentityErrors.MerchantNotFound);

        var storeId = new StoreId(request.StoreId);
        var invitedBy = _currentUserService.MerchantId.Value;

        // Validate email format and check uniqueness
        var emailResult = Email.Create(request.Email);
        if (emailResult.IsFailure)
            return Result.Failure<TeamMemberDto>(emailResult.Error);

        var emailExists = await _merchantRepository.ExistsByEmailAsync(emailResult.Value, cancellationToken);
        if (emailExists)
            return Result.Failure<TeamMemberDto>(IdentityErrors.EmailAlreadyExists);

        // Check username uniqueness
        var usernameExists = await _merchantRepository.ExistsByUsernameAsync(request.Username, cancellationToken);
        if (usernameExists)
            return Result.Failure<TeamMemberDto>(IdentityErrors.UsernameAlreadyExists);

        // Build value objects
        var nameResult = PersonName.Create(request.FirstName, request.LastName);
        if (nameResult.IsFailure)
            return Result.Failure<TeamMemberDto>(nameResult.Error);

        PhoneNumber? phone = null;
        if (!string.IsNullOrWhiteSpace(request.Phone))
        {
            var phoneResult = PhoneNumber.Create(request.Phone);
            if (phoneResult.IsFailure)
                return Result.Failure<TeamMemberDto>(phoneResult.Error);
            phone = phoneResult.Value;
        }

        // Hash the initial password
        var hashedPassword = _passwordHasher.Hash(request.Password);

        // Create the new merchant account
        var merchantResult = Merchant.Create(
            emailResult.Value,
            hashedPassword,
            nameResult.Value,
            request.Username,
            phone);

        if (merchantResult.IsFailure)
            return Result.Failure<TeamMemberDto>(merchantResult.Error);

        var merchant = merchantResult.Value;

        await _merchantRepository.AddAsync(merchant, cancellationToken);

        // Assign the new merchant to the store with the requested role
        var assignment = merchant.AssignToStore(storeId, request.Role, invitedBy);

        return Result.Success(new TeamMemberDto(
            merchant.Id.Value,
            merchant.FullName.FullName,
            merchant.Email.Value,
            merchant.Phone?.Value,
            merchant.Username,
            merchant.IsVerified,
            assignment.Role.ToString(),
            assignment.IsActive,
            assignment.InvitedBy?.Value,
            assignment.CreatedAt,
            merchant.CreatedAt));
    }
}
