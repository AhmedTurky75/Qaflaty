using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Identity.Repositories;
using Qaflaty.Domain.Ordering.Enums;
using Qaflaty.Domain.Ordering.Repositories;
using Qaflaty.Domain.Storefront.Aggregates.ProductReview;
using Qaflaty.Domain.Storefront.Enums;
using Qaflaty.Domain.Storefront.Errors;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Application.Storefront.Commands.SubmitProductReview;

public class SubmitProductReviewCommandHandler : ICommandHandler<SubmitProductReviewCommand, Guid>
{
    private readonly IProductReviewRepository _reviewRepository;
    private readonly IStoreConfigurationRepository _storeConfigRepository;
    private readonly IStoreCustomerRepository _storeCustomerRepository;
    private readonly ICustomerRepository _customerRepository;
    private readonly IOrderRepository _orderRepository;

    public SubmitProductReviewCommandHandler(
        IProductReviewRepository reviewRepository,
        IStoreConfigurationRepository storeConfigRepository,
        IStoreCustomerRepository storeCustomerRepository,
        ICustomerRepository customerRepository,
        IOrderRepository orderRepository)
    {
        _reviewRepository = reviewRepository;
        _storeConfigRepository = storeConfigRepository;
        _storeCustomerRepository = storeCustomerRepository;
        _customerRepository = customerRepository;
        _orderRepository = orderRepository;
    }

    public async Task<Result<Guid>> Handle(SubmitProductReviewCommand request, CancellationToken ct)
    {
        var config = await _storeConfigRepository.GetByStoreIdAsync(request.StoreId, ct);
        if (config is null || !config.FeatureToggles.Reviews)
            return Result.Failure<Guid>(ReviewErrors.ReviewsDisabled);

        var customer = await _storeCustomerRepository.GetByIdAsync(request.CustomerId, ct);
        if (customer is null)
            return Result.Failure<Guid>(Error.Unauthorized);

        // Enforce one review per customer per product.
        var existing = await _reviewRepository.GetByCustomerAndProductAsync(
            request.CustomerId, request.ProductId, ct);
        if (existing is not null)
            return Result.Failure<Guid>(ReviewErrors.AlreadyReviewed);

        // Determine verified purchase (also gates submission when purchase is required).
        var verifiedOrderId = await FindVerifiedOrderAsync(
            request.StoreId, customer.Email.Value, request.ProductId, ct);

        if (config.ReviewsRequirePurchase && verifiedOrderId is null)
            return Result.Failure<Guid>(ReviewErrors.PurchaseRequired);

        var createResult = ProductReview.Create(
            request.StoreId,
            request.ProductId,
            request.CustomerId,
            customer.FullName.Value,
            request.Rating,
            request.Title,
            request.Comment,
            verifiedOrderId,
            config.ReviewsAutoApprove);

        if (createResult.IsFailure)
            return Result.Failure<Guid>(createResult.Error);

        var review = createResult.Value;

        if (request.Media is not null)
        {
            foreach (var media in request.Media)
            {
                var type = media.Type == "Video" ? ReviewMediaType.Video : ReviewMediaType.Image;
                review.AddMedia(media.Url, type);
            }
        }

        await _reviewRepository.AddAsync(review, ct);

        return Result.Success(review.Id.Value);
    }

    private async Task<OrderId?> FindVerifiedOrderAsync(
        StoreId storeId, string? email, ProductId productId, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(email))
            return null;

        var customer = await _customerRepository.GetByEmailAsync(storeId, email, ct);
        if (customer is null)
            return null;

        var orders = await _orderRepository.GetByCustomerIdAsync(customer.Id, ct);

        var deliveredOrder = orders
            .Where(o => o.Status == OrderStatus.Delivered)
            .OrderByDescending(o => o.CreatedAt)
            .FirstOrDefault(o => o.Items.Any(i => i.ProductId == productId));

        return deliveredOrder?.Id;
    }
}
