using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Identity.Commands.RemoveMerchantFromStore;

public record RemoveMerchantFromStoreCommand(Guid StoreId, Guid MerchantId) : ICommand;
