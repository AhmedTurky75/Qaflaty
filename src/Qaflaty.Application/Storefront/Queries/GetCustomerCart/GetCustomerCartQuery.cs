using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Storefront.DTOs;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Storefront.Queries.GetCustomerCart;

public record GetCustomerCartQuery(StoreCustomerId CustomerId) : IQuery<CartDto?>;
