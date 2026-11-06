using System.Net;
using System.Net.Http.Json;
using System.Threading.RateLimiting;
using Cheslax.Application.Abstractions;
using Cheslax.Application.Play;
using Cheslax.Domain;
using Cheslax.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace Cheslax.IntegrationTests;

public class ConnectionHandlingTests : IClassFixture<ConnectionHandlingApiFactory>
{
    private readonly ConnectionHandlingApiFactory _factory;

    public ConnectionHandlingTests(ConnectionHandlingApiFactory factory) => _factory = factory;

    [Fact]
    public async Task Leave_while_playing_forfeits_immediately_and_locks_moves()
    {
        var (host, guest, code, started, hostId, _) = await StartCoGanhAsync();

        var leave = await host.PostAsJsonAsync($"/api/rooms/{code}/leave", new { });
        Assert.Equal(HttpStatusCode.NoContent, leave.StatusCode);

        var guestView = await guest.GetFromJsonAsync<RoomDto>($"/api/rooms/{code}");
        Assert.Equal("ended", guestView?.Status);
        Assert.Equal("Đối thủ đã rời phòng", guestView?.Result?.Reason);
        Assert.Equal("blue", guestView?.Result?.WinnerSide);
        Assert.Equal(2, guestView?.Seats.Count);

        var move = await guest.PostAsJsonAsync(
            $"/api/rooms/{code}/co-ganh/moves",
            new { from = 2, to = 7, version = guestView!.Version });
        Assert.Equal(HttpStatusCode.Conflict, move.StatusCode);

        var restored = await host.PostAsJsonAsync($"/api/rooms/{code}/join", new { });
        Assert.Equal(HttpStatusCode.OK, restored.StatusCode);
        var hostView = await restored.Content.ReadFromJsonAsync<RoomDto>();
        Assert.Equal("ended", hostView?.Status);
        Assert.Equal("Đối thủ đã rời phòng", hostView?.Result?.Reason);
        Assert.Equal(hostId, hostView?.You?.PlayerId);
        AssertSingleFinishedMatch(code, ResultReason.Resignation);
    }

    [Fact]
    public async Task Duplicate_leave_records_a_single_result()
    {
        var (host, guest, code, _, _, _) = await StartCoGanhAsync();

        var first = await host.PostAsJsonAsync($"/api/rooms/{code}/leave", new { });
        var second = await host.PostAsJsonAsync($"/api/rooms/{code}/leave", new { });
        var third = await host.PostAsJsonAsync($"/api/rooms/{code}/leave", new { });
        Assert.Equal(HttpStatusCode.NoContent, first.StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, second.StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, third.StatusCode);

        var guestView = await guest.GetFromJsonAsync<RoomDto>($"/api/rooms/{code}");
        Assert.Equal("ended", guestView?.Status);
        Assert.Equal("Đối thủ đã rời phòng", guestView?.Result?.Reason);
        AssertSingleFinishedMatch(code, ResultReason.Resignation);
    }

    [Fact]
    public async Task Reload_join_restores_the_same_playing_game()
    {
        var (host, guest, code, started, hostId, _) = await StartCoGanhAsync();
        await SetConnectedAsync(hostId, "conn-1", false);

        var dropped = await guest.GetFromJsonAsync<RoomDto>($"/api/rooms/{code}");
        Assert.Equal("playing", dropped?.Status);
        Assert.Contains(dropped!.Seats, seat => seat.PlayerId == hostId && !seat.Connected);
        Assert.NotNull(dropped.DisconnectDeadline);

        var restored = await host.PostAsJsonAsync($"/api/rooms/{code}/join", new { });
        Assert.Equal(HttpStatusCode.OK, restored.StatusCode);
        var hostView = await restored.Content.ReadFromJsonAsync<RoomDto>();
        Assert.Equal("playing", hostView?.Status);
        Assert.Null(hostView?.Result);
        Assert.Null(hostView?.DisconnectDeadline);
        Assert.Equal(started.CoGanh?.Cells, hostView?.CoGanh?.Cells);
        Assert.Equal(started.CoGanh?.Turn, hostView?.CoGanh?.Turn);
        Assert.Equal(started.Version, hostView?.Version);
        Assert.All(hostView!.Seats, seat => Assert.True(seat.Connected || seat.IsAi));
        Assert.DoesNotContain(Matches(code), match => match.Status == MatchStatus.Finished);
    }

