using Cheslax.Application.Common;
using FluentValidation;

namespace Cheslax.Application.Admin;

public sealed record AdminOverviewDto(
    int RegisteredUsers,
    int GuestUsers,
    int BotUsers,
    int LockedUsers,
    int TotalMatches,
    int FinishedMatches,
    int MatchesToday,
    int WaitingRooms,
    int PlayingRooms,
    int QueuedTickets,
    DateTimeOffset GeneratedAt,
    IReadOnlyList<AdminMatchListItemDto> RecentMatches);

public sealed record AdminUserListItemDto(
    string Id,
    string Username,
    string DisplayName,
    string Email,
    string AvatarId,
    DateTimeOffset CreatedAt,
    DateTimeOffset? LastSeenAt,
    bool IsGuest,
    bool IsBot,
    bool IsLocked,
    IReadOnlyList<string> Roles,
    int ChessRating,
    int OAnQuanRating,
    int CaroRating);

public sealed record AdminUserDetailDto(
    string Id,
    string Username,
    string DisplayName,
    string Email,
    string AvatarId,
    DateTimeOffset CreatedAt,
    DateTimeOffset? LastSeenAt,
    bool IsGuest,
    bool IsBot,
    bool IsLocked,
    DateTimeOffset? LockoutEnd,
    IReadOnlyList<string> Roles,
    IReadOnlyList<AdminUserRatingDto> Ratings);

public sealed record AdminUserRatingDto(
    string GameId,
    int Rating,
    int Wins,
    int Losses,
    int Draws,
    int GamesPlayed,
    int HighestRating,
    DateTimeOffset? UpdatedAt);

public sealed record UpdateAdminUserRequest(string DisplayName);

public sealed record ResetAdminRatingsRequest(string? GameId);

public sealed record AdminMatchListItemDto(
    Guid Id,
    Guid RoomId,
    string RoomCode,
    string GameId,
    string Mode,
    string Status,
    bool Rated,
    string Player1Username,
    string Player2Username,
    string OpponentType,
    string? Outcome,
    DateTimeOffset CreatedAt,
    DateTimeOffset? FinishedAt);

public sealed record AdminRoomListItemDto(
    Guid Id,
    string Code,
    string GameId,
    string Mode,
    string Status,
    bool Rated,
    int SeatCount,
    string HostUsername,
    DateTimeOffset CreatedAt,
    DateTimeOffset LastActivityAt);

public interface IAdminService
{
    Task<AdminOverviewDto> GetOverviewAsync(CancellationToken cancellationToken);
    Task<PagedResult<AdminUserListItemDto>> ListUsersAsync(
        string? query,
        string? kind,
        int page,
        int pageSize,
        CancellationToken cancellationToken);
    Task<AdminUserDetailDto> GetUserAsync(string userId, CancellationToken cancellationToken);
    Task<AdminUserDetailDto> UpdateUserAsync(string userId, UpdateAdminUserRequest request, CancellationToken cancellationToken);
    Task<AdminUserDetailDto> LockUserAsync(string actorUserId, string userId, CancellationToken cancellationToken);
    Task<AdminUserDetailDto> UnlockUserAsync(string userId, CancellationToken cancellationToken);
    Task<AdminUserDetailDto> ResetRatingsAsync(string userId, string? gameId, CancellationToken cancellationToken);
    Task<PagedResult<AdminMatchListItemDto>> ListMatchesAsync(
        string? gameId,
        string? status,
        int page,
        int pageSize,
        CancellationToken cancellationToken);
    Task<PagedResult<AdminRoomListItemDto>> ListRoomsAsync(
        string? status,
        int page,
        int pageSize,
        CancellationToken cancellationToken);
    Task CloseRoomAsync(Guid roomId, CancellationToken cancellationToken);
}

public sealed class UpdateAdminUserRequestValidator : AbstractValidator<UpdateAdminUserRequest>
{
    public UpdateAdminUserRequestValidator()
    {
        RuleFor(x => x.DisplayName).NotEmpty().Length(1, 40);
    }
}
