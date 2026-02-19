using Qaflaty.Domain.Communication.Enums;

namespace Qaflaty.Application.Communication.DTOs;

public sealed record ChatMessageDto
{
    public Guid Id { get; init; }
    public Guid ConversationId { get; init; }
    public string SenderType { get; init; }
    public string? SenderId { get; init; }
    public string Content { get; init; } = string.Empty;
    public DateTime SentAt { get; init; }
    public DateTime? ReadAt { get; init; }
}
