using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Identity.DTOs;

namespace Qaflaty.Application.Identity.Queries.GetCurrentCustomer;

public record GetCurrentCustomerQuery : IQuery<StoreCustomerDto>;
