using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.ValueObjects;

public sealed class SocialLinks : ValueObject
{
    public string? Facebook { get; private set; } // Facebook page URL, e.g. "https://facebook.com/mystore"
    public string? Instagram { get; private set; } // Instagram profile URL, e.g. "https://instagram.com/mystore"
    public string? Twitter { get; private set; } // X/Twitter profile URL
    public string? TikTok { get; private set; } // TikTok profile URL
    public string? Snapchat { get; private set; } // Snapchat profile URL
    public string? YouTube { get; private set; } // YouTube channel URL

    private SocialLinks() { }

    public static SocialLinks CreateDefault() => new();

    public static SocialLinks Create(
        string? facebook, string? instagram, string? twitter,
        string? tikTok, string? snapchat, string? youTube) => new()
    {
        Facebook = facebook,
        Instagram = instagram,
        Twitter = twitter,
        TikTok = tikTok,
        Snapchat = snapchat,
        YouTube = youTube
    };

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Facebook;
        yield return Instagram;
        yield return Twitter;
        yield return TikTok;
        yield return Snapchat;
        yield return YouTube;
    }
}
