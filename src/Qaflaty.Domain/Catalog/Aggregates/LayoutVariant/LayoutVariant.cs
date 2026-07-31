using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.Aggregates.LayoutVariant;

/// <summary>
/// A platform-provided storefront layout option (a header / footer / product-card / product-grid
/// style) that merchants choose from in the store builder. <see cref="Code"/> is the opaque
/// identifier the storefront renderer resolves to a component (e.g. "header-minimal") and is the
/// value persisted on <c>StoreConfiguration</c>. This catalog is the single source of truth for the
/// selectable variants, so the merchant picker can no longer drift from what the storefront renders.
/// </summary>
public sealed class LayoutVariant : AggregateRoot<LayoutVariantId>
{
    public const int MaxCodeLength = 60;
    public const int MaxNameLength = 100;

    public LayoutVariantType Type { get; private set; } // Which slot this variant applies to: Header / Footer / ProductCard / ProductGrid
    public string Code { get; private set; } = null!; // Renderer id persisted on StoreConfiguration, e.g. "header-minimal"
    public string NameEn { get; private set; } = null!; // English label shown in the builder dropdown
    public string NameAr { get; private set; } = null!; // Arabic label shown in the builder dropdown
    public int SortOrder { get; private set; } // Display order within its type group
    public bool IsActive { get; private set; } // Whether the variant is currently offered to merchants

    private LayoutVariant() : base(LayoutVariantId.Empty) { }

    public static LayoutVariant Create(
        LayoutVariantType type,
        string code,
        string nameEn,
        string nameAr,
        int sortOrder,
        bool isActive = true)
    {
        return new LayoutVariant
        {
            Id = LayoutVariantId.New(),
            Type = type,
            Code = code,
            NameEn = nameEn,
            NameAr = nameAr,
            SortOrder = sortOrder,
            IsActive = isActive
        };
    }
}
