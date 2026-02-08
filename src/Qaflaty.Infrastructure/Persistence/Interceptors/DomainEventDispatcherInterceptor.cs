using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Infrastructure.Persistence.Interceptors;

public class DomainEventDispatcherInterceptor : SaveChangesInterceptor
{
    private readonly IPublisher _publisher;

    public DomainEventDispatcherInterceptor(IPublisher publisher)
    {
        _publisher = publisher;
    }

    public override async ValueTask<int> SavedChangesAsync(
        SaveChangesCompletedEventData eventData,
        int result,
        CancellationToken cancellationToken = default)
    {
        if (eventData.Context is not null)
            await DispatchDomainEventsAsync(eventData.Context, cancellationToken);

        return result;
    }

    private async Task DispatchDomainEventsAsync(DbContext context, CancellationToken cancellationToken)
    {
        var domainEvents = context.ChangeTracker
            .Entries()
            .Where(e => IsAggregateRoot(e.Entity.GetType()))
            .SelectMany(e =>
            {
                var eventsProperty = e.Entity.GetType().GetProperty("DomainEvents");
                var events = eventsProperty?.GetValue(e.Entity) as IReadOnlyList<IDomainEvent>;
                return events ?? [];
            })
            .ToList();

        // Clear events from all aggregates
        foreach (var entry in context.ChangeTracker.Entries().Where(e => IsAggregateRoot(e.Entity.GetType())))
        {
            var clearMethod = entry.Entity.GetType().GetMethod("ClearDomainEvents");
            clearMethod?.Invoke(entry.Entity, null);
        }

        // Dispatch events after clearing to avoid re-dispatch
        foreach (var domainEvent in domainEvents)
        {
            await _publisher.Publish(domainEvent, cancellationToken);
        }
    }

    private static bool IsAggregateRoot(Type type)
    {
        var current = type.BaseType;
        while (current != null)
        {
            if (current.IsGenericType && current.GetGenericTypeDefinition() == typeof(AggregateRoot<>))
                return true;
            current = current.BaseType;
        }
        return false;
    }
}
