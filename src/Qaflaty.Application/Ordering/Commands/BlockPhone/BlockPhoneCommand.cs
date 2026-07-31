using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Ordering.DTOs;

namespace Qaflaty.Application.Ordering.Commands.BlockPhone;

/// <summary>Blocks a phone number the merchant typed in manually on the blocklist page.</summary>
public record BlockPhoneCommand(
    Guid StoreId,
    string Phone,
    string CountryCode,
    string? Reason) : ICommand<BlockedPhoneDto>;
