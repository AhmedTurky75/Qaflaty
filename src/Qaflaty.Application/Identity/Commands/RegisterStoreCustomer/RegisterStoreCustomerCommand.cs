using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Identity.DTOs;

namespace Qaflaty.Application.Identity.Commands.RegisterStoreCustomer;

public record RegisterStoreCustomerCommand(
    string Email,
    string Password,
    string FirstName,
    string LastName,
    string Username,
    string? Phone
) : ICommand<CustomerAuthResponse>;
