namespace Qaflaty.Domain.Catalog.Enums;

/// <summary>
/// Language the AI shopping assistant replies in.
/// <see cref="AutoDetect"/> lets the model mirror the language of the customer's message.
/// </summary>
public enum AssistantLanguage
{
    Arabic = 1,
    English = 2,
    AutoDetect = 3
}
