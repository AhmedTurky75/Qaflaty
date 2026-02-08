using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Application.Common.Interfaces;

public interface IDomainEventDispatcher
{
    Task DispatchEventsAsync(IEnumerable<IDomainEvent> events, CancellationToken ct = default);
}
