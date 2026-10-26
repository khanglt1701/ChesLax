using System.Security.Claims;
using Cheslax.Application.Admin;
using Cheslax.Application.Common;
using Cheslax.Domain;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Cheslax.Api.Controllers;

[ApiController]
[Authorize(Roles = CheslaxRoles.SuperAdmin)]
[Route("api/admin")]
public sealed class AdminController(
    IAdminService admin,
    IValidator<UpdateAdminUserRequest> updateUserValidator) : ControllerBase
{
    [HttpGet("overview")]
    public async Task<ActionResult<AdminOverviewDto>> Overview(CancellationToken cancellationToken) =>
        Ok(await admin.GetOverviewAsync(cancellationToken));

    [HttpGet("users")]
    public async Task<ActionResult<PagedResult<AdminUserListItemDto>>> Users(
        [FromQuery] string? q,
        [FromQuery] string? kind,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default) =>
        Ok(await admin.ListUsersAsync(q, kind, page, pageSize, cancellationToken));

    [HttpGet("users/{userId}")]
    public async Task<ActionResult<AdminUserDetailDto>> UserDetail(string userId, CancellationToken cancellationToken) =>
        Ok(await admin.GetUserAsync(userId, cancellationToken));

    [HttpPut("users/{userId}")]
    public async Task<ActionResult<AdminUserDetailDto>> UpdateUser(
        string userId,
        [FromBody] UpdateAdminUserRequest request,
        CancellationToken cancellationToken)
    {
        await updateUserValidator.ValidateAndThrowAsync(request, cancellationToken);
        return Ok(await admin.UpdateUserAsync(userId, request, cancellationToken));
    }

    [HttpPost("users/{userId}/lock")]
    public async Task<ActionResult<AdminUserDetailDto>> Lock(string userId, CancellationToken cancellationToken) =>
        Ok(await admin.LockUserAsync(RequireUserId(), userId, cancellationToken));

    [HttpPost("users/{userId}/unlock")]
    public async Task<ActionResult<AdminUserDetailDto>> Unlock(string userId, CancellationToken cancellationToken) =>
        Ok(await admin.UnlockUserAsync(userId, cancellationToken));

    [HttpPost("users/{userId}/ratings/reset")]
    public async Task<ActionResult<AdminUserDetailDto>> ResetRatings(
        string userId,
        [FromBody] ResetAdminRatingsRequest? request,
        CancellationToken cancellationToken) =>
        Ok(await admin.ResetRatingsAsync(userId, request?.GameId, cancellationToken));

    [HttpGet("matches")]
    public async Task<ActionResult<PagedResult<AdminMatchListItemDto>>> Matches(
        [FromQuery] string? game,
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default) =>
        Ok(await admin.ListMatchesAsync(game, status, page, pageSize, cancellationToken));

    [HttpGet("rooms")]
    public async Task<ActionResult<PagedResult<AdminRoomListItemDto>>> Rooms(
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default) =>
        Ok(await admin.ListRoomsAsync(status, page, pageSize, cancellationToken));

    [HttpPost("rooms/{roomId:guid}/close")]
    public async Task<IActionResult> CloseRoom(Guid roomId, CancellationToken cancellationToken)
    {
        await admin.CloseRoomAsync(roomId, cancellationToken);
        return NoContent();
    }

    private string RequireUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new CheslaxException("UNAUTHORIZED", "Cần đăng nhập.", 401);
}
