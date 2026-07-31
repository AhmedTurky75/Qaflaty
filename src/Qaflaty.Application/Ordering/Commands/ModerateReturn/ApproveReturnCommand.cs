using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Ordering.Commands.ModerateReturn;

public record ApproveReturnCommand(ReturnRequestId Id, StoreId StoreId, string? MerchantNote) : ICommand;

public record RejectReturnCommand(ReturnRequestId Id, StoreId StoreId, string Reason) : ICommand;

public record RefundReturnCommand(ReturnRequestId Id, StoreId StoreId) : ICommand;
