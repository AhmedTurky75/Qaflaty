namespace Qaflaty.Domain.Catalog.Enums;

public enum FeeAdjustmentType
{
    /// <summary>A fixed monetary value (positive = surcharge, negative = discount)</summary>
    Fixed,

    /// <summary>A percentage of the order subtotal (positive = surcharge, negative = discount)</summary>
    Percentage
}
