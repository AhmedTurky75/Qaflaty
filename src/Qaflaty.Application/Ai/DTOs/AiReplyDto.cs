using Qaflaty.Application.Communication.DTOs;

namespace Qaflaty.Application.Ai.DTOs;

/// <summary>A product the AI assistant recommends and offers to add to the cart.</summary>
public sealed record AiSuggestedProductDto(
    Guid ProductId,
    string Name,
    string NameAr,
    string Slug,
    decimal Price,
    string Currency,
    string? ImageUrl,
    bool InStock);

/// <summary>
/// An AI assistant reply: the persisted Bot message plus any products the assistant suggests.
/// The customer must explicitly confirm before any product is added to the cart.
/// </summary>
public sealed record AiReplyDto(
    ChatMessageDto Message,
    IReadOnlyList<AiSuggestedProductDto> SuggestedProducts);
