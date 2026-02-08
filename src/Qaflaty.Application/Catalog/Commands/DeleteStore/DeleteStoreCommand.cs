using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Commands.DeleteStore;

public record DeleteStoreCommand(Guid StoreId) : ICommand;
