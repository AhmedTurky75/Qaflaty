using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Catalog.ValueObjects;

namespace Qaflaty.Application.Catalog.DTOs;

/// <summary>Maps the AI assistant settings value object to/from its DTO, including enum parsing.</summary>
public static class AiAssistantSettingsMapper
{
    public static AiAssistantSettingsDto ToDto(AiAssistantSettings settings) => new(
        settings.Enabled,
        settings.DisableHumanChat,
        settings.AssistantName,
        settings.WelcomeMessage,
        settings.Personality.ToString(),
        settings.Language.ToString(),
        settings.EnabledHoursStart,
        settings.EnabledHoursEnd,
        settings.MaxConversationLength);

    public static AiAssistantSettings ToDomain(AiAssistantSettingsDto dto)
    {
        var personality = Enum.TryParse<AssistantPersonality>(dto.Personality, true, out var p)
            ? p
            : AssistantPersonality.Friendly;

        var language = Enum.TryParse<AssistantLanguage>(dto.Language, true, out var l)
            ? l
            : AssistantLanguage.AutoDetect;

        return AiAssistantSettings.Create(
            dto.Enabled,
            dto.DisableHumanChat,
            dto.AssistantName,
            dto.WelcomeMessage,
            personality,
            language,
            dto.EnabledHoursStart,
            dto.EnabledHoursEnd,
            dto.MaxConversationLength);
    }
}
