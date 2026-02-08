namespace Qaflaty.Application.Ordering.DTOs;

public record CustomerDto(
    Guid Id,
    Guid StoreId,
    string FullName,
    string Phone,
    string? Email,
    string Street,
    string City,
    string? District,
    string? PostalCode,
    string Country,
    string? Notes,
    int OrderCount,
    DateTime CreatedAt
);

public record CustomerListDto(
    Guid Id,
    string FullName,
    string Phone,
    string? Email,
    string City,
    int OrderCount,
    DateTime CreatedAt
);
