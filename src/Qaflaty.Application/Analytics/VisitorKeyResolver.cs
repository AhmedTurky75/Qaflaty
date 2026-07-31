namespace Qaflaty.Application.Analytics;

/// <summary>Shared resolution logic used by every presence command handler.</summary>
internal static class VisitorKeyResolver
{
    internal static VisitorKey? Resolve(Guid? customerId, string? guestId)
    {
        if (customerId.HasValue)
            return VisitorKey.ForCustomer(customerId.Value);

        if (!string.IsNullOrWhiteSpace(guestId))
            return VisitorKey.ForGuest(guestId);

        return null;
    }
}
