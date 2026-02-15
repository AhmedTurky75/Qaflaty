namespace Qaflaty.Application.Communication.DTOs;

public sealed record SendMessageRequest
{
    public string Content { get; init; } = string.Empty;
    public string? GuestSessionId { get; init; }
}
