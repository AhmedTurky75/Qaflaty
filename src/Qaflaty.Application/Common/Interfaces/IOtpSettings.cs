namespace Qaflaty.Application.Common.Interfaces;

public interface IOtpSettings
{
    /// <summary>
    /// When non-null, all generated OTP codes use this fixed value (dev/test mode).
    /// </summary>
    string? MockCode { get; }
}
