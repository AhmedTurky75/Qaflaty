using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qaflaty.Api.Common;
using Qaflaty.Application.Catalog.Commands.CreateCustomPage;
using Qaflaty.Application.Catalog.Commands.CreateFaqItem;
using Qaflaty.Application.Catalog.Commands.DeleteCustomPage;
using Qaflaty.Application.Catalog.Commands.DeleteFaqItem;
using Qaflaty.Application.Catalog.Commands.ReorderFaqItems;
using Qaflaty.Application.Catalog.Commands.UpdateFaqItem;
using Qaflaty.Application.Catalog.Commands.UpdatePageConfiguration;
using Qaflaty.Application.Catalog.Commands.UpdateSectionConfiguration;
using Qaflaty.Application.Catalog.Commands.UpdateStoreConfiguration;
using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Catalog.Queries.GetFaqItems;
using Qaflaty.Application.Catalog.Queries.GetPageConfigurationById;
using Qaflaty.Application.Catalog.Queries.GetPageConfigurations;
using Qaflaty.Application.Catalog.Queries.GetStoreConfiguration;

namespace Qaflaty.Api.Controllers;

[Route("api/stores/{storeId:guid}")]
[Authorize]
public class StoreConfigurationController : ApiController
{
    // Store Configuration
    [HttpGet("configuration")]
    public async Task<IActionResult> GetConfiguration(Guid storeId, CancellationToken ct)
    {
        var result = await Sender.Send(new GetStoreConfigurationQuery(storeId), ct);
        return HandleResult(result);
    }

    [HttpPut("configuration")]
    public async Task<IActionResult> UpdateConfiguration(
        Guid storeId, [FromBody] UpdateStoreConfigurationRequest request, CancellationToken ct)
    {
        var command = new UpdateStoreConfigurationCommand(
            storeId,
            request.PageToggles,
            request.FeatureToggles,
            request.CustomerAuthSettings,
            request.CommunicationSettings,
            request.LocalizationSettings,
            request.SocialLinks,
            request.HeaderVariant,
            request.FooterVariant,
            request.ProductCardVariant,
            request.ProductGridVariant);

        var result = await Sender.Send(command, ct);
        return HandleResult(result);
    }

    // Page Configurations
    [HttpGet("pages")]
    public async Task<IActionResult> GetPages(Guid storeId, CancellationToken ct)
    {
        var result = await Sender.Send(new GetPageConfigurationsQuery(storeId), ct);
        return HandleResult(result);
    }

    [HttpPut("pages/{pageId:guid}")]
    public async Task<IActionResult> UpdatePage(
        Guid storeId, Guid pageId, [FromBody] UpdatePageConfigurationRequest request, CancellationToken ct)
    {
        var command = new UpdatePageConfigurationCommand(
            pageId, request.Title, request.Slug, request.IsEnabled, request.SeoSettings, request.ContentJson);
        var result = await Sender.Send(command, ct);
        return HandleResult(result);
    }

    [HttpPost("pages/custom")]
    public async Task<IActionResult> CreateCustomPage(
        Guid storeId, [FromBody] CreateCustomPageRequest request, CancellationToken ct)
    {
        var command = new CreateCustomPageCommand(storeId, request.Title, request.Slug, request.ContentJson);
        var result = await Sender.Send(command, ct);

        if (result.IsFailure) return HandleResult(result);
        return StatusCode(StatusCodes.Status201Created, result.Value);
    }

    [HttpDelete("pages/{pageId:guid}")]
    public async Task<IActionResult> DeleteCustomPage(Guid storeId, Guid pageId, CancellationToken ct)
    {
        var result = await Sender.Send(new DeleteCustomPageCommand(pageId), ct);
        if (result.IsFailure) return HandleResult(result);
        return NoContent();
    }

    [HttpPut("pages/{pageId:guid}/sections")]
    public async Task<IActionResult> UpdateSections(
        Guid storeId, Guid pageId, [FromBody] UpdateSectionsRequest request, CancellationToken ct)
    {
        var command = new UpdateSectionConfigurationCommand(pageId, request.Sections);
        var result = await Sender.Send(command, ct);
        return HandleResult(result);
    }

    // FAQ Items
    [HttpGet("faq")]
    public async Task<IActionResult> GetFaqItems(Guid storeId, CancellationToken ct)
    {
        var result = await Sender.Send(new GetFaqItemsQuery(storeId), ct);
        return HandleResult(result);
    }

    [HttpPost("faq")]
    public async Task<IActionResult> CreateFaqItem(
        Guid storeId, [FromBody] CreateFaqItemRequest request, CancellationToken ct)
    {
        var command = new CreateFaqItemCommand(storeId, request.Question, request.Answer, request.IsPublished);
        var result = await Sender.Send(command, ct);

        if (result.IsFailure) return HandleResult(result);
        return StatusCode(StatusCodes.Status201Created, result.Value);
    }

    [HttpPut("faq/{id:guid}")]
    public async Task<IActionResult> UpdateFaqItem(
        Guid storeId, Guid id, [FromBody] UpdateFaqItemRequest request, CancellationToken ct)
    {
        var command = new UpdateFaqItemCommand(id, request.Question, request.Answer, request.IsPublished);
        var result = await Sender.Send(command, ct);
        return HandleResult(result);
    }

    [HttpDelete("faq/{id:guid}")]
    public async Task<IActionResult> DeleteFaqItem(Guid storeId, Guid id, CancellationToken ct)
    {
        var result = await Sender.Send(new DeleteFaqItemCommand(id), ct);
        if (result.IsFailure) return HandleResult(result);
        return NoContent();
    }

    [HttpPut("faq/reorder")]
    public async Task<IActionResult> ReorderFaqItems(
        Guid storeId, [FromBody] ReorderFaqItemsRequest request, CancellationToken ct)
    {
        var command = new ReorderFaqItemsCommand(storeId, request.OrderedIds);
        var result = await Sender.Send(command, ct);
        if (result.IsFailure) return HandleResult(result);
        return NoContent();
    }
}

// Request DTOs
public record UpdateStoreConfigurationRequest(
    PageTogglesDto PageToggles,
    FeatureTogglesDto FeatureToggles,
    CustomerAuthSettingsDto CustomerAuthSettings,
    CommunicationSettingsDto CommunicationSettings,
    LocalizationSettingsDto LocalizationSettings,
    SocialLinksDto SocialLinks,
    string HeaderVariant,
    string FooterVariant,
    string ProductCardVariant,
    string ProductGridVariant);

public record UpdatePageConfigurationRequest(
    BilingualTextDto Title,
    string Slug,
    bool IsEnabled,
    PageSeoSettingsDto SeoSettings,
    string? ContentJson);

public record CreateCustomPageRequest(
    BilingualTextDto Title,
    string Slug,
    string? ContentJson);

public record UpdateSectionsRequest(List<SectionConfigurationDto> Sections);

public record CreateFaqItemRequest(
    BilingualTextDto Question,
    BilingualTextDto Answer,
    bool IsPublished = true);

public record UpdateFaqItemRequest(
    BilingualTextDto Question,
    BilingualTextDto Answer,
    bool IsPublished);

public record ReorderFaqItemsRequest(List<Guid> OrderedIds);
