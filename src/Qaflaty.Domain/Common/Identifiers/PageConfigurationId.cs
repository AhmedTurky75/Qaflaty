namespace Qaflaty.Domain.Common.Identifiers;

public readonly record struct PageConfigurationId(Guid Value)
{
    public static PageConfigurationId New() => new(Guid.NewGuid());
    public static PageConfigurationId Empty => new(Guid.Empty);
    public static PageConfigurationId From(Guid guid) => new(guid);
    public override string ToString() => Value.ToString();
}