    [Fact]
    public async Task Disconnect_reconnect_within_grace_continues_the_game()
    {
        var (host, guest, code, started, hostId, _) = await StartCoGanhAsync();
        await SetConnectedAsync(hostId, "conn-1", false);
        _factory.Clock.Advance(TimeSpan.FromMinutes(1));
        await TickAsync();

        var waiting = await guest.GetFromJsonAsync<RoomDto>($"/api/rooms/{code}");
        Assert.Equal("playing", waiting?.Status);
        Assert.NotNull(waiting?.DisconnectDeadline);

        await SetConnectedAsync(hostId, "conn-2", true);
        var restored = await host.GetFromJsonAsync<RoomDto>($"/api/rooms/{code}");
        Assert.Equal("playing", restored?.Status);
        Assert.Null(restored?.DisconnectDeadline);
        Assert.Contains(restored!.Seats, seat => seat.PlayerId == hostId && seat.Connected);

        _factory.Clock.Advance(TimeSpan.FromMinutes(3));
        await TickAsync();
        var stillPlaying = await guest.GetFromJsonAsync<RoomDto>($"/api/rooms/{code}");
        Assert.Equal("playing", stillPlaying?.Status);
        Assert.Null(stillPlaying?.Result);
    }

    [Fact]
    public async Task Disconnect_past_two_minutes_forfeits_on_server_tick()
    {
        var (host, guest, code, started, hostId, _) = await StartCoGanhAsync();
        await SetConnectedAsync(hostId, "conn-1", false);
        _factory.Clock.Advance(TimeSpan.FromMinutes(2));
        await TickAsync();

        var guestView = await guest.GetFromJsonAsync<RoomDto>($"/api/rooms/{code}");
        Assert.Equal("ended", guestView?.Status);
        Assert.Equal("Đối thủ mất kết nối quá lâu", guestView?.Result?.Reason);
        Assert.Equal("blue", guestView?.Result?.WinnerSide);

        var restored = await host.PostAsJsonAsync($"/api/rooms/{code}/join", new { });
        Assert.Equal(HttpStatusCode.OK, restored.StatusCode);
        var hostView = await restored.Content.ReadFromJsonAsync<RoomDto>();
        Assert.Equal("ended", hostView?.Status);
        Assert.Equal("Đối thủ mất kết nối quá lâu", hostView?.Result?.Reason);
        AssertSingleFinishedMatch(code, ResultReason.Abandonment);
    }

    [Fact]
    public async Task Duplicate_disconnect_does_not_reset_the_grace_timer()
    {
        var (host, _, code, started, hostId, _) = await StartCoGanhAsync();
        await SetConnectedAsync(hostId, "conn-1", false);
        _factory.Clock.Advance(TimeSpan.FromSeconds(90));
        await SetConnectedAsync(hostId, "conn-1", false);
        _factory.Clock.Advance(TimeSpan.FromSeconds(90));
        await TickAsync();

        var room = await host.GetFromJsonAsync<RoomDto>($"/api/rooms/{code}");
        Assert.Equal("ended", room?.Status);
        Assert.Equal("Đối thủ mất kết nối quá lâu", room?.Result?.Reason);
    }

    [Fact]
    public async Task Stale_signalr_disconnect_does_not_replace_the_new_connection()
    {
        var (host, _, code, started, hostId, _) = await StartCoGanhAsync();
        await SetConnectedAsync(hostId, "conn-old", true);
        await SetConnectedAsync(hostId, "conn-new", true);
        await SetConnectedAsync(hostId, "conn-old", false);

        var room = await host.GetFromJsonAsync<RoomDto>($"/api/rooms/{code}");
        Assert.Equal("playing", room?.Status);
        Assert.Null(room?.DisconnectDeadline);
        Assert.Contains(room!.Seats, seat => seat.PlayerId == hostId && seat.Connected);
    }

    [Fact]
    public async Task Reconnect_at_timeout_records_only_one_result()
    {
        var (host, guest, code, started, hostId, _) = await StartCoGanhAsync();
        await SetConnectedAsync(hostId, "conn-1", false);
        _factory.Clock.Advance(TimeSpan.FromMinutes(2));

        await using var tickScope = _factory.Services.CreateAsyncScope();
        await using var reconnectScope = _factory.Services.CreateAsyncScope();
        var tick = tickScope.ServiceProvider.GetRequiredService<IPlayService>();
        var reconnect = reconnectScope.ServiceProvider.GetRequiredService<IPlayService>();
        await Task.WhenAll(
            tick.TickAsync(CancellationToken.None),
            reconnect.SetConnectedAsync(hostId, "conn-2", true, CancellationToken.None));

        var room = await guest.GetFromJsonAsync<RoomDto>($"/api/rooms/{code}");
        Assert.True(room!.Status is "playing" or "ended");
        var matches = Matches(code);
        Assert.Single(matches);
        if (room.Status == "ended")
        {
            Assert.Equal(MatchStatus.Finished, matches[0].Status);
            Assert.NotNull(room.Result);
            await TickAsync();
            var again = await guest.GetFromJsonAsync<RoomDto>($"/api/rooms/{code}");
            Assert.Equal(room.Result?.Reason, again?.Result?.Reason);
            Assert.Single(Matches(code));
        }
        else
        {
            Assert.Equal(MatchStatus.Playing, matches[0].Status);
            Assert.All(room.Seats, seat => Assert.True(seat.Connected || seat.IsAi));
        }
    }

