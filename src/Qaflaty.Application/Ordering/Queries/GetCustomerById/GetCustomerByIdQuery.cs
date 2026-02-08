using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Ordering.DTOs;

namespace Qaflaty.Application.Ordering.Queries.GetCustomerById;

public record GetCustomerByIdQuery(Guid CustomerId) : IQuery<CustomerDto>;
