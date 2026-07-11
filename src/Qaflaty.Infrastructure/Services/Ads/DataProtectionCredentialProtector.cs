using Microsoft.AspNetCore.DataProtection;
using Qaflaty.Application.Ads.Abstractions;

namespace Qaflaty.Infrastructure.Services.Ads;

/// <summary>Encrypts provider credential JSON at rest using ASP.NET Core Data Protection — no plaintext secret ever reaches the database or the frontend.</summary>
public sealed class DataProtectionCredentialProtector : ICredentialProtector
{
    private const string Purpose = "Qaflaty.Ads.ProviderCredentials.v1";
    private readonly IDataProtector _protector;

    public DataProtectionCredentialProtector(IDataProtectionProvider provider)
    {
        _protector = provider.CreateProtector(Purpose);
    }

    public string Protect(string plaintextJson) => _protector.Protect(plaintextJson);

    public string Unprotect(string protectedJson) => _protector.Unprotect(protectedJson);
}
