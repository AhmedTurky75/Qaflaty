using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Aggregates.Product;
using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Commands.CreateProductPropertyDefinition;

public class CreateProductPropertyDefinitionCommandHandler
    : ICommandHandler<CreateProductPropertyDefinitionCommand, ProductPropertyDefinitionDto>
{
    private readonly IProductPropertyDefinitionRepository _repository;

    public CreateProductPropertyDefinitionCommandHandler(IProductPropertyDefinitionRepository repository)
    {
        _repository = repository;
    }

    public async Task<Result<ProductPropertyDefinitionDto>> Handle(
        CreateProductPropertyDefinitionCommand request, CancellationToken cancellationToken)
    {
        if (!Enum.TryParse<ProductPropertyType>(request.Type, true, out var type))
            return Result.Failure<ProductPropertyDefinitionDto>(
                new Error("ProductProperty.InvalidType", $"Invalid property type: '{request.Type}'"));

        var storeId = new StoreId(request.StoreId);
        var nameKey = request.Name.Trim().ToLowerInvariant();

        if (await _repository.NameExistsAsync(storeId, nameKey, null, cancellationToken))
            return Result.Failure<ProductPropertyDefinitionDto>(
                new Error("ProductProperty.NameExists",
                    $"A property with name '{request.Name}' already exists for this store"));

        var result = ProductPropertyDefinition.Create(
            storeId, request.Name, request.DisplayName, type,
            request.Options, request.IsRequired, request.IsFilterable, request.SortOrder);

        if (result.IsFailure)
            return Result.Failure<ProductPropertyDefinitionDto>(result.Error);

        await _repository.AddAsync(result.Value, cancellationToken);

        return Result.Success(MapToDto(result.Value));
    }

    internal static ProductPropertyDefinitionDto MapToDto(ProductPropertyDefinition d) =>
        new(d.Id.Value, d.StoreId.Value, d.Name, d.DisplayName,
            d.Type.ToString(), d.Options, d.IsRequired, d.IsFilterable, d.SortOrder);
}
