using System.Security.Claims;
using Cheslax.Application.Play;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Cheslax.Api.Hubs;

[Authorize]
public sealed class GameHub(IPlayService play, IMatchmakingService matchmaking) : Hub
{
    public async Task JoinRoom(string code)
    {
        var userId = UserId();
        var room = await play.JoinRoomAsync(userId, code, Context.ConnectionAborted);
        await play.SetConnectedAsync(userId, Context.ConnectionId, true, Context.ConnectionAborted);
        await Groups.AddToGroupAsync(Context.ConnectionId, GroupName(room.Code));
        await Clients.Caller.SendAsync("RoomState", await play.GetRoomAsync(userId, room.Code, Context.ConnectionAborted));
    }

    public async Task LeaveRoom(string code)
    {
        await play.LeaveRoomAsync(UserId(), code, Context.ConnectionAborted);
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, GroupName(code));
    }

    public Task<RoomPublicDto> ChessMove(string code, ChessMoveRequest request) =>
        play.ChessMoveAsync(UserId(), code, request, Context.ConnectionAborted);

    public Task<RoomPublicDto> OAnQuanMove(string code, OAnQuanMoveRequest request) =>
        play.OAnQuanMoveAsync(UserId(), code, request, Context.ConnectionAborted);

    public Task<RoomPublicDto> CaroMove(string code, CaroMoveRequest request) =>
        play.CaroMoveAsync(UserId(), code, request, Context.ConnectionAborted);

    public Task<RoomPublicDto> XiangqiMove(string code, XiangqiMoveRequest request) =>
        play.XiangqiMoveAsync(UserId(), code, request, Context.ConnectionAborted);

    public Task<RoomPublicDto> CoGanhMove(string code, CoGanhMoveRequest request) =>
        play.CoGanhMoveAsync(UserId(), code, request, Context.ConnectionAborted);

    public Task<RoomPublicDto> Resign(string code) =>
        play.ResignAsync(UserId(), code, Context.ConnectionAborted);

    public Task<RoomPublicDto> SetReady(string code, bool ready = true) =>
        play.SetReadyAsync(UserId(), code, ready, Context.ConnectionAborted);

    public Task<QueueStatusDto> EnqueueRanked(string gameId) =>
        matchmaking.EnqueueAsync(UserId(), gameId, Context.ConnectionId, Context.ConnectionAborted);

    public Task CancelQueue() => matchmaking.CancelAsync(UserId(), Context.ConnectionAborted);

    public override async Task OnConnectedAsync()
    {
        await play.SetConnectedAsync(UserId(), Context.ConnectionId, true, Context.ConnectionAborted);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await play.SetConnectedAsync(UserId(), Context.ConnectionId, false, CancellationToken.None);
        await base.OnDisconnectedAsync(exception);
    }

    private string UserId() =>
        Context.User?.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new HubException("Cần đăng nhập hoặc phiên khách.");

    private static string GroupName(string code) => $"room:{code.Trim().ToUpperInvariant()}";
}