    [Fact]
    public async Task Both_players_disconnecting_are_tracked_independently()
    {
        var (host, guest, code, started, hostId, guestId) = await StartCoGanhAsync();

        await SetConnectedAsync(hostId, "h1", false);
        _factory.Clock.Advance(TimeSpan.FromSeconds(30));
        await SetConnectedAsync(guestId, "g1", false);
        _factory.Clock.Advance(TimeSpan.FromSeconds(30));
        await TickAsync();

        var stillPlaying = await host.GetFromJsonAsync<RoomDto>($"/api/rooms/{code}");
        Assert.Equal("playing", stillPlaying?.Status);
        Assert.Equal(2, stillPlaying?.Seats.Count(seat => !seat.Connected));

        _factory.Clock.Advance(TimeSpan.FromSeconds(90));
        await TickAsync();

        var ended = await host.GetFromJsonAsync<RoomDto>($"/api/rooms/{code}");
        Assert.Equal("ended", ended?.Status);
        Assert.Equal("Đối thủ mất kết nối quá lâu", ended?.Result?.Reason);
        Assert.Equal("blue", ended?.Result?.WinnerSide);
        AssertSingleFinishedMatch(code, ResultReason.Abandonment);
    }

    [Fact]
    public async Task Simultaneous_disconnect_timeout_is_a_draw()
    {
        var (host, guest, code, started, hostId, guestId) = await StartCoGanhAsync();

        await SetConnectedAsync(hostId, "h1", false);
        await SetConnectedAsync(guestId, "g1", false);
        _factory.Clock.Advance(TimeSpan.FromMinutes(2));
        await TickAsync();

        var ended = await host.GetFromJsonAsync<RoomDto>($"/api/rooms/{code}");
        Assert.Equal("ended", ended?.Status);
        Assert.Equal("Cả hai người đã mất kết nối", ended?.Result?.Reason);
        Assert.Equal("draw", ended?.Result?.WinnerSide);
        var match = Assert.Single(Matches(code));
        Assert.Equal(MatchOutcome.Draw, match.Outcome);
        Assert.Equal(ResultReason.Abandonment, match.ResultReason);
        Assert.False(match.Rated);
    }

    [Fact]
    public async Task Leave_while_waiting_does_not_create_a_loss()
    {
        var host = CreateClient();
        var guest = CreateClient();
        await Register(host, "wait_host");
        await guest.PostAsJsonAsync("/api/auth/guest", new { displayName = "Guest" });
        var created = await host.PostAsJsonAsync("/api/rooms", new { gameId = "co-ganh", timeControl = "off", colorPref = "red" });
        var room = await created.Content.ReadFromJsonAsync<RoomDto>();
        Assert.Equal(HttpStatusCode.OK, (await guest.PostAsJsonAsync($"/api/rooms/{room!.Code}/join", new { })).StatusCode);

        Assert.Equal(HttpStatusCode.NoContent, (await guest.PostAsJsonAsync($"/api/rooms/{room.Code}/leave", new { })).StatusCode);
        var waiting = await host.GetFromJsonAsync<RoomDto>($"/api/rooms/{room.Code}");
        Assert.Equal("waiting", waiting?.Status);
        Assert.Null(waiting?.Result);
        Assert.Single(waiting!.Seats);
        Assert.Empty(Matches(room.Code));
    }

    [Fact]
    public async Task Timeout_decision_survives_a_fresh_server_scope()
    {
        var (host, guest, code, started, hostId, _) = await StartCoGanhAsync();
        await SetConnectedAsync(hostId, "conn-1", false);
        _factory.Clock.Advance(TimeSpan.FromMinutes(2));

        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            await scope.ServiceProvider.GetRequiredService<IPlayService>().TickAsync(CancellationToken.None);
        }

        await using (var scope = _factory.Services.CreateAsyncScope())
        {
            await scope.ServiceProvider.GetRequiredService<IPlayService>().TickAsync(CancellationToken.None);
        }

