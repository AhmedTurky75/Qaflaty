using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Ordering.DTOs;

namespace Qaflaty.Application.Ordering.Commands.VerifyOrderOtp;

public record VerifyOrderOtpCommand(
    Guid StoreId,
    string OrderNumber,
    string OtpCode,
    Guid? BuyerCustomerId = null,
    string? BuyerGuestId = null
) : ICommand<OrderDto>;
