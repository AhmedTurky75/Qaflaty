using MediatR;

namespace Qaflaty.Domain.Common.Primitives;

public interface IDomainEvent : INotification
{
    Guid EventId { get; } // Unique identifier of this event occurrence (for idempotency / tracing)
    DateTime OccurredAt { get; } // UTC time the event happened
}

public abstract record DomainEvent : IDomainEvent
{
    public Guid EventId { get; init; } = Guid.NewGuid(); // Auto-generated unique id for each raised event instance
    public DateTime OccurredAt { get; init; } = DateTime.UtcNow; // Auto-captured UTC timestamp at the moment the event was constructed
}
