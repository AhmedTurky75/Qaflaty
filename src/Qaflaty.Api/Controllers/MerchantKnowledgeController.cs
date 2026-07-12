using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qaflaty.Api.Common;
using Qaflaty.Application.Ai.Commands.DeleteKnowledgeDocument;
using Qaflaty.Application.Ai.Commands.UploadKnowledgeDocument;
using Qaflaty.Application.Ai.Queries.GetKnowledgeDocumentById;
using Qaflaty.Application.Ai.Queries.GetKnowledgeDocuments;

namespace Qaflaty.Api.Controllers;

/// <summary>
/// Merchant management of a store's AI knowledge documents (uploads). Derived knowledge (products,
/// FAQ, store profile) is refreshed via the AI assistant controller; this manages arbitrary uploads.
/// </summary>
[Route("api/stores/{storeId:guid}/knowledge/documents")]
[Authorize(Policy = "CanManageStore")]
public class MerchantKnowledgeController : ApiController
{
    /// <summary>Lists all knowledge documents (derived + uploaded) for a store.</summary>
    [HttpGet]
    public async Task<IActionResult> List(Guid storeId, CancellationToken ct)
    {
        var result = await Sender.Send(new GetKnowledgeDocumentsQuery(storeId), ct);
        return HandleResult(result);
    }

    /// <summary>Returns a single knowledge document's status/detail.</summary>
    [HttpGet("{documentId:guid}")]
    public async Task<IActionResult> Get(Guid storeId, Guid documentId, CancellationToken ct)
    {
        var result = await Sender.Send(new GetKnowledgeDocumentByIdQuery(storeId, documentId), ct);
        return HandleResult(result);
    }

    /// <summary>
    /// Uploads a document. It is stored immediately and chunked/embedded asynchronously; poll the
    /// returned document's status until it becomes Ready.
    /// </summary>
    [HttpPost]
    [RequestSizeLimit(20 * 1024 * 1024)] // 20 MB
    public async Task<IActionResult> Upload(
        Guid storeId,
        [FromForm] IFormFile file,
        [FromForm] string? title,
        CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "Knowledge.EmptyFile", message = "No file was provided." });

        await using var stream = file.OpenReadStream();
        var command = new UploadKnowledgeDocumentCommand(
            storeId, stream, file.FileName, file.ContentType ?? "application/octet-stream", title);

        var result = await Sender.Send(command, ct);
        return HandleResult(result);
    }

    /// <summary>Deletes a knowledge document, its vectors, and any stored file.</summary>
    [HttpDelete("{documentId:guid}")]
    public async Task<IActionResult> Delete(Guid storeId, Guid documentId, CancellationToken ct)
    {
        var result = await Sender.Send(new DeleteKnowledgeDocumentCommand(storeId, documentId), ct);
        return HandleResult(result);
    }
}
