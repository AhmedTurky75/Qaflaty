using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.ValueObjects;

/// <summary>
/// Configuration for the AI shopping assistant that can replace human live chat for a store.
/// Stored as an owned value object on <see cref="Aggregates.StoreConfiguration.StoreConfiguration"/>.
/// </summary>
public sealed class AiAssistantSettings : ValueObject
{
    /// <summary>When true the AI assistant answers storefront chat messages.</summary>
    public bool Enabled { get; private set; }

    /// <summary>When true, human live chat is hidden while the AI assistant is enabled.</summary>
    public bool DisableHumanChat { get; private set; }

    public string? AssistantName { get; private set; } // Display name of the AI assistant in chat, e.g. "Sara"
    public string? WelcomeMessage { get; private set; } // First greeting the assistant sends, e.g. "Hi! How can I help you today?"
    public AssistantPersonality Personality { get; private set; } // Tone/persona used by the assistant, e.g. Friendly, Professional
    public AssistantLanguage Language { get; private set; } // Reply language policy, e.g. AutoDetect / Arabic / English

    /// <summary>Hour of day (0-23, UTC) the assistant becomes available, or null for always-on.</summary>
    public int? EnabledHoursStart { get; private set; }

    /// <summary>Hour of day (0-23, UTC) the assistant stops responding, or null for always-on.</summary>
    public int? EnabledHoursEnd { get; private set; }

    /// <summary>Maximum number of messages kept as conversational memory for a single session.</summary>
    public int MaxConversationLength { get; private set; }

    private AiAssistantSettings() { }

    public static AiAssistantSettings CreateDefault() => new()
    {
        Enabled = false,
        DisableHumanChat = false,
        AssistantName = null,
        WelcomeMessage = null,
        Personality = AssistantPersonality.Friendly,
        Language = AssistantLanguage.AutoDetect,
        EnabledHoursStart = null,
        EnabledHoursEnd = null,
        MaxConversationLength = 50
    };

    public static AiAssistantSettings Create(
        bool enabled,
        bool disableHumanChat,
        string? assistantName,
        string? welcomeMessage,
        AssistantPersonality personality,
        AssistantLanguage language,
        int? enabledHoursStart,
        int? enabledHoursEnd,
        int maxConversationLength) => new()
    {
        Enabled = enabled,
        DisableHumanChat = disableHumanChat,
        AssistantName = string.IsNullOrWhiteSpace(assistantName) ? null : assistantName.Trim(),
        WelcomeMessage = string.IsNullOrWhiteSpace(welcomeMessage) ? null : welcomeMessage.Trim(),
        Personality = personality,
        Language = language,
        EnabledHoursStart = NormalizeHour(enabledHoursStart),
        EnabledHoursEnd = NormalizeHour(enabledHoursEnd),
        MaxConversationLength = maxConversationLength <= 0 ? 50 : Math.Min(maxConversationLength, 500)
    };

    /// <summary>
    /// Returns true when the assistant is enabled and the current UTC time falls within the
    /// configured active hours (or no hours are configured, meaning always-on).
    /// </summary>
    public bool IsActiveAt(DateTime utcNow)
    {
        if (!Enabled)
            return false;

        if (EnabledHoursStart is null || EnabledHoursEnd is null)
            return true;

        var hour = utcNow.Hour;
        var start = EnabledHoursStart.Value;
        var end = EnabledHoursEnd.Value;

        // Same-day window (e.g. 9 -> 17)
        if (start <= end)
            return hour >= start && hour < end;

        // Overnight window (e.g. 22 -> 6)
        return hour >= start || hour < end;
    }

    private static int? NormalizeHour(int? hour)
    {
        if (hour is null)
            return null;
        return Math.Clamp(hour.Value, 0, 23);
    }

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Enabled;
        yield return DisableHumanChat;
        yield return AssistantName;
        yield return WelcomeMessage;
        yield return Personality;
        yield return Language;
        yield return EnabledHoursStart;
        yield return EnabledHoursEnd;
        yield return MaxConversationLength;
    }
}
