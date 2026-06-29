namespace Qaflaty.Domain.Common.Primitives;

public abstract class AggregateRoot<TId> : Entity<TId>
    where TId : notnull
{
    private readonly List<IDomainEvent> _domainEvents = []; // Backing buffer of domain events raised but not yet dispatched

    public IReadOnlyList<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly(); // Pending domain events; dispatched by DomainEventDispatcherInterceptor after SaveChanges, then cleared

    protected AggregateRoot(TId id) : base(id)
    {
    }

    protected AggregateRoot()
    {
    }

    protected void RaiseDomainEvent(IDomainEvent domainEvent)
    {
        _domainEvents.Add(domainEvent);
    }

    public void ClearDomainEvents()
    {
        _domainEvents.Clear();
    }
}
