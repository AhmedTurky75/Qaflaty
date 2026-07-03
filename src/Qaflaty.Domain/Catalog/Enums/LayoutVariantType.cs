namespace Qaflaty.Domain.Catalog.Enums;

/// <summary>
/// The storefront slot a <see cref="Aggregates.LayoutVariant.LayoutVariant"/> configures. This set
/// is closed and backend-owned (the slots never change), unlike the individual variant codes which
/// are frontend-defined and live in the layout_variants catalog table.
/// </summary>
public enum LayoutVariantType
{
    Header = 1,
    Footer = 2,
    ProductCard = 3,
    ProductGrid = 4
}
