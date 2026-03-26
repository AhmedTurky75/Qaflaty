using Qaflaty.Application.Catalog.Commands.CreateProductPropertyDefinition;
using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Queries.GetProductPropertyDefinitions;

public class GetProductPropertyDefinitionsQueryHandler
    : IQueryHandler<GetProductPropertyDefinitionsQuery, List<ProductPropertyDefinitionDto>>
{
    private readonly IProductPropertyDefinitionRepository _repository;

    public GetProductPropertyDefinitionsQueryHandler(IProductPropertyDefinitionRepository repository)
    {
        _repository = repository;
    }

    public async Task<Result<List<ProductPropertyDefinitionDto>>> Handle(
        GetProductPropertyDefinitionsQuery request, CancellationToken cancellationToken)
    {
        var definitions = await _repository.GetByStoreAsync(new StoreId(request.StoreId), cancellationToken);
        var dtos = definitions.Select(CreateProductPropertyDefinitionCommandHandler.MapToDto).ToList();
        return Result.Success(dtos);
    }
}
