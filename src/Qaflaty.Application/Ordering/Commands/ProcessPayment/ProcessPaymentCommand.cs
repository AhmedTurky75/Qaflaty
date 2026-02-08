using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Ordering.DTOs;

namespace Qaflaty.Application.Ordering.Commands.ProcessPayment;

public record ProcessPaymentCommand(Guid OrderId) : ICommand<PaymentResultDto>;
