using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Commands.RecordVariantEvent;

/// <summary>
/// Records a placeholder A/B analytics event for a variant.
/// <paramref name="EventType"/> is "impression" or "conversion". This is a stub
/// pending the full analytics pipeline; it simply increments the variant's
/// counter so the merchant dashboard has data to compare.
/// </summary>
public record RecordVariantEventCommand(
    Guid PageId,
    Guid VariantId,
    string EventType
) : ICommand;
