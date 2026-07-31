namespace Qaflaty.Application.Ordering.DTOs;

// Order-derived figures below follow one convention, applied identically in
// GetCustomerByIdQueryHandler and GetStoreCustomersQueryHandler:
//   - Blocked orders are excluded everywhere — the merchant has not accepted them yet.
//   - Cancelled orders still count toward OrderCount and the order dates (they happened),
//     but never toward TotalSpent (no money changed hands).
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
    decimal TotalSpent,
    DateTime? FirstOrderDate,
    DateTime? LastOrderDate,
    DateTime CreatedAt,
    // Phone-blocklist state. BlockedPhoneId is non-null exactly when this customer's number is
    // blocked, and is what the merchant UI passes back to unblock.
    Guid? BlockedPhoneId,
    string? BlockReason,
    DateTime? BlockedAt
);

public record CustomerListDto(
    Guid Id,
    string FullName,
    string Phone,
    string? Email,
    string City,
    int OrderCount,
    decimal TotalSpent,
    DateTime? LastOrderDate,
    DateTime CreatedAt,
    Guid? BlockedPhoneId
);
