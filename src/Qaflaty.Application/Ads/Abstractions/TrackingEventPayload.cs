using Qaflaty.Domain.Ads.Enums;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Ads.Abstractions;

/// <summary>Normalized event data a provider adapter maps onto its own wire format.</summary>
public sealed record TrackingEventPayload(
    StoreId StoreId,
    Guid EventKey,
    TrackingEventType EventType,
    TrackingChannel Channel,
    DateTime OccurredAt,
    OrderId? OrderId,
    string? CustomerRef,
    decimal? Value,
    string? Currency,
    IReadOnlyList<TrackingContentItem>? Contents,
    string? PageUrl,
    string? ClientIpAddress,
    string? ClientUserAgent,
    string? CustomerEmail,
    string? CustomerPhone);

public sealed record TrackingContentItem(string ContentId, int Quantity, decimal? Price);
