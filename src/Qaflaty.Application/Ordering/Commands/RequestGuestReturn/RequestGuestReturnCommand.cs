using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Ordering.DTOs;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Ordering.Commands.RequestGuestReturn;

/// <summary>
/// Return request opened by a guest. Authorized by the email or phone captured on the order — the
/// same proof-of-ownership used for guest order tracking.
/// </summary>
public record RequestGuestReturnCommand(
    StoreId StoreId,
    string OrderNumber,
    string Contact,
    List<ReturnItemSelection> Items,
    string Reason
) : ICommand<ReturnRequestDto>;
