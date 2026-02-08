using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Application.Catalog.Commands.DeleteProduct;

public class DeleteProductCommandHandler : ICommandHandler<DeleteProductCommand>
{
    public Task<Result> Handle(DeleteProductCommand request, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("DeleteProductCommandHandler will be implemented in a later phase");
    }
}
