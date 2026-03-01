using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Ordering.Aggregates.Order;
using Qaflaty.Domain.Ordering.Errors;
using Qaflaty.Domain.Ordering.Repositories;
using Qaflaty.Domain.Ordering.ValueObjects;

namespace Qaflaty.Application.Ordering.Commands.SendOrderOtp;

public class SendOrderOtpCommandHandler : ICommandHandler<SendOrderOtpCommand>
{
    private readonly IOrderRepository _orderRepository;
    private readonly IOrderOtpRepository _otpRepository;
    private readonly IStoreRepository _storeRepository;
    private readonly IEmailService _emailService;

    public SendOrderOtpCommandHandler(
        IOrderRepository orderRepository,
        IOrderOtpRepository otpRepository,
        IStoreRepository storeRepository,
        IEmailService emailService)
    {
        _orderRepository = orderRepository;
        _otpRepository = otpRepository;
        _storeRepository = storeRepository;
        _emailService = emailService;
    }

    public async Task<Result> Handle(SendOrderOtpCommand request, CancellationToken cancellationToken)
    {
        var storeId = new StoreId(request.StoreId);

        var orderNumberResult = OrderNumber.Parse(request.OrderNumber);
        if (orderNumberResult.IsFailure)
            return Result.Failure(orderNumberResult.Error);

        var order = await _orderRepository.GetByOrderNumberAsync(storeId, orderNumberResult.Value, cancellationToken);
        if (order == null)
            return Result.Failure(OrderingErrors.OrderNotFound);

        if (order.Status != Domain.Ordering.Enums.OrderStatus.Pending)
            return Result.Failure(OrderingErrors.OrderNotPending);

        // Get most recent OTP (active or used) to find the customer email
        var mostRecentOtp = await _otpRepository.GetMostRecentByOrderIdAsync(order.Id, cancellationToken);
        if (mostRecentOtp == null)
            return Result.Failure(OrderingErrors.OtpNotFound);

        // Enforce 60-second resend cooldown on active OTPs
        if (!mostRecentOtp.IsUsed)
        {
            var secondsSinceCreated = (DateTime.UtcNow - mostRecentOtp.CreatedAt).TotalSeconds;
            if (secondsSinceCreated < 60)
                return Result.Failure(OrderingErrors.OtpResendTooSoon);

            mostRecentOtp.Invalidate();
            _otpRepository.Update(mostRecentOtp);
        }

        var email = mostRecentOtp.Email;

        var store = await _storeRepository.GetByIdAsync(storeId, cancellationToken);
        var storeName = store?.Name?.Value ?? "Qaflaty";

        var newOtp = OrderOtp.Create(order.Id, email);
        await _otpRepository.AddAsync(newOtp, cancellationToken);

        var htmlBody = BuildOtpEmail(storeName, order.OrderNumber.Value, newOtp.Code);

        await _emailService.SendEmailAsync(
            to: email,
            subject: $"Your order verification code - {order.OrderNumber.Value}",
            htmlBody: htmlBody,
            ct: cancellationToken);

        return Result.Success();
    }

    private static string BuildOtpEmail(string storeName, string orderNumber, string otpCode) => $"""
        <!DOCTYPE html>
        <html lang="en">
        <head><meta charset="UTF-8"><title>Order Verification</title></head>
        <body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
            <tr><td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                <tr><td style="background:#1a1a2e;padding:32px 40px;text-align:center;border-radius:8px 8px 0 0;">
                  <h1 style="margin:0;color:#fff;font-size:24px;">{storeName}</h1>
                </td></tr>
                <tr><td style="padding:40px;">
                  <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:20px;">Verify Your Order</h2>
                  <p style="margin:0 0 8px;color:#555;font-size:15px;">Thank you for your order <strong>{orderNumber}</strong>!</p>
                  <p style="margin:0 0 32px;color:#555;font-size:15px;">Enter the code below to confirm. It expires in <strong>{OrderOtp.ExpiryMinutes} minutes</strong>.</p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr><td align="center" style="padding:24px;background:#f8f9fa;border-radius:8px;border:2px dashed #dee2e6;">
                      <p style="margin:0 0 8px;color:#6c757d;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Verification Code</p>
                      <p style="margin:0;color:#1a1a2e;font-size:48px;font-weight:700;letter-spacing:12px;font-family:'Courier New',monospace;">{otpCode}</p>
                    </td></tr>
                  </table>
                  <p style="margin:32px 0 0;color:#999;font-size:13px;">If you did not place this order, please ignore this email.</p>
                </td></tr>
                <tr><td style="padding:24px 40px;background:#f8f9fa;border-top:1px solid #e9ecef;text-align:center;border-radius:0 0 8px 8px;">
                  <p style="margin:0;color:#aaa;font-size:12px;">&copy; {DateTime.UtcNow.Year} {storeName}. All rights reserved.</p>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
        """;
}
