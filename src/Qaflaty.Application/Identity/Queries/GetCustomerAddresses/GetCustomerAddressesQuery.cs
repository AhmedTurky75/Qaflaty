using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Identity.DTOs;

namespace Qaflaty.Application.Identity.Queries.GetCustomerAddresses;

public record GetCustomerAddressesQuery : IQuery<List<CustomerAddressDto>>;
