using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Communication.Commands.SendChatMessage;
using Qaflaty.Application.Communication.Commands.MarkMessagesAsRead;
using Qaflaty.Application.Communication.Commands.CloseConversation;
using Qaflaty.Application.Communication.Queries.GetConversations;
using Qaflaty.Application.Communication.Queries.GetConversationMessages;
using Qaflaty.Application.Communication.DTOs;
using Qaflaty.Domain.Communication.Enums;

namespace Qaflaty.Api.Controllers;

[ApiController]
[Route("api/stores/{storeId:guid}/chat")]
[Authorize(Policy = "MerchantPolicy")]
public class MerchantChatController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<MerchantChatController> _logger;

    public MerchantChatController(
        IMediator mediator,
        ICurrentUserService currentUserService,
        ILogger<MerchantChatController> logger)
    {
        _mediator = mediator;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    /// <summary>
    /// Get all conversations for a store (paginated)
    /// </summary>
    [HttpGet("conversations")]
    public async Task<IActionResult> GetConversations(
        Guid storeId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = new GetConversationsQuery(storeId, pageNumber, pageSize);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            _logger.LogWarning("Failed to get conversations for store {StoreId}: {Error}", storeId, result.Error.Message);
            return BadRequest(new { error = result.Error.Message });
        }

        return Ok(new
        {
            conversations = result.Value,
            pageNumber,
            pageSize,
            totalCount = result.Value.Count
        });
    }

    /// <summary>
    /// Get conversation by ID with all messages
    /// </summary>
    [HttpGet("conversations/{conversationId:guid}")]
    public async Task<IActionResult> GetConversation(
        Guid storeId,
        Guid conversationId,
        CancellationToken cancellationToken)
    {
        var query = new GetConversationMessagesQuery(conversationId);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            _logger.LogWarning("Failed to get conversation {ConversationId}: {Error}", conversationId, result.Error.Message);
            return BadRequest(new { error = result.Error.Message });
        }

        // Verify conversation belongs to this store
        if (result.Value.StoreId != storeId)
        {
            _logger.LogWarning(
                "Merchant attempted to access conversation {ConversationId} from different store",
                conversationId);
            return Forbid();
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Send a message as merchant (HTTP fallback for SignalR)
    /// </summary>
    [HttpPost("conversations/{conversationId:guid}/messages")]
    public async Task<IActionResult> SendMessage(
        Guid storeId,
        Guid conversationId,
        [FromBody] SendMessageRequest request,
        CancellationToken cancellationToken)
    {
        var merchantId = _currentUserService.MerchantId?.ToString();

        var command = new SendChatMessageCommand(
            conversationId,
            MessageSenderType.Merchant,
            merchantId,
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
    /// Mark messages as read by merchant
    /// </summary>
    [HttpPost("conversations/{conversationId:guid}/messages/read")]
    public async Task<IActionResult> MarkMessagesAsRead(
        Guid storeId,
        Guid conversationId,
        [FromBody] MarkMessagesReadRequest request,
        CancellationToken cancellationToken)
    {
        var command = new MarkMessagesAsReadCommand(
            conversationId,
            request.MessageIds,
            MessageSenderType.Merchant);

        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            _logger.LogWarning("Failed to mark messages as read: {Error}", result.Error.Message);
            return BadRequest(new { error = result.Error.Message });
        }

        return Ok(new { message = "Messages marked as read" });
    }

    /// <summary>
    /// Close a conversation
    /// </summary>
    [HttpPost("conversations/{conversationId:guid}/close")]
    public async Task<IActionResult> CloseConversation(
        Guid storeId,
        Guid conversationId,
        CancellationToken cancellationToken)
    {
        var command = new CloseConversationCommand(conversationId);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.IsFailure)
        {
            _logger.LogWarning("Failed to close conversation {ConversationId}: {Error}", conversationId, result.Error.Message);
            return BadRequest(new { error = result.Error.Message });
        }

        return Ok(new { message = "Conversation closed successfully" });
    }

    /// <summary>
    /// Get unread conversations count (for notification badge)
    /// </summary>
    [HttpGet("conversations/unread/count")]
    public async Task<IActionResult> GetUnreadCount(
        Guid storeId,
        CancellationToken cancellationToken)
    {
        // This would require a new query - for now return conversations and count client-side
        var query = new GetConversationsQuery(storeId, 1, 100);
        var result = await _mediator.Send(query, cancellationToken);

        if (result.IsFailure)
        {
            _logger.LogWarning("Failed to get unread count: {Error}", result.Error.Message);
            return BadRequest(new { error = result.Error.Message });
        }

        var unreadCount = result.Value.Count(c => c.UnreadMerchantMessages > 0);

        return Ok(new { unreadCount });
    }
}
