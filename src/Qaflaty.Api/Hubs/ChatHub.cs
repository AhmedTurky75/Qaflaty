using Microsoft.AspNetCore.SignalR;
using MediatR;
using Qaflaty.Application.Communication.Commands.SendChatMessage;
using Qaflaty.Application.Communication.Commands.MarkMessagesAsRead;
using Qaflaty.Application.Communication.Queries.GetConversationMessages;
using Qaflaty.Domain.Communication.Enums;

namespace Qaflaty.Api.Hubs;

/// <summary>
/// SignalR Hub for real-time chat messaging
/// </summary>
public class ChatHub : Hub
{
    private readonly IMediator _mediator;
    private readonly ILogger<ChatHub> _logger;

    public ChatHub(IMediator mediator, ILogger<ChatHub> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Join a conversation room (for receiving real-time updates)
    /// </summary>
    public async Task JoinConversation(Guid conversationId)
    {
        var roomName = GetConversationRoom(conversationId);
        await Groups.AddToGroupAsync(Context.ConnectionId, roomName);

        _logger.LogInformation(
            "Client {ConnectionId} joined conversation {ConversationId}",
            Context.ConnectionId,
            conversationId);
    }

    /// <summary>
    /// Leave a conversation room
    /// </summary>
    public async Task LeaveConversation(Guid conversationId)
    {
        var roomName = GetConversationRoom(conversationId);
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomName);

        _logger.LogInformation(
            "Client {ConnectionId} left conversation {ConversationId}",
            Context.ConnectionId,
            conversationId);
    }

    /// <summary>
    /// Send a message in a conversation (called by client)
    /// </summary>
    public async Task SendMessage(Guid conversationId, string content, string senderType, string? senderId)
    {
        try
        {
            // Parse sender type
            if (!Enum.TryParse<MessageSenderType>(senderType, out var parsedSenderType))
            {
                throw new ArgumentException($"Invalid sender type: {senderType}");
            }

            // Send command to create message
            var command = new SendChatMessageCommand(conversationId, parsedSenderType, senderId, content);
            var result = await _mediator.Send(command);

            if (result.IsSuccess)
            {
                // Broadcast message to all clients in the conversation room
                var roomName = GetConversationRoom(conversationId);
                await Clients.Group(roomName).SendAsync("ReceiveMessage", result.Value);

                _logger.LogInformation(
                    "Message sent in conversation {ConversationId} by {SenderType}",
                    conversationId,
                    parsedSenderType);
            }
            else
            {
                // Send error back to caller
                await Clients.Caller.SendAsync("Error", result.Error.Message);
                _logger.LogWarning(
                    "Failed to send message in conversation {ConversationId}: {Error}",
                    conversationId,
                    result.Error.Message);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending message in conversation {ConversationId}", conversationId);
            await Clients.Caller.SendAsync("Error", "Failed to send message");
        }
    }

    /// <summary>
    /// Mark messages as read (called by client)
    /// </summary>
    public async Task MarkMessagesAsRead(Guid conversationId, List<Guid> messageIds, string readerType)
    {
        try
        {
            // Parse reader type
            if (!Enum.TryParse<MessageSenderType>(readerType, out var parsedReaderType))
            {
                throw new ArgumentException($"Invalid reader type: {readerType}");
            }

            // Send command to mark messages as read
            var command = new MarkMessagesAsReadCommand(conversationId, messageIds, parsedReaderType);
            var result = await _mediator.Send(command);

            if (result.IsSuccess)
            {
                // Notify other clients in the conversation room
                var roomName = GetConversationRoom(conversationId);
                await Clients.OthersInGroup(roomName).SendAsync("MessagesRead", new
                {
                    ConversationId = conversationId,
                    MessageIds = messageIds,
                    ReaderType = parsedReaderType
                });

                _logger.LogInformation(
                    "Messages marked as read in conversation {ConversationId} by {ReaderType}",
                    conversationId,
                    parsedReaderType);
            }
            else
            {
                await Clients.Caller.SendAsync("Error", result.Error.Message);
                _logger.LogWarning(
                    "Failed to mark messages as read in conversation {ConversationId}: {Error}",
                    conversationId,
                    result.Error.Message);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking messages as read in conversation {ConversationId}", conversationId);
            await Clients.Caller.SendAsync("Error", "Failed to mark messages as read");
        }
    }

    /// <summary>
    /// Notify typing status (called by client)
    /// </summary>
    public async Task SendTypingIndicator(Guid conversationId, string senderType, bool isTyping)
    {
        try
        {
            var roomName = GetConversationRoom(conversationId);
            await Clients.OthersInGroup(roomName).SendAsync("UserTyping", new
            {
                ConversationId = conversationId,
                SenderType = senderType,
                IsTyping = isTyping
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending typing indicator in conversation {ConversationId}", conversationId);
        }
    }

    /// <summary>
    /// Connection management
    /// </summary>
    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation("Client connected: {ConnectionId}", Context.ConnectionId);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation(
            "Client disconnected: {ConnectionId}, Exception: {Exception}",
            Context.ConnectionId,
            exception?.Message);
        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// Helper method to get conversation room name
    /// </summary>
    private static string GetConversationRoom(Guid conversationId) => $"conversation_{conversationId}";
}
