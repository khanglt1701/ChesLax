using Cheslax.GameEngine.CoTuong;

namespace Cheslax.UnitTests;

public class CoTuongRulesTests
{
    [Fact]
    public void Starting_position_has_correct_setup_and_red_to_move()
    {
        var position = new CoTuongPosition();
        Assert.Equal('r', position.Turn);
        Assert.Equal("rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR r", position.Fen);
        Assert.Equal('K', position.PieceAt("e0"));
        Assert.Equal('k', position.PieceAt("e9"));
        Assert.Equal('R', position.PieceAt("a0"));
        Assert.Equal('r', position.PieceAt("a9"));
        Assert.Equal('C', position.PieceAt("b2"));
        Assert.Equal('c', position.PieceAt("b7"));
        Assert.Equal('P', position.PieceAt("a3"));
        Assert.Equal('p', position.PieceAt("a6"));
        Assert.False(position.InCheck);
        Assert.False(position.IsGameOver);
        Assert.Equal("playing", position.Status);
        Assert.NotEmpty(position.LegalMoves());
    }

    [Fact]
    public void Starting_chariot_and_cannon_have_expected_mobility()
    {
        var position = new CoTuongPosition();
        var chariot = Squares(position, "a0");
        Assert.Contains("a1", chariot);
        Assert.Contains("a2", chariot);
        Assert.DoesNotContain("a3", chariot);

        var cannon = Squares(position, "b2");
        Assert.Contains("b3", cannon);
        Assert.Contains("b4", cannon);
        Assert.Contains("b5", cannon);
        Assert.Contains("b6", cannon);
        Assert.DoesNotContain("b7", cannon);
        Assert.Contains("b9", cannon);
    }

    [Fact]
    public void Horse_is_blocked_by_occupied_leg()
    {
        var position = new CoTuongPosition("4k4/9/9/9/4P4/9/9/9/1N7/4K4 r");
        Assert.Contains("a3", Squares(position, "b1"));
        Assert.Contains("c3", Squares(position, "b1"));
        Assert.Contains("d2", Squares(position, "b1"));

        var blocked = new CoTuongPosition("4k4/9/9/9/4P4/9/9/1P7/1N7/4K4 r");
        Assert.DoesNotContain("a3", Squares(blocked, "b1"));
        Assert.DoesNotContain("c3", Squares(blocked, "b1"));
        Assert.Contains("d2", Squares(blocked, "b1"));
    }

    [Fact]
    public void Elephant_cannot_cross_river_or_jump_a_blocked_eye()
    {
        var position = new CoTuongPosition();
        Assert.Contains("a2", Squares(position, "c0"));
        Assert.Contains("e2", Squares(position, "c0"));
        Assert.DoesNotContain("e4", Squares(position, "c0"));

        var blocked = new CoTuongPosition("4k4/9/9/9/4P4/9/9/9/3P5/2B1K4 r");
        Assert.DoesNotContain("e2", Squares(blocked, "c0"));

        var river = new CoTuongPosition("4k4/9/9/9/9/2B1P4/9/9/9/4K4 r");
        Assert.DoesNotContain("e6", Squares(river, "c4"));
        Assert.Contains("a2", Squares(river, "c4"));
    }

    [Fact]
    public void Advisor_and_general_must_stay_inside_the_palace()
    {
        var position = new CoTuongPosition();
        Assert.Contains("e1", Squares(position, "d0"));
        Assert.DoesNotContain("c1", Squares(position, "d0"));
        Assert.DoesNotContain("d1", Squares(position, "e0"));
        Assert.Single(Squares(position, "e0"));
        Assert.Contains("e1", Squares(position, "e0"));

        var general = new CoTuongPosition("4k4/9/9/9/4P4/9/9/9/4K4/9 r");
        Assert.Contains("e0", Squares(general, "e1"));
        Assert.Contains("e2", Squares(general, "e1"));
        Assert.Contains("d1", Squares(general, "e1"));
        Assert.DoesNotContain("e3", Squares(general, "e1"));
        Assert.DoesNotContain("d2", Squares(general, "e1"));
    }

    [Fact]
    public void Cannon_captures_with_exactly_one_screen()
    {
        var position = new CoTuongPosition("4k4/9/4n4/4p4/9/4C4/9/9/9/4K4 r");
        Assert.Contains("e7", Squares(position, "e4"));
        Assert.False(position.TryMove("e4", "e9", out _));

        var twoScreens = new CoTuongPosition("4k4/9/4n4/4p4/4P4/4C4/9/9/9/4K4 r");
        Assert.DoesNotContain("e7", Squares(twoScreens, "e4"));

        var quiet = new CoTuongPosition("4k4/9/9/9/9/4C4/9/9/9/4K4 r");
        Assert.Contains("e6", Squares(quiet, "e4"));
        Assert.DoesNotContain("e9", Squares(quiet, "e4"));
    }

    [Fact]
    public void Chariot_slides_until_blocked_and_can_capture()
    {
        var position = new CoTuongPosition("4k4/9/9/9/9/9/4n4/9/9/4RK3 r");
        Assert.Contains("e1", Squares(position, "e0"));
        Assert.Contains("e2", Squares(position, "e0"));
        Assert.Contains("e3", Squares(position, "e0"));
        Assert.DoesNotContain("e4", Squares(position, "e0"));
        Assert.DoesNotContain("f0", Squares(position, "e0"));
    }

