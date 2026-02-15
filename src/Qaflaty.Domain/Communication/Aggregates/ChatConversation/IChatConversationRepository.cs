using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Domain.Communication.Aggregates.ChatConversation;

public interface IChatConversationRepository
{
    Task<ChatConversation?> GetByIdAsync(ChatConversationId id, CancellationToken cancellationToken = default);
    Task<ChatConversation?> GetActiveConversationByCustomerIdAsync(StoreId storeId, StoreCustomerId customerId, CancellationToken cancellationToken = default);
    Task<ChatConversation?> GetActiveConversationByGuestSessionAsync(StoreId storeId, string guestSessionId, CancellationToken cancellationToken = default);
    Task<List<ChatConversation>> GetConversationsByStoreAsync(StoreId storeId, int pageNumber, int pageSize, CancellationToken cancellationToken = default);
    Task<int> GetUnreadConversationsCountAsync(StoreId storeId, CancellationToken cancellationToken = default);
    Task AddAsync(ChatConversation conversation, CancellationToken cancellationToken = default);
    Task UpdateAsync(ChatConversation conversation, CancellationToken cancellationToken = default);
}
