using Qaflaty.Application.Common;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Storefront.Commands.ClearCart;

public record ClearCartCommand(CartOwnerContext Owner) : ICommand;
