using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Storefront.Commands.ClearCart;

public record ClearCartCommand(StoreCustomerId CustomerId) : ICommand;
