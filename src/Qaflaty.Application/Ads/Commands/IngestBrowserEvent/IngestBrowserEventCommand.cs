using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Ads.Enums;

namespace Qaflaty.Application.Ads.Commands.IngestBrowserEvent;

public record TrackingContentItemInput(string ContentId, int Quantity, decimal? Price);

/// <summary>
/// Called by the storefront SPA right after it fires the browser pixel, so the backend
/// can (a) log that the browser event happened and (b) mirror it server-side (CAPI/Events
/// API/Measurement Protocol) using the SAME <paramref name="EventKey"/> for deduplication.
/// </summary>
public record IngestBrowserEventCommand(
    Guid StoreId,
    Guid EventKey,
    TrackingEventType EventType,
    decimal? Value,
    string? Currency,
    List<TrackingContentItemInput>? Contents,
    Guid? OrderId,
    string? CustomerRef,
    string? PageUrl,
    string? CustomerEmail,
    string? CustomerPhone
) : ICommand;
