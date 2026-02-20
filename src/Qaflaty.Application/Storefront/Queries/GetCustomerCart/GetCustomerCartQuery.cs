using Qaflaty.Application.Common;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Storefront.DTOs;

namespace Qaflaty.Application.Storefront.Queries.GetCustomerCart;

public record GetCustomerCartQuery(CartOwnerContext Owner) : IQuery<CartDto?>;
