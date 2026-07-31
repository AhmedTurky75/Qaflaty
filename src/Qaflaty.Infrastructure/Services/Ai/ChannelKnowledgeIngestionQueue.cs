using System.Threading.Channels;
using Qaflaty.Application.Common.Interfaces.Ai;

namespace Qaflaty.Infrastructure.Services.Ai;

/// <summary>Bounded in-process queue feeding the <see cref="KnowledgeDocumentProcessor"/>.</summary>
public sealed class ChannelKnowledgeIngestionQueue : IKnowledgeIngestionQueue
{
    private readonly Channel<KnowledgeIngestionRequest> _channel = Channel.CreateBounded<KnowledgeIngestionRequest>(
        new BoundedChannelOptions(1000)
        {
            FullMode = BoundedChannelFullMode.Wait,
            SingleReader = true,
            SingleWriter = false
        });

    public async ValueTask EnqueueAsync(KnowledgeIngestionRequest request, CancellationToken ct = default)
        => await _channel.Writer.WriteAsync(request, ct);

    public IAsyncEnumerable<KnowledgeIngestionRequest> ReadAllAsync(CancellationToken ct)
        => _channel.Reader.ReadAllAsync(ct);
}
