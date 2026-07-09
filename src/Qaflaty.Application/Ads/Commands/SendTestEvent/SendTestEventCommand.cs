using Qaflaty.Application.Ads.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Ads.Enums;

namespace Qaflaty.Application.Ads.Commands.SendTestEvent;

public record SendTestEventCommand(Guid StoreId, TrackingEventType EventType) : ICommand<TrackingLogRowDto[]>;
