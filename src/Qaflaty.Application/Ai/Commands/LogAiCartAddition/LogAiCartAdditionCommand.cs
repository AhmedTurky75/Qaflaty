using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Ai.Commands.LogAiCartAddition;

/// <summary>
/// Records that a customer added an AI-recommended product to their cart (analytics only).
/// </summary>
public sealed record LogAiCartAdditionCommand(
    Guid ConversationId,
    Guid StoreId,
    Guid ProductId) : ICommand;
