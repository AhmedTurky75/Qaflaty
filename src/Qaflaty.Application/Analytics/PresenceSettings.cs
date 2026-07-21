namespace Qaflaty.Application.Analytics;

/// <summary>
/// Shared constants for the presence subsystem — a visitor with no heartbeat inside the
/// TTL window is no longer counted as active; the sweeper reclaims/pushes on this cadence.
/// </summary>
public static class PresenceSettings
{
    public static readonly TimeSpan Ttl = TimeSpan.FromMinutes(10);
    public static readonly TimeSpan SweepInterval = TimeSpan.FromSeconds(15);
}
