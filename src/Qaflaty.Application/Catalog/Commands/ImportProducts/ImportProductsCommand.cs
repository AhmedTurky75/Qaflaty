using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Commands.ImportProducts;

/// <summary>
/// Bulk-creates products (without images) from parsed CSV rows, auto-creating any referenced
/// categories that don't already exist in the store. Rows that fail validation are skipped and
/// reported; valid rows are still imported (partial success).
/// </summary>
public record ImportProductsCommand(
    Guid StoreId,
    List<ImportProductRow> Rows
) : ICommand<ImportProductsResultDto>;
