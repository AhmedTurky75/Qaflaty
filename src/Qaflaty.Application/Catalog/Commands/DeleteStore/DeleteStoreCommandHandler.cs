using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Application.Catalog.Commands.DeleteStore;

public class DeleteStoreCommandHandler : ICommandHandler<DeleteStoreCommand>
{
    public Task<Result> Handle(DeleteStoreCommand request, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("DeleteStoreCommandHandler will be implemented in a later phase");
    }
}
