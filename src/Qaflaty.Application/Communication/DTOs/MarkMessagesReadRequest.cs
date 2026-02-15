namespace Qaflaty.Application.Communication.DTOs;

public sealed record MarkMessagesReadRequest
{
    public List<Guid> MessageIds { get; init; } = new();
}
