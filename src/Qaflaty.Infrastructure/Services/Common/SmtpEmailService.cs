using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Qaflaty.Application.Common.Interfaces;

namespace Qaflaty.Infrastructure.Services.Common;

public class SmtpEmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<SmtpEmailService> _logger;

    public SmtpEmailService(IConfiguration configuration, ILogger<SmtpEmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendEmailAsync(string to, string subject, string htmlBody, CancellationToken ct = default)
    {
        var settings = _configuration.GetSection("EmailSettings");
        var smtpHost = settings["SmtpHost"] ?? throw new InvalidOperationException("EmailSettings:SmtpHost is not configured");
        var smtpPort = int.Parse(settings["SmtpPort"] ?? "587");
        var useSsl = bool.Parse(settings["UseSsl"] ?? "true");
        var senderEmail = settings["SenderEmail"] ?? throw new InvalidOperationException("EmailSettings:SenderEmail is not configured");
        var senderName = settings["SenderName"] ?? "Qaflaty";
        var appPassword = settings["AppPassword"] ?? throw new InvalidOperationException("EmailSettings:AppPassword is not configured");

        using var client = new SmtpClient(smtpHost, smtpPort)
        {
            EnableSsl = useSsl,
            Credentials = new NetworkCredential(senderEmail, appPassword)
        };

        using var message = new MailMessage
        {
            From = new MailAddress(senderEmail, senderName),
            Subject = subject,
            Body = htmlBody,
            IsBodyHtml = true
        };

        message.To.Add(to);

        try
        {
            await client.SendMailAsync(message, ct);
            _logger.LogInformation("Email sent to {To} with subject '{Subject}'", to, subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {To} with subject '{Subject}'", to, subject);
            throw;
        }
    }
}
