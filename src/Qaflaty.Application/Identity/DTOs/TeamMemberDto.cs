namespace Qaflaty.Application.Identity.DTOs;

public record TeamMemberDto(
    Guid MerchantId,
    string FullName,
    string Email,
    string? Phone,
    string Username,
    bool IsVerified,
    string Role,
    bool IsActive,
    Guid? InvitedBy,
    DateTime JoinedAt,
    DateTime CreatedAt);
