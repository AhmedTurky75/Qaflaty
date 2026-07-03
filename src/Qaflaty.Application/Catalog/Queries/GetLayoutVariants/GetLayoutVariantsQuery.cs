using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Queries.GetLayoutVariants;

/// <summary>Returns the platform's active layout variant catalog (all slots).</summary>
public record GetLayoutVariantsQuery() : IQuery<List<LayoutVariantDto>>;
