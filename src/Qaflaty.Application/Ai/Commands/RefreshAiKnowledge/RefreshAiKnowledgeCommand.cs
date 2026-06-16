using Qaflaty.Application.Ai.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Ai.Commands.RefreshAiKnowledge;

/// <summary>
/// Rebuilds the in-memory AI knowledge (vector store) for a store from its latest
/// profile, social/contact info, published FAQ, and active products.
/// </summary>
public sealed record RefreshAiKnowledgeCommand(Guid StoreId) : ICommand<AiKnowledgeRefreshResultDto>;
