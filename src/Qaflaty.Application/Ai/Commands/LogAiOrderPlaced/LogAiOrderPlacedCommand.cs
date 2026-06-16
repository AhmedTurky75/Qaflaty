using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Ai.Commands.LogAiOrderPlaced;

/// <summary>Records that the AI assistant placed an order on the customer's behalf (analytics).</summary>
public sealed record LogAiOrderPlacedCommand(
    Guid ConversationId,
    Guid StoreId) : ICommand;
