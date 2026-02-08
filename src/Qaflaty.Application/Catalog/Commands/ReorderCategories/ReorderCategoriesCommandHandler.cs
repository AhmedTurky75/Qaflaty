using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Application.Catalog.Commands.ReorderCategories;

public class ReorderCategoriesCommandHandler : ICommandHandler<ReorderCategoriesCommand>
{
    public Task<Result> Handle(ReorderCategoriesCommand request, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("ReorderCategoriesCommandHandler will be implemented in a later phase");
    }
}
