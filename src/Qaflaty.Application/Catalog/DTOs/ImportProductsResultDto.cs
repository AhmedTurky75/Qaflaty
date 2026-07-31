namespace Qaflaty.Application.Catalog.DTOs;

/// <summary>Summary of a bulk product import.</summary>
public record ImportProductsResultDto(
    int TotalRows,
    int Created,
    int Failed,
    int CategoriesCreated,
    List<ImportRowErrorDto> Errors);

/// <summary>A single row that could not be imported, with the file line number and the reason.</summary>
public record ImportRowErrorDto(int Row, string Message);
