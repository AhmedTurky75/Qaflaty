namespace Qaflaty.Domain.Catalog.Enums;

public enum ProductPropertyType
{
    /// <summary>Free-form text value</summary>
    Text,

    /// <summary>Numeric value (integer or decimal)</summary>
    Number,

    /// <summary>True / False toggle</summary>
    Boolean,

    /// <summary>Customer picks exactly one value from a predefined list</summary>
    SingleChoice,

    /// <summary>Customer picks one or more values from a predefined list</summary>
    MultiChoice
}
