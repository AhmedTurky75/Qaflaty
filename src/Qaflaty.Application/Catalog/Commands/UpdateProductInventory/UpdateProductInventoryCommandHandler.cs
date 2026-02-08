using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Application.Catalog.Commands.UpdateProductInventory;

public class UpdateProductInventoryCommandHandler : ICommandHandler<UpdateProductInventoryCommand>
{
    public Task<Result> Handle(UpdateProductInventoryCommand request, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("UpdateProductInventoryCommandHandler will be implemented in a later phase");
    }
}
