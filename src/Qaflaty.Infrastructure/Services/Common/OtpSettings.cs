using Microsoft.Extensions.Configuration;
using Qaflaty.Application.Common.Interfaces;

namespace Qaflaty.Infrastructure.Services.Common;

public class OtpSettings : IOtpSettings
{
    public string? MockCode { get; }

    public OtpSettings(IConfiguration configuration)
    {
        MockCode = configuration.GetValue<bool>("MockOtp:Enabled")
            ? configuration.GetValue<string>("MockOtp:Code")
            : null;
    }
}
