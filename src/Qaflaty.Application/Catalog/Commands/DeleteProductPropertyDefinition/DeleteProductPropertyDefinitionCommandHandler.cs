using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Commands.DeleteProductPropertyDefinition;

public class DeleteProductPropertyDefinitionCommandHandler
    : ICommandHandler<DeleteProductPropertyDefinitionCommand>
{
    private readonly IProductPropertyDefinitionRepository _repository;

    public DeleteProductPropertyDefinitionCommandHandler(IProductPropertyDefinitionRepository repository)
    {
        _repository = repository;
    }

    public async Task<Result> Handle(
        DeleteProductPropertyDefinitionCommand request, CancellationToken cancellationToken)
    {
        var id = new ProductPropertyDefinitionId(request.DefinitionId);
        var definition = await _repository.GetByIdAsync(id, cancellationToken);

        if (definition == null)
            return Result.Failure(new Error("ProductProperty.NotFound", "Product property definition not found"));

        _repository.Delete(definition);
        return Result.Success();
    }
}
