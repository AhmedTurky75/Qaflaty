using Microsoft.EntityFrameworkCore;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Communication.Aggregates.ChatConversation;
using Qaflaty.Domain.Communication.Entities;
using Qaflaty.Domain.Communication.Enums;

namespace Qaflaty.Infrastructure.Persistence.Repositories.Communication;

public sealed class ChatConversationRepository : IChatConversationRepository
{
    private readonly QaflatyDbContext _context;

    public ChatConversationRepository(QaflatyDbContext context)
    {
        _context = context;
    }

    public async Task<ChatConversation?> GetByIdAsync(ChatConversationId id, CancellationToken cancellationToken = default)
    {
        var conversation = await _context.Set<ChatConversation>()
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        if (conversation is not null)
        {
            await LoadMessagesAsync(conversation, cancellationToken);
        }

        return conversation;
    }

    public async Task<ChatConversation?> GetActiveConversationByCustomerIdAsync(
        StoreId storeId,
        StoreCustomerId customerId,
        CancellationToken cancellationToken = default)
    {
        var conversation = await _context.Set<ChatConversation>()
            .Where(c => c.StoreId == storeId
                && c.CustomerId == customerId
                && c.Status == ConversationStatus.Active)
            .OrderByDescending(c => c.LastMessageAt ?? c.StartedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (conversation is not null)
        {
            await LoadMessagesAsync(conversation, cancellationToken);
        }

        return conversation;
    }

    public async Task<ChatConversation?> GetActiveConversationByGuestSessionAsync(
        StoreId storeId,
        string guestSessionId,
        CancellationToken cancellationToken = default)
    {
        var conversation = await _context.Set<ChatConversation>()
            .Where(c => c.StoreId == storeId
                && c.GuestSessionId == guestSessionId
                && c.Status == ConversationStatus.Active)
            .OrderByDescending(c => c.LastMessageAt ?? c.StartedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (conversation is not null)
        {
            await LoadMessagesAsync(conversation, cancellationToken);
        }

        return conversation;
    }

    public async Task<List<ChatConversation>> GetConversationsByStoreAsync(
        StoreId storeId,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var conversations = await _context.Set<ChatConversation>()
            .Where(c => c.StoreId == storeId && c.Status != ConversationStatus.Archived)
            .OrderByDescending(c => c.LastMessageAt ?? c.StartedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        foreach (var conversation in conversations)
        {
            await LoadMessagesAsync(conversation, cancellationToken);
        }

        return conversations;
    }

    public async Task<int> GetUnreadConversationsCountAsync(
        StoreId storeId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Set<ChatConversation>()
            .Where(c => c.StoreId == storeId
                && c.Status == ConversationStatus.Active
                && c.UnreadMerchantMessages > 0)
            .CountAsync(cancellationToken);
    }

    public async Task AddAsync(ChatConversation conversation, CancellationToken cancellationToken = default)
    {
        await _context.Set<ChatConversation>().AddAsync(conversation, cancellationToken);

        // Add messages separately
        foreach (var message in conversation.Messages)
        {
            await _context.Set<ChatMessage>().AddAsync(message, cancellationToken);
        }
    }

    public async Task UpdateAsync(ChatConversation conversation, CancellationToken cancellationToken = default)
    {
        _context.Set<ChatConversation>().Update(conversation);

        // Handle messages
        var existingMessageIds = await _context.Set<ChatMessage>()
            .Where(m => m.ConversationId == conversation.Id)
            .Select(m => m.Id)
            .ToListAsync(cancellationToken);

        var currentMessageIds = conversation.Messages.Select(m => m.Id).ToHashSet();

        // Add new messages
        var newMessages = conversation.Messages.Where(m => !existingMessageIds.Contains(m.Id));
        foreach (var message in newMessages)
        {
            await _context.Set<ChatMessage>().AddAsync(message, cancellationToken);
        }

        // Update existing messages (for read status)
        var updatedMessages = conversation.Messages.Where(m => existingMessageIds.Contains(m.Id));
        foreach (var message in updatedMessages)
        {
            _context.Set<ChatMessage>().Update(message);
        }
    }

    private async Task LoadMessagesAsync(ChatConversation conversation, CancellationToken cancellationToken)
    {
        var messages = await _context.Set<ChatMessage>()
            .Where(m => m.ConversationId == conversation.Id)
            .OrderBy(m => m.SentAt)
            .ToListAsync(cancellationToken);

        // Use reflection to populate the private _messages field
        var messagesField = typeof(ChatConversation)
            .GetField("_messages", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);

        if (messagesField is not null)
        {
            var messagesList = messagesField.GetValue(conversation) as List<ChatMessage>;
            messagesList?.Clear();
            messagesList?.AddRange(messages);
        }
    }
}
