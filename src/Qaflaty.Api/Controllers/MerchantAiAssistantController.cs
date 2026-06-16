using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qaflaty.Api.Common;
using Qaflaty.Application.Ai.Commands.RefreshAiKnowledge;
using Qaflaty.Application.Ai.Queries.GetAiAnalytics;
using Qaflaty.Application.Ai.Queries.GetAiAssistantStatus;

namespace Qaflaty.Api.Controllers;

[Route("api/stores/{storeId:guid}/ai-assistant")]
[Authorize(Policy = "CanManageStore")]
public class MerchantAiAssistantController : ApiController
{
    /// <summary>Returns the AI assistant configuration and current knowledge state for a store.</summary>
    [HttpGet("status")]
    public async Task<IActionResult> GetStatus(Guid storeId, CancellationToken ct)
    {
        var result = await Sender.Send(new GetAiAssistantStatusQuery(storeId), ct);
        return HandleResult(result);
    }

    /// <summary>
    /// Rebuilds the in-memory AI knowledge (vector store) from the store's latest
    /// profile, contact/social info, published FAQ, and active products.
    /// </summary>
    [HttpPost("refresh-knowledge")]
    public async Task<IActionResult> RefreshKnowledge(Guid storeId, CancellationToken ct)
    {
        var result = await Sender.Send(new RefreshAiKnowledgeCommand(storeId), ct);
        return HandleResult(result);
    }

    /// <summary>Returns aggregated AI assistant analytics for the merchant dashboard.</summary>
    [HttpGet("analytics")]
    public async Task<IActionResult> GetAnalytics(Guid storeId, CancellationToken ct)
    {
        var result = await Sender.Send(new GetAiAnalyticsQuery(storeId), ct);
        return HandleResult(result);
    }
}
