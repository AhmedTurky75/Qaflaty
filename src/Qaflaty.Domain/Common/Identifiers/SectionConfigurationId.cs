namespace Qaflaty.Domain.Common.Identifiers;

public readonly record struct SectionConfigurationId(Guid Value)
{
    public static SectionConfigurationId New() => new(Guid.NewGuid());
    public static SectionConfigurationId Empty => new(Guid.Empty);
    public static SectionConfigurationId From(Guid guid) => new(guid);
    public override string ToString() => Value.ToString();
}