    [Fact]
    public void Soldier_moves_forward_then_sideways_after_the_river()
    {
        var before = new CoTuongPosition("4k4/9/9/9/9/9/4P4/9/9/4K4 r");
        Assert.Equal(new[] { "e4" }, Squares(before, "e3").OrderBy(value => value));
        Assert.False(before.TryMove("e3", "e2", out _));
        Assert.False(before.TryMove("e3", "d3", out _));

        var after = new CoTuongPosition("3k5/9/9/9/4P4/9/9/9/9/4K4 r");
        var moves = Squares(after, "e5").OrderBy(value => value).ToArray();
        Assert.Equal(new[] { "d5", "e6", "f5" }, moves);
        Assert.False(after.TryMove("e5", "e4", out _));
    }

    [Fact]
    public void Flying_general_rule_blocks_exposing_the_file()
    {
        var position = new CoTuongPosition("4k4/9/9/9/4P4/9/9/9/9/4K4 r");
        Assert.False(position.TryMove("e5", "d5", out _));
        Assert.True(position.TryMove("e5", "e6", out var advanced));
        Assert.NotNull(advanced);
        Assert.False(advanced.Position.InCheck);
    }

    [Fact]
    public void Detects_check_from_a_chariot()
    {
        var position = new CoTuongPosition("4k4/9/9/9/9/9/9/9/4R4/4K4 r");
        Assert.True(position.TryMove("e1", "e8", out var next));
        Assert.True(next!.Position.InCheck);
        Assert.Equal("check", next.Position.Status);
        Assert.Equal('b', next.Position.Turn);
    }

    [Fact]
    public void Detects_checkmate_when_the_general_has_no_escape()
    {
        var position = new CoTuongPosition("4k2R1/7R1/9/9/4P4/9/9/9/9/4K4 b");
        Assert.True(position.InCheck);
        Assert.True(position.IsCheckmate);
        Assert.Equal("checkmate", position.Status);
        Assert.Empty(position.LegalMoves());
    }

    [Fact]
    public void Stalemate_is_a_loss_for_the_side_that_cannot_move()
    {
        var position = new CoTuongPosition("4k4/R8/9/9/4P4/9/9/9/9/3RKR3 b");
        Assert.False(position.InCheck);
        Assert.True(position.IsStalemate);
        Assert.True(position.IsGameOver);
        Assert.Equal("stalemate", position.Status);
    }

    [Fact]
    public void Cannot_move_into_self_check_or_capture_the_general()
    {
        var position = new CoTuongPosition("4k4/9/9/9/9/9/9/9/4R4/4K4 r");
        Assert.False(position.TryMove("e1", "a1", out _));
        Assert.DoesNotContain(position.LegalMoves(), move => move.To == "e9");
        Assert.False(position.TryMove("e1", "e9", out _));
    }

    [Fact]
    public void Enforces_turns_and_rejects_out_of_turn_moves()
    {
        var position = new CoTuongPosition();
        Assert.False(position.TryMove("a9", "a8", out _));
        Assert.True(position.TryMove("a3", "a4", out var next));
        Assert.Equal('b', next!.Position.Turn);
        Assert.False(next.Position.TryMove("a4", "a5", out _));
        Assert.True(next.Position.TryMove("a6", "a5", out _));
    }

    [Fact]
    public void Captures_remove_the_piece_and_are_recorded()
    {
        var position = new CoTuongPosition("4k4/9/9/9/9/4r4/9/9/9/4RK3 r");
        Assert.True(position.TryMove("e0", "e4", out var next));
        Assert.Equal('\0', next!.Position.PieceAt("e0"));
        Assert.Equal('R', next.Position.PieceAt("e4"));
        Assert.Equal('r', next.Captured);
        Assert.Contains('x', next.Notation);
        Assert.Equal("Xe e0xe4", next.Notation);
    }

    [Fact]
    public void Threefold_repetition_is_a_draw()
    {
        var position = new CoTuongPosition("4k4/9/9/9/4P4/9/9/9/9/R3K4 r");
        for (var i = 0; i < 2; i++)
        {
            Assert.True(position.TryMove("a0", "a1", out var a));
            position = a!.Position;
            Assert.True(position.TryMove("e9", "d9", out var b));
            position = b!.Position;
            Assert.True(position.TryMove("a1", "a0", out var c));
            position = c!.Position;
            Assert.True(position.TryMove("d9", "e9", out var d));
            position = d!.Position;
        }

        Assert.True(position.IsThreefold);
        Assert.True(position.IsGameOver);
        Assert.Equal("draw-threefold", position.Status);
    }

    [Fact]
    public void Fen_round_trips_after_a_move()
    {
        var position = new CoTuongPosition();
        Assert.True(position.TryMove("h2", "h9", out var next));
        var restored = new CoTuongPosition(next!.Position.Fen);
        Assert.Equal(next.Position.Fen, restored.Fen);
        Assert.Equal('c', restored.PieceAt("b7"));
        Assert.Equal('C', restored.PieceAt("h9"));
        Assert.Equal('\0', restored.PieceAt("h2"));
    }

    private static List<string> Squares(CoTuongPosition position, string from) =>
        position.LegalMovesFrom(from).Select(move => move.To).ToList();
}
