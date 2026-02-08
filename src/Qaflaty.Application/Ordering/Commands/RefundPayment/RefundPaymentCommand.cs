using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Ordering.DTOs;

namespace Qaflaty.Application.Ordering.Commands.RefundPayment;

public record RefundPaymentCommand(Guid OrderId) : ICommand<PaymentResultDto>;
