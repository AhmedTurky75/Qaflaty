namespace Qaflaty.Application.Ordering.DTOs;

public record BlockedPhoneDto(
    Guid Id,
    string Phone,
    string? CountryCode,
    string? Reason,
    string BlockedBy,
    Guid? SourceOrderId,
    string? SourceOrderNumber,
    DateTime BlockedAt);
