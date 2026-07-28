using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Ordering.Commands.UnblockPhone;

public record UnblockPhoneCommand(Guid StoreId, Guid BlockedPhoneId) : ICommand;
