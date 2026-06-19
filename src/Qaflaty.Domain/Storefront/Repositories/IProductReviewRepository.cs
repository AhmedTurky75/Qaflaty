using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Storefront.Aggregates.ProductReview;
using Qaflaty.Domain.Storefront.Enums;

namespace Qaflaty.Domain.Storefront.Repositories;

public interface IProductReviewRepository
{
    Task<ProductReview?> GetByIdAsync(ProductReviewId id, CancellationToken ct = default);

    Task<ProductReview?> GetByCustomerAndProductAsync(
        StoreCustomerId customerId, ProductId productId, CancellationToken ct = default);

    /// <summary>Publicly visible (approved) reviews for a product, pinned first then newest.</summary>
    Task<IReadOnlyList<ProductReview>> GetApprovedByProductIdAsync(
        ProductId productId, CancellationToken ct = default);

    /// <summary>All reviews for a store for merchant moderation, optionally filtered.</summary>
    Task<IReadOnlyList<ProductReview>> GetForModerationAsync(
        StoreId storeId, ProductId? productId = null, ReviewStatus? status = null, CancellationToken ct = default);

    Task AddAsync(ProductReview review, CancellationToken ct = default);
    void Update(ProductReview review);
    void Delete(ProductReview review);
}
