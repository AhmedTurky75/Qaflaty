using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Ads.Commands.ReplayEvent;

public record ReplayEventCommand(Guid StoreId, Guid TrackingEventId, Guid DispatchLogId) : ICommand;
