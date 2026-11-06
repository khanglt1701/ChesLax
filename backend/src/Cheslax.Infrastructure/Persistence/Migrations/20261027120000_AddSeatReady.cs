using Cheslax.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Cheslax.Infrastructure.Persistence.Migrations;

/// <inheritdoc />
[DbContext(typeof(CheslaxDbContext))]
[Migration("20261027120000_AddSeatReady")]
public partial class AddSeatReady : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<bool>(
            name: "Ready",
            table: "GameRoomSeats",
            type: "boolean",
            nullable: false,
            defaultValue: false);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "Ready",
            table: "GameRoomSeats");
    }
}
