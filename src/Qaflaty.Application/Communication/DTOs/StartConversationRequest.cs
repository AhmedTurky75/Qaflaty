namespace Qaflaty.Application.Communication.DTOs;

public sealed record StartConversationRequest
{
    public string? GuestSessionId { get; init; }
    public string? InitialMessage { get; init; }
}