        var room = await guest.GetFromJsonAsync<RoomDto>($"/api/rooms/{code}");
        Assert.Equal("ended", room?.Status);
        Assert.Equal("Đối thủ mất kết nối quá lâu", room?.Result?.Reason);
        AssertSingleFinishedMatch(code, ResultReason.Abandonment);
        _ = host;
    }

    private async Task<(HttpClient Host, HttpClient Guest, string Code, RoomDto Started, string HostId, string GuestId)> StartCoGanhAsync()
    {
        var host = CreateClient();
        var guest = CreateClient();
        await Register(host, "cg_conn");
        await guest.PostAsJsonAsync("/api/auth/guest", new { displayName = "Guest" });
        var created = await host.PostAsJsonAsync("/api/rooms", new { gameId = "co-ganh", timeControl = "off", colorPref = "red" });
        Assert.True(created.IsSuccessStatusCode, await created.Content.ReadAsStringAsync());
        var room = await created.Content.ReadFromJsonAsync<RoomDto>();
        Assert.NotNull(room);
        var joined = await guest.PostAsJsonAsync($"/api/rooms/{room.Code}/join", new { });
        Assert.Equal(HttpStatusCode.OK, joined.StatusCode);
        var first = await host.PostAsJsonAsync($"/api/rooms/{room.Code}/ready", new { ready = true });
        Assert.True(first.IsSuccessStatusCode, await first.Content.ReadAsStringAsync());
        var second = await guest.PostAsJsonAsync($"/api/rooms/{room.Code}/ready", new { ready = true });
        Assert.True(second.IsSuccessStatusCode, await second.Content.ReadAsStringAsync());
        var started = await second.Content.ReadFromJsonAsync<RoomDto>();
        Assert.Equal("playing", started?.Status);
        var hostView = await host.GetFromJsonAsync<RoomDto>($"/api/rooms/{room.Code}");
        Assert.False(string.IsNullOrEmpty(hostView?.You?.PlayerId));
        Assert.False(string.IsNullOrEmpty(started?.You?.PlayerId));
        Assert.NotEqual(hostView!.You!.PlayerId, started!.You!.PlayerId);
        return (host, guest, room.Code, started, hostView.You.PlayerId, started.You.PlayerId);
    }

    private HttpClient CreateClient() => _factory.CreateClient(new WebApplicationFactoryClientOptions
    {
        AllowAutoRedirect = false,
        HandleCookies = true,
    });

    private static async Task Register(HttpClient client, string prefix)
    {
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            username = $"{prefix}_{suffix}",
            displayName = prefix,
            email = $"{prefix}_{suffix}@example.com",
            password = "correct-horse",
        });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    private async Task SetConnectedAsync(string userId, string connectionId, bool connected)
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        var play = scope.ServiceProvider.GetRequiredService<IPlayService>();
        await play.SetConnectedAsync(userId, connectionId, connected, CancellationToken.None);
    }

    private async Task TickAsync()
    {
        await using var scope = _factory.Services.CreateAsyncScope();
        await scope.ServiceProvider.GetRequiredService<IPlayService>().TickAsync(CancellationToken.None);
    }

    private List<GameMatch> Matches(string code)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<CheslaxDbContext>();
        return db.GameMatches.Include(match => match.Room).Where(match => match.Room != null && match.Room.Code == code).ToList();
    }

    private void AssertSingleFinishedMatch(string code, ResultReason reason)
    {
        var match = Assert.Single(Matches(code));
        Assert.Equal(MatchStatus.Finished, match.Status);
        Assert.Equal(reason, match.ResultReason);
    }

    private sealed record RoomDto(
        string Code,
        string Status,
        int Version,
        YouDto? You,
        List<SeatDto> Seats,
        CoGanhDto? CoGanh,
        RoomResultDto? Result,
        DateTimeOffset? DisconnectDeadline);

    private sealed record YouDto(string PlayerId);

    private sealed record SeatDto(string PlayerId, bool Connected, bool IsAi);

    private sealed record CoGanhDto(int[] Cells, string Turn, string Status);

    private sealed record RoomResultDto(string Reason, string? WinnerSide);
}

public sealed class ConnectionHandlingApiFactory : CheslaxApiFactory
{
    public MutableClock Clock { get; } = new();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        base.ConfigureWebHost(builder);
        builder.ConfigureServices(services =>
        {
            foreach (var descriptor in services.Where(item => item.ServiceType == typeof(IClock)).ToList())
            {
                services.Remove(descriptor);
            }

            services.AddSingleton<IClock>(Clock);

            foreach (var descriptor in services.Where(item => item.ServiceType == typeof(IConfigureOptions<RateLimiterOptions>)).ToList())
            {
                services.Remove(descriptor);
            }

            services.AddRateLimiter(options =>
            {
                options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
                options.AddPolicy("login", _ => RateLimitPartition.GetNoLimiter("login"));
                options.AddPolicy("rooms", _ => RateLimitPartition.GetNoLimiter("rooms"));
            });
        });
    }
}

public sealed class MutableClock : IClock
{
    public DateTimeOffset UtcNow { get; set; } = new(2026, 10, 27, 12, 0, 0, TimeSpan.Zero);

    public void Advance(TimeSpan value) => UtcNow += value;
}
