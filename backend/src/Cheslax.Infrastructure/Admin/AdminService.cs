using Cheslax.Application.Admin;
using Cheslax.Application.Abstractions;
using Cheslax.Application.Common;
using Cheslax.Application.Play;
using Cheslax.Domain;
using Cheslax.Infrastructure.Identity;
using Cheslax.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Cheslax.Infrastructure.Admin;

public sealed class AdminService(
    CheslaxDbContext db,
    UserManager<User> users,
    IClock clock,
    IPlayNotifier notifier) : IAdminService
{
    public async Task<AdminOverviewDto> GetOverviewAsync(CancellationToken cancellationToken)
    {
        var now = clock.UtcNow;
        var today = now.UtcDateTime.Date;
        var todayStart = new DateTimeOffset(today, TimeSpan.Zero);

        var registeredUsers = await db.Users.CountAsync(user => !user.IsGuest && !user.IsBot, cancellationToken);
        var guestUsers = await db.Users.CountAsync(user => user.IsGuest && !user.IsBot, cancellationToken);
        var botUsers = await db.Users.CountAsync(user => user.IsBot, cancellationToken);
        var lockedUsers = (await db.Users.AsNoTracking()
                .Where(user => user.LockoutEnd != null)
                .Select(user => user.LockoutEnd)
                .ToListAsync(cancellationToken))
            .Count(end => end > now);
        var totalMatches = await db.GameMatches.CountAsync(cancellationToken);
        var finishedMatches = await db.GameMatches.CountAsync(match => match.Status == MatchStatus.Finished, cancellationToken);
        var createdAtValues = await db.GameMatches.AsNoTracking()
            .Select(match => match.CreatedAt)
            .ToListAsync(cancellationToken);
        var matchesToday = createdAtValues.Count(at => at >= todayStart);
        var waitingRooms = await db.GameRooms.CountAsync(room => room.Status == MatchStatus.Waiting, cancellationToken);
        var playingRooms = await db.GameRooms.CountAsync(room => room.Status == MatchStatus.Playing, cancellationToken);
        var queuedTickets = await db.MatchmakingTickets.CountAsync(
            ticket => ticket.Status == MatchmakingTicketStatus.Queued,
            cancellationToken);

        var recent = await ListMatchesAsync(null, null, 1, 8, cancellationToken);
        return new AdminOverviewDto(
            registeredUsers,
            guestUsers,
            botUsers,
            lockedUsers,
            totalMatches,
            finishedMatches,
            matchesToday,
            waitingRooms,
            playingRooms,
            queuedTickets,
            now,
            recent.Items);
    }

    public async Task<PagedResult<AdminUserListItemDto>> ListUsersAsync(
        string? query,
        string? kind,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);
        var now = clock.UtcNow;
        var usersQuery = db.Users.AsNoTracking();

        switch (kind?.Trim().ToLowerInvariant())
        {
            case "guest":
                usersQuery = usersQuery.Where(user => user.IsGuest && !user.IsBot);
                break;
            case "bot":
                usersQuery = usersQuery.Where(user => user.IsBot);
                break;
            case "locked":
                usersQuery = usersQuery.Where(user => user.LockoutEnd != null);
                break;
            case "all":
                break;
            default:
                usersQuery = usersQuery.Where(user => !user.IsGuest && !user.IsBot);
                break;
        }

        if (!string.IsNullOrWhiteSpace(query))
        {
            var term = query.Trim().ToLower();
            usersQuery = usersQuery.Where(user =>
                (user.UserName != null && user.UserName.ToLower().Contains(term)) ||
                user.DisplayName.ToLower().Contains(term) ||
                (user.Email != null && user.Email.ToLower().Contains(term)));
        }

        var projected = await usersQuery
            .Select(user => new
            {
                user.Id,
                user.UserName,
                user.DisplayName,
                user.Email,
                user.AvatarId,
                user.CreatedAt,
                user.LastSeenAt,
                user.IsGuest,
                user.IsBot,
                user.LockoutEnd,
            })
            .ToListAsync(cancellationToken);
        if (string.Equals(kind?.Trim(), "locked", StringComparison.OrdinalIgnoreCase))
        {
            projected = projected.Where(user => user.LockoutEnd is { } lockout && lockout > now).ToList();
        }

        var total = projected.Count;
        var rows = projected
            .OrderByDescending(user => user.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        var ids = rows.Select(row => row.Id).ToList();
        var roleRows = ids.Count == 0
            ? []
            : await (
                from userRole in db.UserRoles.AsNoTracking()
                join role in db.Roles.AsNoTracking() on userRole.RoleId equals role.Id
                where ids.Contains(userRole.UserId)
                select new { userRole.UserId, role.Name }
            ).ToListAsync(cancellationToken);
        var rolesByUser = roleRows
            .GroupBy(row => row.UserId)
            .ToDictionary(group => group.Key, group => group.Select(row => row.Name ?? string.Empty).Where(name => name.Length > 0).ToList());

        var ratingRows = ids.Count == 0
            ? []
            : await db.PlayerRatings.AsNoTracking()
                .Where(rating => ids.Contains(rating.UserId))
                .Select(rating => new { rating.UserId, rating.GameType, rating.Rating })
                .ToListAsync(cancellationToken);
        var ratingsByUser = ratingRows
            .GroupBy(row => row.UserId)
            .ToDictionary(group => group.Key, group => group.ToList());

        var items = rows.Select(row =>
        {
            ratingsByUser.TryGetValue(row.Id, out var ratings);
            rolesByUser.TryGetValue(row.Id, out var roles);
            return new AdminUserListItemDto(
                row.Id,
                row.UserName ?? string.Empty,
                row.DisplayName,
                row.Email ?? string.Empty,
                row.AvatarId,
                row.CreatedAt,
                row.LastSeenAt,
                row.IsGuest,
                row.IsBot,
                row.LockoutEnd is { } lockout && lockout > now,
                roles ?? [],
                ratings?.FirstOrDefault(item => item.GameType == GameType.Chess)?.Rating ?? RankCatalog.StartingRating,
                ratings?.FirstOrDefault(item => item.GameType == GameType.OAnQuan)?.Rating ?? RankCatalog.StartingRating);
        }).ToList();

        return new PagedResult<AdminUserListItemDto>(items, page, pageSize, total);
    }

    public async Task<AdminUserDetailDto> GetUserAsync(string userId, CancellationToken cancellationToken)
    {
        var user = await users.FindByIdAsync(userId)
            ?? throw new CheslaxException("NOT_FOUND", "Không tìm thấy tài khoản.", 404);
        return await ToDetailAsync(user, cancellationToken);
    }

    public async Task<AdminUserDetailDto> UpdateUserAsync(string userId, UpdateAdminUserRequest request, CancellationToken cancellationToken)
    {
        var user = await RequireUser(userId);
        if (user.IsBot || SystemBotUser.IsBotId(user.Id))
        {
            throw new CheslaxException("FORBIDDEN", "Không chỉnh tài khoản hệ thống.", 400);
        }

        user.DisplayName = request.DisplayName.Trim();
        var updated = await users.UpdateAsync(user);
        if (!updated.Succeeded)
        {
            throw new CheslaxException("UPDATE_FAILED", "Không lưu được tài khoản.", 400);
        }

        return await ToDetailAsync(user, cancellationToken);
    }

    public async Task<AdminUserDetailDto> LockUserAsync(string actorUserId, string userId, CancellationToken cancellationToken)
    {
        if (string.Equals(actorUserId, userId, StringComparison.Ordinal))
        {
            throw new CheslaxException("FORBIDDEN", "Không khóa tài khoản đang đăng nhập.", 400);
        }

        var user = await RequireUser(userId);
        if (user.IsBot || SystemBotUser.IsBotId(user.Id) || user.Id == SuperAdminUser.UserId)
        {
            throw new CheslaxException("FORBIDDEN", "Không khóa tài khoản hệ thống.", 400);
        }

        if (await users.IsInRoleAsync(user, CheslaxRoles.SuperAdmin))
        {
            throw new CheslaxException("FORBIDDEN", "Không khóa tài khoản super admin.", 400);
        }

        user.LockoutEnabled = true;
        user.LockoutEnd = clock.UtcNow.AddYears(100);
        var updated = await users.UpdateAsync(user);
        if (!updated.Succeeded)
        {
            throw new CheslaxException("UPDATE_FAILED", "Không khóa được tài khoản.", 400);
        }

        return await ToDetailAsync(user, cancellationToken);
    }

    public async Task<AdminUserDetailDto> UnlockUserAsync(string userId, CancellationToken cancellationToken)
    {
        var user = await users.FindByIdAsync(userId)
            ?? throw new CheslaxException("NOT_FOUND", "Không tìm thấy tài khoản.", 404);
        user.LockoutEnd = null;
        var updated = await users.UpdateAsync(user);
        if (!updated.Succeeded)
        {
            throw new CheslaxException("UPDATE_FAILED", "Không mở khóa được tài khoản.", 400);
        }

        return await ToDetailAsync(user, cancellationToken);
    }

    public async Task<AdminUserDetailDto> ResetRatingsAsync(string userId, string? gameId, CancellationToken cancellationToken)
    {
        var user = await RequireUser(userId);
        if (user.IsBot || SystemBotUser.IsBotId(user.Id))
        {
            throw new CheslaxException("FORBIDDEN", "Không chỉnh tài khoản hệ thống.", 400);
        }

        GameType? only = null;
        if (!string.IsNullOrWhiteSpace(gameId))
        {
            if (!GameTypeIds.TryParse(gameId, out var parsed))
            {
                throw new CheslaxException("INVALID", "Trò chơi không hợp lệ.", 400);
            }

            only = parsed;
        }

        var now = clock.UtcNow;
        var ratings = await db.PlayerRatings.Where(rating => rating.UserId == user.Id).ToListAsync(cancellationToken);
        foreach (var rating in ratings)
        {
            if (only is not null && rating.GameType != only)
            {
                continue;
            }

            rating.Rating = RankCatalog.StartingRating;
            rating.PeakRating = RankCatalog.StartingRating;
            rating.Wins = 0;
            rating.Losses = 0;
            rating.Draws = 0;
            rating.GamesPlayed = 0;
            rating.UpdatedAt = now;
        }

        await db.SaveChangesAsync(cancellationToken);
        return await ToDetailAsync(user, cancellationToken);
    }

    public async Task<PagedResult<AdminMatchListItemDto>> ListMatchesAsync(
        string? gameId,
        string? status,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);
        var query = db.GameMatches.AsNoTracking().Join(
            db.GameRooms.AsNoTracking(),
            match => match.RoomId,
            room => room.Id,
            (match, room) => new { match, room });

        if (!string.IsNullOrWhiteSpace(gameId))
        {
            if (!GameTypeIds.TryParse(gameId, out var game))
            {
                throw new CheslaxException("INVALID", "Trò chơi không hợp lệ.", 400);
            }

            query = query.Where(row => row.match.GameType == game);
        }

        if (TryParseMatchStatus(status, out var matchStatus))
        {
            query = query.Where(row => row.match.Status == matchStatus);
        }

        var projected = await query
            .Select(row => new
            {
                row.match.Id,
                row.match.RoomId,
                row.room.Code,
                row.match.GameType,
                row.match.Mode,
                row.match.Status,
                row.match.Rated,
                row.match.Player1UserId,
                row.match.Player2UserId,
                row.match.OpponentType,
                row.match.Outcome,
                row.match.CreatedAt,
                row.match.FinishedAt,
            })
            .ToListAsync(cancellationToken);
        var total = projected.Count;
        var rows = projected
            .OrderByDescending(row => row.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        var userIds = rows.Select(row => row.Player1UserId).Concat(rows.Select(row => row.Player2UserId)).Distinct().ToList();
        var names = userIds.Count == 0
            ? new Dictionary<string, string>()
            : await db.Users.AsNoTracking()
                .Where(user => userIds.Contains(user.Id))
                .Select(user => new { user.Id, user.UserName })
                .ToDictionaryAsync(user => user.Id, user => user.UserName ?? user.Id, cancellationToken);

        var items = rows.Select(row => new AdminMatchListItemDto(
            row.Id,
            row.RoomId,
            row.Code,
            row.GameType.ToId(),
            ModeId(row.Mode),
            StatusId(row.Status),
            row.Rated,
            names.GetValueOrDefault(row.Player1UserId, row.Player1UserId),
            names.GetValueOrDefault(row.Player2UserId, row.Player2UserId),
            row.OpponentType == OpponentType.Ai ? "ai" : "human",
            OutcomeId(row.Outcome),
            row.CreatedAt,
            row.FinishedAt)).ToList();

        return new PagedResult<AdminMatchListItemDto>(items, page, pageSize, total);
    }

    public async Task<PagedResult<AdminRoomListItemDto>> ListRoomsAsync(
        string? status,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);
        var query = db.GameRooms.AsNoTracking();
        if (TryParseMatchStatus(status, out var matchStatus))
        {
            query = query.Where(room => room.Status == matchStatus);
        }

        var projected = await query
            .Select(room => new
            {
                room.Id,
                room.Code,
                room.GameType,
                room.Mode,
                room.Status,
                room.Rated,
                SeatCount = room.Seats.Count,
                room.HostUserId,
                room.CreatedAt,
                room.LastActivityAt,
            })
            .ToListAsync(cancellationToken);
        var total = projected.Count;
        var rows = projected
            .OrderByDescending(room => room.LastActivityAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        var hostIds = rows.Select(row => row.HostUserId).Distinct().ToList();
        var names = hostIds.Count == 0
            ? new Dictionary<string, string>()
            : await db.Users.AsNoTracking()
                .Where(user => hostIds.Contains(user.Id))
                .Select(user => new { user.Id, user.UserName })
                .ToDictionaryAsync(user => user.Id, user => user.UserName ?? user.Id, cancellationToken);

        var items = rows.Select(row => new AdminRoomListItemDto(
            row.Id,
            row.Code,
            row.GameType.ToId(),
            ModeId(row.Mode),
            StatusId(row.Status),
            row.Rated,
            row.SeatCount,
            names.GetValueOrDefault(row.HostUserId, row.HostUserId),
            row.CreatedAt,
            row.LastActivityAt)).ToList();

        return new PagedResult<AdminRoomListItemDto>(items, page, pageSize, total);
    }

    public async Task CloseRoomAsync(Guid roomId, CancellationToken cancellationToken)
    {
        var room = await db.GameRooms
            .Include(item => item.Seats)
            .FirstOrDefaultAsync(item => item.Id == roomId, cancellationToken)
            ?? throw new CheslaxException("NOT_FOUND", "Không tìm thấy phòng.", 404);

        if (room.Status is MatchStatus.Finished or MatchStatus.Abandoned)
        {
            throw new CheslaxException("ROOM_ENDED", "Phòng đã kết thúc.", 409);
        }

        var now = clock.UtcNow;
        if (room.CurrentMatchId is Guid matchId)
        {
            var match = await db.GameMatches.FirstOrDefaultAsync(item => item.Id == matchId, cancellationToken);
            if (match is not null && match.Status is MatchStatus.Waiting or MatchStatus.Playing)
            {
                match.Status = MatchStatus.Finished;
                match.Outcome = MatchOutcome.Draw;
                match.ResultReason = ResultReason.Abandonment;
                match.Rated = false;
                match.FinishedAt = now;
                match.StateSnapshot = "Admin đóng phòng";
            }
        }

        room.Status = MatchStatus.Abandoned;
        room.DisconnectDeadline = null;
        room.LastActivityAt = now;

        var locks = await db.ActiveMatchLocks.Where(item => item.RoomId == room.Id).ToListAsync(cancellationToken);
        db.ActiveMatchLocks.RemoveRange(locks);
        await db.SaveChangesAsync(cancellationToken);
        await notifier.RoomUpdatedAsync(room.Code, room.Seats.Select(seat => seat.UserId).ToList(), cancellationToken);
    }

    private async Task<AdminUserDetailDto> ToDetailAsync(User user, CancellationToken cancellationToken)
    {
        var now = clock.UtcNow;
        var roles = (await users.GetRolesAsync(user)).ToList();
        var ratings = await db.PlayerRatings.AsNoTracking()
            .Where(rating => rating.UserId == user.Id)
            .OrderBy(rating => rating.GameType)
            .ToListAsync(cancellationToken);

        return new AdminUserDetailDto(
            user.Id,
            user.UserName ?? string.Empty,
            user.DisplayName,
            user.Email ?? string.Empty,
            user.AvatarId,
            user.CreatedAt,
            user.LastSeenAt,
            user.IsGuest,
            user.IsBot,
            user.LockoutEnd is { } lockout && lockout > now,
            user.LockoutEnd,
            roles,
            ratings.Select(rating => new AdminUserRatingDto(
                rating.GameType.ToId(),
                rating.Rating,
                rating.Wins,
                rating.Losses,
                rating.Draws,
                rating.GamesPlayed,
                rating.PeakRating,
                rating.UpdatedAt)).ToList());
    }

    private async Task<User> RequireUser(string userId) =>
        await users.FindByIdAsync(userId)
        ?? throw new CheslaxException("NOT_FOUND", "Không tìm thấy tài khoản.", 404);

    private static bool TryParseMatchStatus(string? value, out MatchStatus status)
    {
        switch (value?.Trim().ToLowerInvariant())
        {
            case "waiting":
                status = MatchStatus.Waiting;
                return true;
            case "playing":
                status = MatchStatus.Playing;
                return true;
            case "finished":
                status = MatchStatus.Finished;
                return true;
            case "abandoned":
                status = MatchStatus.Abandoned;
                return true;
            default:
                status = default;
                return false;
        }
    }

    private static string ModeId(MatchMode mode) => mode == MatchMode.Ranked ? "ranked" : "casual";

    private static string StatusId(MatchStatus status) => status switch
    {
        MatchStatus.Waiting => "waiting",
        MatchStatus.Playing => "playing",
        MatchStatus.Finished => "finished",
        MatchStatus.Abandoned => "abandoned",
        _ => "waiting",
    };

    private static string? OutcomeId(MatchOutcome? outcome) => outcome switch
    {
        MatchOutcome.Player1Win => "player1",
        MatchOutcome.Player2Win => "player2",
        MatchOutcome.Draw => "draw",
        _ => null,
    };
}
