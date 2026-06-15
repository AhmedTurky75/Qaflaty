using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Aggregates.Product;
using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Commands.SetProductPropertyValues;

public class SetProductPropertyValuesCommandHandler
    : ICommandHandler<SetProductPropertyValuesCommand, List<ProductPropertyValueDto>>
{
    private readonly IProductRepository _productRepository;
    private readonly IProductPropertyDefinitionRepository _definitionRepository;

    public SetProductPropertyValuesCommandHandler(
        IProductRepository productRepository,
        IProductPropertyDefinitionRepository definitionRepository)
    {
        _productRepository = productRepository;
        _definitionRepository = definitionRepository;
    }

    public async Task<Result<List<ProductPropertyValueDto>>> Handle(
        SetProductPropertyValuesCommand request, CancellationToken cancellationToken)
    {
        var product = await _productRepository.GetByIdWithPropertyValuesAsync(new ProductId(request.ProductId), cancellationToken);
        if (product == null)
            return Result.Failure<List<ProductPropertyValueDto>>(CatalogErrors.ProductNotFound);

        var values = new List<ProductPropertyValue>();
        foreach (var req in request.Values)
        {
            var defId = new ProductPropertyDefinitionId(req.DefinitionId);
            var definition = await _definitionRepository.GetByIdAsync(defId, cancellationToken);
            if (definition == null)
                return Result.Failure<List<ProductPropertyValueDto>>(
                    new Error("ProductProperty.DefinitionNotFound",
                        $"Property definition '{req.DefinitionId}' not found"));

            var valueResult = ProductPropertyValue.Create(product.Id, defId, req.Value);
            if (valueResult.IsFailure)
                return Result.Failure<List<ProductPropertyValueDto>>(valueResult.Error);

            values.Add(valueResult.Value);
        }

        product.SetPropertyValues(values);
        //_productRepository.Update(product);

        var dtos = product.PropertyValues
            .Select(v =>
            {
                var def = values.FirstOrDefault(x => x.DefinitionId == v.DefinitionId);
                return new ProductPropertyValueDto(v.Id, v.DefinitionId.Value, v.DefinitionId.Value.ToString(), v.Value);
            })
            .ToList();

        return Result.Success(dtos);
    }
}
