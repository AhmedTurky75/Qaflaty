using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Identity.Commands.SelectStore;

public record SelectStoreCommand(Guid StoreId) : ICommand<SelectStoreResult>;

public record SelectStoreResult(Guid StoreId, string Role, List<string> Permissions);
