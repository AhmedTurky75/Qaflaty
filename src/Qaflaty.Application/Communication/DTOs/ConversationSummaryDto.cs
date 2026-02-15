using Qaflaty.Domain.Communication.Enums;

namespace Qaflaty.Application.Communication.DTOs;

/// <summary>
/// Lightweight conversation summary without full message history
/// </summary>
public sealed record ConversationSummaryDto
{
    public Guid Id { get; init; }
    public Guid StoreId { get; init; }
    public Guid? CustomerId { get; init; }
    public string? GuestSessionId { get; init; }
    public ConversationStatus Status { get; init; }
    public DateTime StartedAt { get; init; }
    public DateTime? ClosedAt { get; init; }
    public DateTime? LastMessageAt { get; init; }
    public int UnreadMerchantMessages { get; init; }
    public int UnreadCustomerMessages { get; init; }
    public ChatMessageDto? LastMessage { get; init; }
}
