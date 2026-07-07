namespace Qaflaty.Application.Catalog.DTOs;

public record PageVariantDto(
    Guid Id,
    string Name,
    int Weight,
    bool IsActive,
    string? SectionsJson,
    long Impressions,
    long Conversions
);

/// <summary>
/// Storefront experiment payload: the active variants for a page plus the
/// control's implied weight. The client resolves a sticky variant from the
/// weights and renders either the control (page sections) or a variant's
/// <see cref="PageVariantDto.SectionsJson"/>.
/// </summary>
public record PageExperimentDto(
    Guid PageId,
    int ControlWeight,
    List<PageVariantDto> Variants
);
