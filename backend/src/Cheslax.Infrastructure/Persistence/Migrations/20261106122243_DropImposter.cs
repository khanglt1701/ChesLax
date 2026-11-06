using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Cheslax.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class DropImposter : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ImposterClues");

            migrationBuilder.DropTable(
                name: "ImposterGamePlayers");

            migrationBuilder.DropTable(
                name: "ImposterRoomPlayers");

            migrationBuilder.DropTable(
                name: "ImposterRounds");

            migrationBuilder.DropTable(
                name: "ImposterVotes");

            migrationBuilder.DropTable(
                name: "ImposterWordPairs");

            migrationBuilder.DropTable(
                name: "ImposterWords");

            migrationBuilder.DropTable(
                name: "ImposterGames");

            migrationBuilder.DropTable(
                name: "ImposterRooms");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ImposterRooms",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    HostUserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    LastActivityAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Phase = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    StateJson = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ImposterRooms", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ImposterRooms_Users_HostUserId",
                        column: x => x.HostUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ImposterWordPairs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Category = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    CivilianWord = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Difficulty = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    Language = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false),
                    UndercoverWord = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ImposterWordPairs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ImposterWords",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Category = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Difficulty = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    Language = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false),
                    Text = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ImposterWords", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ImposterGames",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RoomId = table.Column<Guid>(type: "uuid", nullable: false),
                    Category = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    CivilianWord = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    FinishedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Language = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false),
                    Mode = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    StartedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UndercoverWord = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    Winner = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: true),
                    WonByGuess = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ImposterGames", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ImposterGames_ImposterRooms_RoomId",
                        column: x => x.RoomId,
                        principalTable: "ImposterRooms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ImposterRoomPlayers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RoomId = table.Column<Guid>(type: "uuid", nullable: false),
                    Avatar = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    IsConnected = table.Column<bool>(type: "boolean", nullable: false),
                    IsHost = table.Column<bool>(type: "boolean", nullable: false),
                    IsReady = table.Column<bool>(type: "boolean", nullable: false),
                    JoinedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Nickname = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    Seat = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ImposterRoomPlayers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ImposterRoomPlayers_ImposterRooms_RoomId",
                        column: x => x.RoomId,
                        principalTable: "ImposterRooms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ImposterRoomPlayers_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ImposterClues",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    GameId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClueRound = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    RoundNumber = table.Column<int>(type: "integer", nullable: false),
                    Skipped = table.Column<bool>(type: "boolean", nullable: false),
                    Text = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    UserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ImposterClues", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ImposterClues_ImposterGames_GameId",
                        column: x => x.GameId,
                        principalTable: "ImposterGames",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ImposterGamePlayers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    GameId = table.Column<Guid>(type: "uuid", nullable: false),
                    EliminatedRound = table.Column<int>(type: "integer", nullable: true),
                    IsEliminated = table.Column<bool>(type: "boolean", nullable: false),
                    Nickname = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    Role = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    Seat = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    Word = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ImposterGamePlayers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ImposterGamePlayers_ImposterGames_GameId",
                        column: x => x.GameId,
                        principalTable: "ImposterGames",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ImposterRounds",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    GameId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    EliminatedRole = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: true),
                    EliminatedUserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: true),
                    Number = table.Column<int>(type: "integer", nullable: false),
                    Tie = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ImposterRounds", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ImposterRounds_ImposterGames_GameId",
                        column: x => x.GameId,
                        principalTable: "ImposterGames",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ImposterVotes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    GameId = table.Column<Guid>(type: "uuid", nullable: false),
                    BallotSet = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    RoundNumber = table.Column<int>(type: "integer", nullable: false),
                    TargetUserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    VoterUserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ImposterVotes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ImposterVotes_ImposterGames_GameId",
                        column: x => x.GameId,
                        principalTable: "ImposterGames",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ImposterClues_GameId_RoundNumber_ClueRound_UserId",
                table: "ImposterClues",
                columns: new[] { "GameId", "RoundNumber", "ClueRound", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ImposterGamePlayers_GameId_UserId",
                table: "ImposterGamePlayers",
                columns: new[] { "GameId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ImposterGames_FinishedAt",
                table: "ImposterGames",
                column: "FinishedAt");

            migrationBuilder.CreateIndex(
                name: "IX_ImposterGames_RoomId",
                table: "ImposterGames",
                column: "RoomId");

            migrationBuilder.CreateIndex(
                name: "IX_ImposterRoomPlayers_RoomId_UserId",
                table: "ImposterRoomPlayers",
                columns: new[] { "RoomId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ImposterRoomPlayers_UserId",
                table: "ImposterRoomPlayers",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_ImposterRooms_Code",
                table: "ImposterRooms",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ImposterRooms_HostUserId",
                table: "ImposterRooms",
                column: "HostUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ImposterRooms_LastActivityAt",
                table: "ImposterRooms",
                column: "LastActivityAt");

            migrationBuilder.CreateIndex(
                name: "IX_ImposterRounds_GameId_Number",
                table: "ImposterRounds",
                columns: new[] { "GameId", "Number" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ImposterVotes_GameId_RoundNumber_BallotSet_VoterUserId",
                table: "ImposterVotes",
                columns: new[] { "GameId", "RoundNumber", "BallotSet", "VoterUserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ImposterWordPairs_IsActive_Language_Category",
                table: "ImposterWordPairs",
                columns: new[] { "IsActive", "Language", "Category" });

            migrationBuilder.CreateIndex(
                name: "IX_ImposterWordPairs_Language_Category_CivilianWord_Undercover~",
                table: "ImposterWordPairs",
                columns: new[] { "Language", "Category", "CivilianWord", "UndercoverWord" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ImposterWords_IsActive_Language_Category",
                table: "ImposterWords",
                columns: new[] { "IsActive", "Language", "Category" });

            migrationBuilder.CreateIndex(
                name: "IX_ImposterWords_Language_Category_Text",
                table: "ImposterWords",
                columns: new[] { "Language", "Category", "Text" },
                unique: true);
        }
    }
}
