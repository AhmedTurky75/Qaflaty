using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Communication.DTOs;

namespace Qaflaty.Application.Ai.Commands.GenerateAiReply;

/// <summary>
/// Generates an AI assistant reply to the latest customer message in a conversation using
/// retrieval-augmented generation, persists it as a Bot message, and returns it.
/// </summary>
/// <param name="ConversationId">The conversation to reply within.</param>
/// <param name="ExpectedStoreId">
/// Tenant store id used to verify the conversation belongs to the current store (isolation).
/// </param>
public sealed record GenerateAiReplyCommand(
    Guid ConversationId,
    Guid? ExpectedStoreId) : ICommand<ChatMessageDto>;
