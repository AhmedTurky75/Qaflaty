using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.ValueObjects;

public sealed class CommunicationSettings : ValueObject
{
    public bool WhatsAppEnabled { get; private set; }
    public string? WhatsAppNumber { get; private set; }
    public string? WhatsAppDefaultMessage { get; private set; }
    public bool LiveChatEnabled { get; private set; }
    public bool AiChatbotEnabled { get; private set; }
    public string? AiChatbotName { get; private set; }

    private CommunicationSettings() { }

    public static CommunicationSettings CreateDefault() => new()
    {
        WhatsAppEnabled = false,
        LiveChatEnabled = false,
        AiChatbotEnabled = false
    };

    public static CommunicationSettings Create(
        bool whatsAppEnabled, string? whatsAppNumber, string? whatsAppDefaultMessage,
        bool liveChatEnabled, bool aiChatbotEnabled, string? aiChatbotName) => new()
    {
        WhatsAppEnabled = whatsAppEnabled,
        WhatsAppNumber = whatsAppNumber,
        WhatsAppDefaultMessage = whatsAppDefaultMessage,
        LiveChatEnabled = liveChatEnabled,
        AiChatbotEnabled = aiChatbotEnabled,
        AiChatbotName = aiChatbotName
    };

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return WhatsAppEnabled;
        yield return WhatsAppNumber;
        yield return WhatsAppDefaultMessage;
        yield return LiveChatEnabled;
        yield return AiChatbotEnabled;
        yield return AiChatbotName;
    }
}
