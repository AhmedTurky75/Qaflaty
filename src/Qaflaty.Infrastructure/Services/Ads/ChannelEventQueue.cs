using System.Threading.Channels;
using Qaflaty.Application.Ads.Abstractions;

namespace Qaflaty.Infrastructure.Services.Ads;

/// <summary>
/// In-process, bounded delivery queue used as the "retry sooner than the next DB sweep"
/// fast path. Durability is provided by <c>TrackingDispatchLog.NextRetryAt</c> in the
/// database — if this queue drops an item (process restart, full buffer), the retry
/// worker's periodic DB sweep still picks it up. See docs/ADS_MANAGEMENT.md, §11/§16.
/// </summary>
public sealed class ChannelEventQueue : IEventQueue
{
    private readonly Channel<QueuedDispatch> _channel = Channel.CreateBounded<QueuedDispatch>(
        new BoundedChannelOptions(2000)
        {
            FullMode = BoundedChannelFullMode.DropOldest,
            SingleReader = true,
            SingleWriter = false
        });

    public async ValueTask EnqueueAsync(QueuedDispatch dispatch, CancellationToken ct)
        => await _channel.Writer.WriteAsync(dispatch, ct);

    public IAsyncEnumerable<QueuedDispatch> ReadAllAsync(CancellationToken ct)
        => _channel.Reader.ReadAllAsync(ct);
}
