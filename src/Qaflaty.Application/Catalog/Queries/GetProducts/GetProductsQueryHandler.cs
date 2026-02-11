using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Common.Models;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Queries.GetProducts;

public class GetProductsQueryHandler : IQueryHandler<GetProductsQuery, PaginatedList<ProductListDto>>
{
    private readonly IProductRepository _productRepository;
    private readonly IStoreRepository _storeRepository;
    private readonly ICurrentUserService _currentUserService;

    public GetProductsQueryHandler(
        IProductRepository productRepository,
        IStoreRepository storeRepository,
        ICurrentUserService currentUserService)
    {
        _productRepository = productRepository;
        _storeRepository = storeRepository;
        _currentUserService = currentUserService;
    }

    public async Task<Result<PaginatedList<ProductListDto>>> Handle(GetProductsQuery request, CancellationToken cancellationToken)
    {
        // Verify store ownership
        var storeId = new StoreId(request.StoreId);
        var store = await _storeRepository.GetByIdAsync(storeId, cancellationToken);
        if (store == null || store.MerchantId.Value != _currentUserService.MerchantId?.Value)
            return Result.Failure<PaginatedList<ProductListDto>>(Error.Unauthorized);

        var products = await _productRepository.GetByStoreIdAsync(storeId, cancellationToken);

        var query = products.AsEnumerable();

        // Apply filters
        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            query = query.Where(p => p.Name.Value.Contains(request.SearchTerm, StringComparison.OrdinalIgnoreCase));
        }

        if (request.CategoryId.HasValue)
        {
            var categoryId = new CategoryId(request.CategoryId.Value);
            query = query.Where(p => p.CategoryId?.Value == categoryId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            query = query.Where(p => p.Status.ToString().Equals(request.Status, StringComparison.OrdinalIgnoreCase));
        }

        var dtos = query.Select(p => new ProductListDto(
            p.Id.Value,
            p.Slug.Value,
            p.Name.Value,
            p.Pricing.Price.Amount,
            p.Inventory.Quantity,
            p.Status.ToString(),
            p.Images.FirstOrDefault()?.Url
        ));

        return Result.Success(PaginatedList<ProductListDto>.Create(dtos, request.PageNumber, request.PageSize));
    }
}
