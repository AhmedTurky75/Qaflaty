using Qaflaty.Application.Ai.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Ai.Queries.GetAiAssistantStatus;

public sealed record GetAiAssistantStatusQuery(Guid StoreId) : IQuery<AiAssistantStatusDto>;
