namespace Qaflaty.Domain.Identity.Aggregates.AccessDeniedReport;

/// <summary>
/// Records an access-denied incident where a user's request was rejected
/// even after a successful token refresh. Used by the admin dashboard.
/// </summary>
public sealed class AccessDeniedReport
{
    public Guid Id { get; private set; } // Primary key of the incident record

    /// <summary>Merchant or customer ID as a string. Null if the user could not be identified.</summary>
    public string? UserId { get; private set; } // Identifier of the denied user, or null when unknown

    /// <summary>"merchant" or "customer"</summary>
    public string UserType { get; private set; } = null!; // Which kind of user was denied: "merchant" or "customer"

    /// <summary>The API endpoint URL that was denied.</summary>
    public string Endpoint { get; private set; } = null!; // The request path that returned access-denied, e.g. "/api/orders"

    public DateTime ReportedAt { get; private set; } // UTC timestamp when the incident was logged

    public bool IsReviewed { get; private set; } // Whether an admin has reviewed this incident

    private AccessDeniedReport() { }

    public static AccessDeniedReport Create(string? userId, string userType, string endpoint) =>
        new()
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            UserType = userType,
            Endpoint = endpoint,
            ReportedAt = DateTime.UtcNow,
            IsReviewed = false
        };
}
