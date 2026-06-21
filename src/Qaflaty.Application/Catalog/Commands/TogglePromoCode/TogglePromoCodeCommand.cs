using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Commands.TogglePromoCode;

public record TogglePromoCodeCommand(PromoCodeId Id, StoreId StoreId, bool IsActive) : ICommand;
