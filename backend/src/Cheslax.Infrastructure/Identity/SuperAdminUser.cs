using Cheslax.Domain;
using Cheslax.Infrastructure.Options;
using Cheslax.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Cheslax.Infrastructure.Identity;

public static class SuperAdminUser
{
    public const string UserId = "cheslax-super-admin";
    public const string RoleName = CheslaxRoles.SuperAdmin;

    public static async Task EnsureAsync(
        UserManager<User> users,
        RoleManager<Role> roles,
        CheslaxDbContext db,
        SuperAdminOptions options,
        CancellationToken cancellationToken)
    {
        if (!options.HasPassword)
        {
            return;
        }

        var userName = string.IsNullOrWhiteSpace(options.UserName) ? "super_admin" : options.UserName.Trim();
        var email = string.IsNullOrWhiteSpace(options.Email) ? $"{userName}@cheslax.local" : options.Email.Trim();
        var displayName = string.IsNullOrWhiteSpace(options.DisplayName) ? "Super Admin" : options.DisplayName.Trim();

        if (!await roles.RoleExistsAsync(RoleName))
        {
            var roleCreated = await roles.CreateAsync(new Role { Name = RoleName });
            if (!roleCreated.Succeeded)
            {
                throw new InvalidOperationException(
                    "Không tạo được role super_admin: " + string.Join("; ", roleCreated.Errors.Select(error => error.Description)));
            }
        }

        var existing = await users.Users.FirstOrDefaultAsync(user => user.Id == UserId, cancellationToken)
            ?? await users.FindByNameAsync(userName);

        if (existing is null)
        {
            var created = new User
            {
                Id = UserId,
                UserName = userName,
                Email = email,
                DisplayName = displayName,
                AvatarId = "seal-1",
                CreatedAt = DateTimeOffset.UtcNow,
                EmailConfirmed = true,
                IsGuest = false,
                IsBot = false,
            };
            var result = await users.CreateAsync(created, options.Password);
            if (!result.Succeeded)
            {
                throw new InvalidOperationException(
                    "Không tạo được tài khoản super_admin: " + string.Join("; ", result.Errors.Select(error => error.Description)));
            }

            existing = created;
            var now = DateTimeOffset.UtcNow;
            if (!await db.UserPreferences.AnyAsync(preference => preference.UserId == existing.Id, cancellationToken))
            {
                db.UserPreferences.Add(UserPreference.CreateDefault(existing.Id, now));
            }

            if (!await db.PlayerRatings.AnyAsync(rating => rating.UserId == existing.Id, cancellationToken))
            {
                db.PlayerRatings.Add(PlayerRating.CreateInitial(existing.Id, GameType.Chess, now));
                db.PlayerRatings.Add(PlayerRating.CreateInitial(existing.Id, GameType.OAnQuan, now));
            }

            await db.SaveChangesAsync(cancellationToken);
        }

        if (!await users.IsInRoleAsync(existing, RoleName))
        {
            var added = await users.AddToRoleAsync(existing, RoleName);
            if (!added.Succeeded)
            {
                throw new InvalidOperationException(
                    "Không gán role super_admin: " + string.Join("; ", added.Errors.Select(error => error.Description)));
            }
        }
    }
}
