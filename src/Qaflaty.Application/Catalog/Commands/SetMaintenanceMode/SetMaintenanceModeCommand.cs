using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Commands.SetMaintenanceMode;

public record SetMaintenanceModeCommand(Guid StoreId, bool Enabled) : ICommand;
