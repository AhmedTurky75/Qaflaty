namespace Qaflaty.Application.Catalog.Commands.ImportProducts;

/// <summary>
/// One raw row parsed from the uploaded CSV. All cells are kept as strings so the handler can
/// validate and report per-row errors (bad price, missing name, …) rather than failing the whole file.
/// <see cref="RowNumber"/> is the 1-based line number in the file (the header is line 1) so error
/// messages point the merchant at the exact spreadsheet row.
/// </summary>
public record ImportProductRow(
    int RowNumber,
    string? NameEn,
    string? NameAr,
    string? CategoryEn,
    string? CategoryAr,
    string? Price,
    string? CompareAt,
    string? Sku,
    string? Quantity,
    string? Status);
