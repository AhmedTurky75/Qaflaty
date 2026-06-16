namespace Qaflaty.Domain.Communication.Enums;

/// <summary>The kind of AI assistant interaction recorded for analytics.</summary>
public enum AiInteractionType
{
    /// <summary>The assistant generated a reply to a customer question.</summary>
    Reply = 1,

    /// <summary>The assistant recommended a specific product.</summary>
    ProductSuggested = 2,

    /// <summary>A customer added an AI-recommended product to their cart.</summary>
    CartAdd = 3
}
