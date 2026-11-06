using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Cheslax.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ResetCoTuongData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DELETE FROM "RatingHistories" WHERE "GameType" = 4;
                DELETE FROM "MatchMoves" WHERE "MatchId" IN (SELECT "Id" FROM "GameMatches" WHERE "GameType" = 4);
                DELETE FROM "ActiveMatchLocks" WHERE "GameType" = 4;
                DELETE FROM "GameMatches" WHERE "GameType" = 4;
                DELETE FROM "GameRoomSeats" WHERE "RoomId" IN (SELECT "Id" FROM "GameRooms" WHERE "GameType" = 4);
                DELETE FROM "GameRooms" WHERE "GameType" = 4;
                DELETE FROM "MatchmakingTickets" WHERE "GameType" = 4;
                DELETE FROM "PlayerRatings" WHERE "GameType" = 4;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
