using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Communication.DTOs;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Communication.Aggregates.ChatConversation;
using Qaflaty.Domain.Identity.Repositories;
using Qaflaty.Domain.Ordering.Repositories;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Application.Communication.Queries.GetChatCustomerProfile;

public sealed class GetChatCustomerProfileQueryHandler
    : IQueryHandler<GetChatCustomerProfileQuery, ChatCustomerProfileDto?>
{
    private readonly IChatConversationRepository _conversationRepo;
    private readonly IStoreCustomerRepository _customerRepo;
    private readonly IOrderRepository _orderRepo;
    private readonly ICartRepository _cartRepo;

    public GetChatCustomerProfileQueryHandler(
        IChatConversationRepository conversationRepo,
        IStoreCustomerRepository customerRepo,
        IOrderRepository orderRepo,
        ICartRepository cartRepo)
    {
        _conversationRepo = conversationRepo;
        _customerRepo = customerRepo;
        _orderRepo = orderRepo;
        _cartRepo = cartRepo;
    }

    public async Task<Result<ChatCustomerProfileDto?>> Handle(
        GetChatCustomerProfileQuery request,
        CancellationToken cancellationToken)
    {
        var conversation = await _conversationRepo.GetByIdAsync(
            new ChatConversationId(request.ConversationId), cancellationToken);

        if (conversation is null || conversation.CustomerId is null)
            return Result.Success<ChatCustomerProfileDto?>(null);

        var customerId = conversation.CustomerId.Value;

        var customer = await _customerRepo.GetByIdAsync(customerId, cancellationToken);
        if (customer is null)
            return Result.Success<ChatCustomerProfileDto?>(null);

        // Recent orders (up to 5, newest first)
        var orders = await _orderRepo.GetByCustomerIdAsync(
            new CustomerId(customerId.Value), cancellationToken);

        var recentOrders = orders
            .OrderByDescending(o => o.CreatedAt)
            .Take(5)
            .Select(o => new ChatCustomerOrderDto(
                o.OrderNumber.Value,
                o.Status.ToString(),
                o.Pricing.Total.Amount,
                o.Items.Count,
                o.CreatedAt))
            .ToList();

        // Current cart
        var cart = await _cartRepo.GetByCustomerIdAsync(customerId, cancellationToken);
        var cartItems = cart?.Items
            .Select(i => new ChatCartItemDto(i.ProductId.Value, i.Quantity, i.VariantId))
            .ToList() ?? new();

        var profile = new ChatCustomerProfileDto
        {
            CustomerId = customerId.Value,
            FullName = customer.FullName.FullName,
            Email = customer.Email.Value,
            Phone = customer.Phone?.Value,
            SecondaryPhone = customer.SecondaryPhone?.Value,
            IsVerified = customer.IsVerified,
            MemberSince = customer.CreatedAt,
            Addresses = customer.Addresses.Select(a => new ChatCustomerAddressDto(
                a.Label, a.Street, a.City, a.Country, a.IsDefault)).ToList(),
            RecentOrders = recentOrders,
            CartItems = cartItems
        };

        return Result.Success<ChatCustomerProfileDto?>(profile);
    }
}
