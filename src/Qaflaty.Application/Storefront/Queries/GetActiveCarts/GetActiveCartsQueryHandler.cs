using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Storefront.DTOs;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Identity.Repositories;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Application.Storefront.Queries.GetActiveCarts;

public class GetActiveCartsQueryHandler : IQueryHandler<GetActiveCartsQuery, List<ActiveCartDto>>
{
    private readonly ICartRepository _cartRepository;
    private readonly IStoreCustomerRepository _storeCustomerRepository;
    private readonly IProductRepository _productRepository;
    private readonly IStoreRepository _storeRepository;
    private readonly ICurrentUserService _currentUserService;

    public GetActiveCartsQueryHandler(
        ICartRepository cartRepository,
        IStoreCustomerRepository storeCustomerRepository,
        IProductRepository productRepository,
        IStoreRepository storeRepository,
        ICurrentUserService currentUserService)
    {
        _cartRepository = cartRepository;
        _storeCustomerRepository = storeCustomerRepository;
        _productRepository = productRepository;
        _storeRepository = storeRepository;
        _currentUserService = currentUserService;
    }

    public async Task<Result<List<ActiveCartDto>>> Handle(GetActiveCartsQuery request, CancellationToken cancellationToken)
    {
        var storeId = new StoreId(request.StoreId);

        var store = await _storeRepository.GetByIdAsync(storeId, cancellationToken);
        if (store == null || store.MerchantId.Value != _currentUserService.MerchantId?.Value)
            return Result.Failure<List<ActiveCartDto>>(Error.Unauthorized);

        var carts = await _cartRepository.GetActiveCartsByStoreAsync(storeId, cancellationToken);

        if (carts.Count == 0)
            return Result.Success(new List<ActiveCartDto>());

        // Load customers
        var customerIds = carts.Select(c => c.CustomerId).Distinct().ToList();
        var customers = await _storeCustomerRepository.GetByIdsAsync(customerIds, cancellationToken);
        var customerLookup = customers.ToDictionary(c => c.Id.Value);

        // Load products for this store to enrich items
        var products = await _productRepository.GetByStoreIdAsync(storeId, cancellationToken);
        var productLookup = products.ToDictionary(p => p.Id.Value);

        var result = carts.Select(cart =>
        {
            customerLookup.TryGetValue(cart.CustomerId.Value, out var customer);

            var items = cart.Items.Select(item =>
            {
                productLookup.TryGetValue(item.ProductId.Value, out var product);
                var imageUrl = product?.Images.FirstOrDefault()?.Url;
                var unitPrice = product?.Pricing.Price.Amount ?? 0;

                return new ActiveCartItemDto(
                    item.ProductId.Value,
                    product?.Name.Value ?? "Unknown Product",
                    imageUrl,
                    item.VariantId,
                    item.Quantity,
                    unitPrice
                );
            }).ToList();

            return new ActiveCartDto(
                cart.Id.Value,
                cart.CustomerId.Value,
                customer?.FullName.Value ?? "Guest",
                customer?.Email.Value ?? "",
                items,
                cart.TotalItems,
                cart.UpdatedAt
            );
        }).ToList();

        return Result.Success(result);
    }
}
