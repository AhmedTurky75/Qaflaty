using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Ordering.Commands.SendOrderOtp;

public record SendOrderOtpCommand(
    Guid StoreId,
    string OrderNumber
) : ICommand;
