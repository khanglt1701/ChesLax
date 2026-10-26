using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Cheslax.IntegrationTests;

public class AdminEndpointTests : IClassFixture<AdminApiFactory>
{
    private readonly AdminApiFactory _factory;

    public AdminEndpointTests(AdminApiFactory factory) => _factory = factory;

    [Fact]
    public async Task Overview_requires_authentication()
    {
        var client = CreateClient();
        var response = await client.GetAsync("/api/admin/overview");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Overview_rejects_regular_user()
    {
        var client = CreateClient();
        await RegisterAsync(client, "player");
        var response = await client.GetAsync("/api/admin/overview");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Super_admin_can_manage_users_and_see_overview()
    {
        var admin = CreateClient();
        var login = await admin.PostAsJsonAsync("/api/auth/login", new
        {
            username = "super_admin",
            password = "SuperAdmin@123",
        });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        var session = await login.Content.ReadFromJsonAsync<AuthSessionDto>();
        Assert.NotNull(session);
        Assert.Contains("super_admin", session.Roles ?? []);

        var playerClient = CreateClient();
        var registered = await RegisterAsync(playerClient, "managed");
        Assert.Equal(HttpStatusCode.Created, registered.StatusCode);

        var overviewResponse = await admin.GetAsync("/api/admin/overview");
        var overviewBody = await overviewResponse.Content.ReadAsStringAsync();
        Assert.True(overviewResponse.IsSuccessStatusCode, overviewBody);
        var overview = await overviewResponse.Content.ReadFromJsonAsync<OverviewDto>();
        Assert.NotNull(overview);
        Assert.True(overview.RegisteredUsers >= 2);

        var users = await admin.GetFromJsonAsync<PagedDto<UserRowDto>>("/api/admin/users?kind=registered&pageSize=50");
        Assert.NotNull(users);
        var managed = Assert.Single(users.Items, row => row.Username.StartsWith("managed_", StringComparison.Ordinal));
        Assert.False(managed.IsLocked);
        Assert.Equal(1000, managed.ChessRating);

        var locked = await admin.PostAsync($"/api/admin/users/{managed.Id}/lock", null);
        Assert.Equal(HttpStatusCode.OK, locked.StatusCode);
        var lockedBody = await locked.Content.ReadFromJsonAsync<UserDetailDto>();
        Assert.NotNull(lockedBody);
        Assert.True(lockedBody.IsLocked);

        await playerClient.PostAsync("/api/auth/logout", null);
        var blocked = await playerClient.PostAsJsonAsync("/api/auth/login", new
        {
            username = managed.Username,
            password = "correct-horse",
        });
        Assert.Equal(HttpStatusCode.Unauthorized, blocked.StatusCode);

        var unlocked = await admin.PostAsync($"/api/admin/users/{managed.Id}/unlock", null);
        Assert.Equal(HttpStatusCode.OK, unlocked.StatusCode);

        var relogin = await playerClient.PostAsJsonAsync("/api/auth/login", new
        {
            username = managed.Username,
            password = "correct-horse",
        });
        Assert.Equal(HttpStatusCode.OK, relogin.StatusCode);

        var rooms = await admin.GetAsync("/api/admin/rooms");
        Assert.Equal(HttpStatusCode.OK, rooms.StatusCode);
        var matches = await admin.GetAsync("/api/admin/matches");
        Assert.Equal(HttpStatusCode.OK, matches.StatusCode);
    }

    private HttpClient CreateClient() => _factory.CreateClient(new WebApplicationFactoryClientOptions
    {
        AllowAutoRedirect = false,
        HandleCookies = true,
    });

    private static async Task<HttpResponseMessage> RegisterAsync(HttpClient client, string prefix)
    {
        var suffix = Guid.NewGuid().ToString("N")[..8];
        return await client.PostAsJsonAsync("/api/auth/register", new
        {
            username = $"{prefix}_{suffix}",
            displayName = "Kỳ thủ Test",
            email = $"{prefix}_{suffix}@example.com",
            password = "correct-horse",
        });
    }

    private sealed record AuthSessionDto(string Username, List<string>? Roles);
    private sealed record OverviewDto(int RegisteredUsers);
    private sealed record PagedDto<T>(List<T> Items, int Page, int PageSize, int TotalCount);
    private sealed record UserRowDto(string Id, string Username, bool IsLocked, int ChessRating);
    private sealed record UserDetailDto(string Id, bool IsLocked);
}

public sealed class AdminApiFactory : CheslaxApiFactory
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        base.ConfigureWebHost(builder);
        builder.UseSetting("SuperAdmin:UserName", "super_admin");
        builder.UseSetting("SuperAdmin:Email", "super_admin@cheslax.local");
        builder.UseSetting("SuperAdmin:DisplayName", "Super Admin");
        builder.UseSetting("SuperAdmin:Password", "SuperAdmin@123");
    }
}
