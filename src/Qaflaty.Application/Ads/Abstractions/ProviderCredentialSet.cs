namespace Qaflaty.Application.Ads.Abstractions;

/// <summary>
/// Decrypted, in-memory-only view of a provider's credential fields (e.g. Meta's
/// pixelId/accessToken/testEventCode). Never persisted or returned to the frontend as-is —
/// <see cref="ICredentialProtector"/> handles the encrypted-at-rest form.
/// </summary>
public sealed class ProviderCredentialSet
{
    private readonly IReadOnlyDictionary<string, string> _values;

    public ProviderCredentialSet(IReadOnlyDictionary<string, string> values)
    {
        _values = values;
    }

    public string? Get(string key) => _values.TryGetValue(key, out var value) ? value : null;

    public IReadOnlyDictionary<string, string> Values => _values;
}
