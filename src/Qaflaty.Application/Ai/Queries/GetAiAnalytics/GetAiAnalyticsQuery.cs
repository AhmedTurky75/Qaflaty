using Qaflaty.Application.Ai.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Ai.Queries.GetAiAnalytics;

public sealed record GetAiAnalyticsQuery(Guid StoreId) : IQuery<AiAnalyticsDto>;
