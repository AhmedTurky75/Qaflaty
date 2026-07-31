namespace Qaflaty.Application.Ordering.DTOs;

// --- Sales chart ---

/// <summary>
/// One day on the merchant dashboard sales chart. Days with no orders are still emitted with zeroes
/// so the chart draws a continuous line instead of collapsing the gaps.
/// </summary>
public record SalesChartPointDto(
    string Date, // ISO date (yyyy-MM-dd) of the bucket, in UTC
    decimal Revenue,
    int Orders
);

// --- Top products ---

public record TopProductDto(
    Guid Id,
    string Name,
    int SalesCount, // Units sold across all counted orders
    decimal Revenue,
    string? ImageUrl
);
