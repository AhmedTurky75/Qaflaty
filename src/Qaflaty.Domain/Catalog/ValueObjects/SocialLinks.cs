using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.ValueObjects;

public sealed class SocialLinks : ValueObject
{
    public string? Facebook { get; private set; }
    public string? Instagram { get; private set; }
    public string? Twitter { get; private set; }
    public string? TikTok { get; private set; }
    public string? Snapchat { get; private set; }
    public string? YouTube { get; private set; }

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
