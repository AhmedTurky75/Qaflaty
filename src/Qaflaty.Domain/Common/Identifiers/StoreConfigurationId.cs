namespace Qaflaty.Domain.Common.Identifiers;

public readonly record struct StoreConfigurationId(Guid Value)
{
    public static StoreConfigurationId New() => new(Guid.NewGuid());
    public static StoreConfigurationId Empty => new(Guid.Empty);
    public static StoreConfigurationId From(Guid guid) => new(guid);
    public override string ToString() => Value.ToString();
}
