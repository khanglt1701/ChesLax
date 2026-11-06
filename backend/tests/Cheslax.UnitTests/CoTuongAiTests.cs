using Cheslax.GameEngine.CoTuong;

namespace Cheslax.UnitTests;

public class CoTuongAiTests
{
    [Fact]
    public void Starting_position_returns_a_legal_move()
    {
        var position = new CoTuongPosition();
        var legal = position.LegalMoves();
        Assert.NotEmpty(legal);
        var move = CoTuongAi.ChooseMove(position, 1, 0, 0, 2_000, 200, false);
        Assert.Contains(legal, item => item.From == move.From && item.To == move.To);
        Assert.True(position.TryMove(move.From, move.To, out var applied));
        Assert.NotNull(applied);
        Assert.Equal('b', applied.Position.Turn);
    }

    [Fact]
    public void Prefers_an_immediate_checkmate()
    {
        var position = new CoTuongPosition("4k4/1R7/9/9/4P4/9/9/9/7R1/4K4 r");
        var move = CoTuongAi.ChooseMove(position, 2, 0, 0, 8_000, 400, false);
        Assert.True(position.TryMove(move.From, move.To, out var applied));
        Assert.True(applied!.Position.IsCheckmate);
    }
}
