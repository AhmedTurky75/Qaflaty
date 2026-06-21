using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Commands.DeletePromoCode;

public record DeletePromoCodeCommand(PromoCodeId Id, StoreId StoreId) : ICommand;
