using Cheslax.Application.Abstractions;
using Cheslax.Application.Admin;
using Cheslax.Application.Auth;
using Cheslax.Application.Catalog;
using Cheslax.Application.Play;
using Cheslax.Domain;
using Cheslax.Infrastructure.Admin;
using Cheslax.Infrastructure.Catalog;
using Cheslax.Infrastructure.Identity;
using Cheslax.Infrastructure.Play;
using Cheslax.Infrastructure.Options;
using Cheslax.Infrastructure.Persistence;
using Cheslax.Infrastructure.Time;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace Cheslax.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var database = BindDatabaseOptions(configuration);
        var connectionString = configuration.GetConnectionString("Default")
            ?? throw new InvalidOperationException("ConnectionStrings:Default is not configured.");

        services.AddSingleton<IClock, SystemClock>();
        services.AddSingleton(database);
        services.Configure<MatchmakingOptions>(configuration.GetSection(MatchmakingOptions.SectionName));
        services.Configure<SuperAdminOptions>(configuration.GetSection(SuperAdminOptions.SectionName));
        services.AddScoped<IAuthService, IdentityAuthService>();
        services.AddScoped<IAdminService, AdminService>();
        services.AddScoped<ILeaderboardService, LeaderboardService>();
        services.AddScoped<IPreferenceService, PreferenceService>();
        services.AddScoped<IPlayNotifier, NullPlayNotifier>();
        services.AddScoped<IAIOpponentService, AiOpponentService>();
        services.AddScoped<IHumanMatchmakingService, HumanMatchmakingService>();
        services.AddScoped<IRatingService, RatingService>();
        services.AddScoped<IPlayService, PlayService>();
        services.AddScoped<IMatchmakingService, MatchmakingService>();

        services.AddDbContext<CheslaxDbContext>(options =>
        {
            if (database.IsSqlite)
            {
                options.UseSqlite(connectionString, sqlite =>
                {
                    sqlite.MigrationsAssembly(typeof(CheslaxDbContext).Assembly.FullName);
                    sqlite.CommandTimeout(30);
                });
                return;
            }

            if (database.IsSqlServer)
            {
                throw new InvalidOperationException(
                    "SQL Server is no longer supported. Set Database:Provider to Npgsql (PostgreSQL) or Sqlite (tests).");
            }

            options.UseNpgsql(connectionString, npgsql =>
            {
                npgsql.MigrationsAssembly(typeof(CheslaxDbContext).Assembly.FullName);
                npgsql.CommandTimeout(30);
            });
        });

        services
            .AddIdentity<User, Role>(options =>
            {
                options.User.RequireUniqueEmail = true;
                options.Password.RequiredLength = 8;
                options.Password.RequireDigit = false;
                options.Password.RequireNonAlphanumeric = false;
                options.Password.RequireUppercase = false;
                options.Password.RequireLowercase = false;
                options.Lockout.MaxFailedAccessAttempts = 8;
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(10);
            })
            .AddEntityFrameworkStores<CheslaxDbContext>()
            .AddDefaultTokenProviders();

        services.AddHealthChecks()
            .AddDbContextCheck<CheslaxDbContext>("database");

        return services;
    }

    public static async Task InitializeDatabaseAsync(
        this IHost host,
        bool applyMigrations,
        bool migrateOnly = false,
        CancellationToken cancellationToken = default)
    {
        await using var scope = host.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<CheslaxDbContext>();
        var database = scope.ServiceProvider.GetRequiredService<DatabaseOptions>();

        if (database.IsSqlite)
        {
            await db.Database.EnsureCreatedAsync(cancellationToken);
        }
        else if (applyMigrations || migrateOnly)
        {
            await db.Database.MigrateAsync(cancellationToken);
        }

        if (await db.Database.CanConnectAsync(cancellationToken))
        {
            var users = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
            var roles = scope.ServiceProvider.GetRequiredService<RoleManager<Role>>();
            var superAdmin = scope.ServiceProvider.GetRequiredService<IOptions<SuperAdminOptions>>().Value;
            await SystemBotUser.EnsureAsync(users, cancellationToken);
            await SuperAdminUser.EnsureAsync(users, roles, db, superAdmin, cancellationToken);
        }
    }

    public static DatabaseOptions BindDatabaseOptions(IConfiguration configuration)
    {
        var database = configuration.GetSection(DatabaseOptions.SectionName).Get<DatabaseOptions>()
            ?? new DatabaseOptions();
        if (string.IsNullOrWhiteSpace(database.Provider))
        {
            database.Provider = "Npgsql";
        }

        return database;
    }
}
