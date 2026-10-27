using Cheslax.Domain;
using Cheslax.Infrastructure.Persistence;

namespace Cheslax.Infrastructure.Identity;

public static class PlayerRatingBootstrap
{
    public static bool AddMissing(CheslaxDbContext db, string userId, IEnumerable<GameType> existing, DateTimeOffset now)
    {
        var owned = existing.ToHashSet();
        var added = false;
        foreach (var game in GameTypeIds.All)
        {
            if (owned.Contains(game)) continue;
            db.PlayerRatings.Add(PlayerRating.CreateInitial(userId, game, now));
            added = true;
        }

        return added;
    }
}
