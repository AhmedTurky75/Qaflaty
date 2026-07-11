namespace Qaflaty.Application.Ads.Abstractions;

/// <summary>Encrypts/decrypts the opaque JSON credential blob stored on <c>ProviderIntegration</c>. Never exposes plaintext to the API layer.</summary>
public interface ICredentialProtector
{
    string Protect(string plaintextJson);
    string Unprotect(string protectedJson);
}
