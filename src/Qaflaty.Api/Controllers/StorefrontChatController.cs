using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qaflaty.Application.Common.Interfaces;
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
