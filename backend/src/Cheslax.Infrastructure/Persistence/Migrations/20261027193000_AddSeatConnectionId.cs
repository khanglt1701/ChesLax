using Cheslax.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Cheslax.Infrastructure.Persistence.Migrations;

/// <inheritdoc />
[DbContext(typeof(CheslaxDbContext))]
[Migration("20261027193000_AddSeatConnectionId")]
public partial class AddSeatConnectionId : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "ConnectionId",
            table: "GameRoomSeats",
            type: "character varying(128)",
            maxLength: 128,
            nullable: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "ConnectionId",
            table: "GameRoomSeats");
    }
}
