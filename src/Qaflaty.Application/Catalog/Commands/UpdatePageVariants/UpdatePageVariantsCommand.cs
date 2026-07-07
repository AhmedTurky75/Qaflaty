using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Commands.UpdatePageVariants;

/// <summary>
/// Upserts the A/B variant set for a page. Variants are matched by Id: existing
/// ones are updated in place (preserving impression/conversion counters), new
/// ones (empty Id) are added, and any omitted are removed.
/// </summary>
public record UpdatePageVariantsCommand(
    Guid PageId,
    List<PageVariantDto> Variants
) : ICommand<List<PageVariantDto>>;
