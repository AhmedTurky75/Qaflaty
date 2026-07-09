namespace Qaflaty.Application.Ads;

/// <summary>Masks sensitive credential fields (access tokens) before they ever leave the server in a DTO.</summary>
public static class CredentialMasking
{
    private static readonly HashSet<string> SensitiveKeys = new(StringComparer.OrdinalIgnoreCase)
    {
        "accessToken", "apiSecret", "clientSecret"
    };

    public static Dictionary<string, string> Mask(IReadOnlyDictionary<string, string> credentials)
    {
        var masked = new Dictionary<string, string>();
        foreach (var (key, value) in credentials)
        {
            masked[key] = SensitiveKeys.Contains(key)
                ? MaskValue(value)
                : value;
        }
        return masked;
    }

    private static string MaskValue(string value)
    {
        if (string.IsNullOrEmpty(value))
            return string.Empty;

        var suffix = value.Length > 4 ? value[^4..] : value;
        return $"•••• {suffix}";
    }
}
