using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Api.Controllers.Requests;
using Qaflaty.Application.Ai.Commands.GenerateAiReply;
using Qaflaty.Application.Ai.Commands.LogAiCartAddition;
using Qaflaty.Application.Ai.Commands.LogAiOrderPlaced;
using Qaflaty.Application.Ordering.Commands.PlaceOrder;
using Qaflaty.Domain.Ordering.Enums;
using Qaflaty.Application.Communication.Commands.StartConversation;
using Qaflaty.Application.Communication.Commands.SendChatMessage;
using Qaflaty.Application.Communication.Commands.MarkMessagesAsRead;
using Qaflaty.Application.Communication.Queries.GetActiveConversation;
using Qaflaty.Application.Communication.Queries.GetConversationMessages;
using Qaflaty.Application.Communication.DTOs;
using Qaflaty.Domain.Communication.Enums;

namespace Qaflaty.Api.Controllers;

[ApiController]
[Route("api/storefront/chat")]
public class StorefrontChatController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ITenantContext _tenantContext;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<StorefrontChatController> _logger;

    public StorefrontChatController(
        IMediator mediator,
        ITenantContext tenantContext,
        ICurrentUserService currentUserService,
        ILogger<StorefrontChatController> logger)
    {
        _mediator = mediator;
        _tenantContext = tenantContext;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    /// <summary>
    /// Start a new conversation or get existing active conversation
    /// </summary>
    [HttpPost("conversations/start")]
    public async Task<IActionResult> StartConversation([FromBody] StartConversationRequest request, CancellationToken cancellationToken)
    {
        var storeId = _tenantContext.CurrentStoreId
            ?? throw new InvalidOperationException("Store context not available");

        // Get customer ID if authenticated, otherwise use guest session
        Guid? customerId = _currentUserService.IsCustomer ? _currentUserService.CustomerId?.Value : null;
        string? guestSessionId = customerId.HasValue ? null : request.GuestSessionId;

        var command = new StartConversationCommand(
            storeId.Value,
            customerId,
            guestSessionId,
            request.InitialMessage);

        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            _logger.LogWarning("Failed to start conversation: {Error}", result.Error.Message);
            return BadRequest(new { error = result.Error.Message });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Get active conversation for current customer/guest
    /// </summary>
    [HttpGet("conversations/active")]
    public async Task<IActionResult> GetActiveConversation([FromQuery] string? guestSessionId, CancellationToken cancellationToken)
    {
        var storeId = _tenantContext.CurrentStoreId
            ?? throw new InvalidOperationException("Store context not available");

        Guid? customerId = _currentUserService.IsCustomer ? _currentUserService.CustomerId?.Value : null;
        string? sessionId = customerId.HasValue ? null : guestSessionId;

        var query = new GetActiveConversationQuery(storeId.Value, customerId, sessionId);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            _logger.LogWarning("Failed to get active conversation: {Error}", result.Error.Message);
            return BadRequest(new { error = result.Error.Message });
        }

        if (result.Value is null)
        {
            return NotFound(new { message = "No active conversation found" });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Get conversation messages by ID
    /// </summary>
    [HttpGet("conversations/{conversationId:guid}")]
    public async Task<IActionResult> GetConversation(Guid conversationId, CancellationToken cancellationToken)
    {
        var query = new GetConversationMessagesQuery(conversationId);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            _logger.LogWarning("Failed to get conversation {ConversationId}: {Error}", conversationId, result.Error.Message);
            return BadRequest(new { error = result.Error.Message });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Send a message in a conversation (HTTP fallback for SignalR)
    /// </summary>
    [HttpPost("conversations/{conversationId:guid}/messages")]
    public async Task<IActionResult> SendMessage(
        Guid conversationId,
        [FromBody] SendMessageRequest request,
        CancellationToken cancellationToken)
    {
        // Determine sender ID
        string? senderId = _currentUserService.IsCustomer
            ? _currentUserService.CustomerId?.ToString()
            : null;

        var command = new SendChatMessageCommand(
            conversationId,
            MessageSenderType.Customer,
            senderId,
            request.Content);

        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            _logger.LogWarning("Failed to send message: {Error}", result.Error.Message);
            return BadRequest(new { error = result.Error.Message });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Generate an AI assistant reply to the latest customer message in a conversation.
    /// Used as an HTTP fallback for the SignalR <c>RequestAiReply</c> hub method.
    /// </summary>
    [HttpPost("conversations/{conversationId:guid}/ai-reply")]
    public async Task<IActionResult> GenerateAiReply(Guid conversationId, CancellationToken cancellationToken)
    {
        var storeId = _tenantContext.CurrentStoreId
            ?? throw new InvalidOperationException("Store context not available");

        var command = new GenerateAiReplyCommand(conversationId, storeId.Value);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            _logger.LogWarning("Failed to generate AI reply for {ConversationId}: {Error}", conversationId, result.Error.Message);
            return BadRequest(new { error = result.Error.Code, message = result.Error.Message });
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Record that the customer added an AI-recommended product to their cart (analytics only).
    /// </summary>
    [HttpPost("conversations/{conversationId:guid}/ai-cart-added")]
    public async Task<IActionResult> LogAiCartAddition(
        Guid conversationId,
        [FromBody] AiCartAddedRequest request,
        CancellationToken cancellationToken)
    {
        var storeId = _tenantContext.CurrentStoreId
            ?? throw new InvalidOperationException("Store context not available");

        var command = new LogAiCartAdditionCommand(conversationId, storeId.Value, request.ProductId);
        await _mediator.Send(command, cancellationToken);

        return Ok(new { logged = true });
    }

    /// <summary>
    /// Place an order on the customer's behalf from within the chat (collected by the assistant).
    /// The order is stamped as placed by the chat assistant and an analytics event is recorded.
    /// </summary>
    [HttpPost("conversations/{conversationId:guid}/place-order")]
    public async Task<IActionResult> PlaceAssistantOrder(
        Guid conversationId,
        [FromBody] PlaceOrderRequest request,
        CancellationToken cancellationToken)
    {
        var storeId = _tenantContext.CurrentStoreId
            ?? throw new InvalidOperationException("Store context not available");

        var command = new PlaceOrderCommand(
            StoreId: storeId.Value,
            CustomerName: request.CustomerInfo.FullName,
            CustomerPhone: request.CustomerInfo.Phone,
            CustomerPhoneCountryCode: request.CustomerInfo.PhoneCountryCode,
            CustomerEmail: request.CustomerInfo.Email,
            Street: request.DeliveryAddress.Street,
            City: request.DeliveryAddress.City,
            District: request.DeliveryAddress.District,
            DeliveryInstructions: request.DeliveryAddress.AdditionalInstructions,
            CustomerNotes: request.Notes,
            PaymentMethod: request.PaymentMethod,
            Items: request.Items.Select(item => new PlaceOrderItemDto(
                item.ProductId, item.Quantity, item.VariantId)).ToList(),
            CountryCode: request.DeliveryAddress.CountryCode,
            CityId: request.DeliveryAddress.CityId,
            DistrictId: request.DeliveryAddress.DistrictId,
            Source: OrderSource.ChatAssistant);

        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            _logger.LogWarning("Assistant order failed for {ConversationId}: {Error}", conversationId, result.Error.Message);
            return BadRequest(new { error = result.Error.Code, message = result.Error.Message });
        }

        // Record the AI-placed order for analytics (best-effort).
        await _mediator.Send(new LogAiOrderPlacedCommand(conversationId, storeId.Value), cancellationToken);

        return Ok(result.Value);
    }

    /// <summary>
    /// Mark messages as read by customer
    /// </summary>
    [HttpPost("conversations/{conversationId:guid}/messages/read")]
    public async Task<IActionResult> MarkMessagesAsRead(
        Guid conversationId,
        [FromBody] MarkMessagesReadRequest request,
        CancellationToken cancellationToken)
    {
        var command = new MarkMessagesAsReadCommand(
            conversationId,
            request.MessageIds,
            MessageSenderType.Customer);

        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            _logger.LogWarning("Failed to mark messages as read: {Error}", result.Error.Message);
            return BadRequest(new { error = result.Error.Message });
        }

        return Ok(new { message = "Messages marked as read" });
    }
}

public record AiCartAddedRequest(Guid ProductId);
