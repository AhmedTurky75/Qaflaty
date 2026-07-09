namespace Qaflaty.Domain.Common.Identifiers;

public readonly record struct ProviderIntegrationId(Guid Value)
{
    public static ProviderIntegrationId New() => new(Guid.NewGuid());
    public static ProviderIntegrationId Empty => new(Guid.Empty);
    public static ProviderIntegrationId From(Guid guid) => new(guid);
    public override string ToString() => Value.ToString();
}
