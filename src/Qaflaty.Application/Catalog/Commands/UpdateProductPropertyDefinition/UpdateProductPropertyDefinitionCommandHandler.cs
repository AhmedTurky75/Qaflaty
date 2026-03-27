using Qaflaty.Application.Catalog.Commands.CreateProductPropertyDefinition;
using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Commands.UpdateProductPropertyDefinition;

public class UpdateProductPropertyDefinitionCommandHandler
    : ICommandHandler<UpdateProductPropertyDefinitionCommand, ProductPropertyDefinitionDto>
{
    private readonly IProductPropertyDefinitionRepository _repository;

    public UpdateProductPropertyDefinitionCommandHandler(IProductPropertyDefinitionRepository repository)
    {
        _repository = repository;
    }

    public async Task<Result<ProductPropertyDefinitionDto>> Handle(
        UpdateProductPropertyDefinitionCommand request, CancellationToken cancellationToken)
    {
        var id = new ProductPropertyDefinitionId(request.DefinitionId);
        var definition = await _repository.GetByIdAsync(id, cancellationToken);

        if (definition == null)
            return Result.Failure<ProductPropertyDefinitionDto>(
                new Error("ProductProperty.NotFound", "Product property definition not found"));

        var result = definition.Update(
            request.DisplayName, request.Options,
            request.IsRequired, request.IsFilterable, request.SortOrder);

        if (result.IsFailure)
            return Result.Failure<ProductPropertyDefinitionDto>(result.Error);

        _repository.Update(definition);

        return Result.Success(CreateProductPropertyDefinitionCommandHandler.MapToDto(definition));
    }
}
