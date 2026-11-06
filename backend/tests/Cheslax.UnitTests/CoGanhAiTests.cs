using Cheslax.GameEngine.CoGanh;

namespace Cheslax.UnitTests;

public class CoGanhAiTests
{
    [Fact]
    public void Chooses_a_legal_opening_move_and_prefers_ganh()
    {
        var start = CoGanhRules.CreateInitial();
        var opening = CoGanhAi.ChooseMove(start, 1, 0, 0, CancellationToken.None);
        Assert.True(CoGanhRules.IsLegal(start, opening.From, opening.To));

        var cells = new int[CoGanhBoard.Points];
        cells[CoGanhBoard.Parse("b3")!.Value] = CoGanhSides.Blue;
        cells[CoGanhBoard.Parse("d3")!.Value] = CoGanhSides.Blue;
        cells[CoGanhBoard.Parse("c2")!.Value] = CoGanhSides.Red;
        var capture = CoGanhAi.ChooseMove(new CoGanhState { Cells = cells }, 1, 0, 0, CancellationToken.None);
        Assert.Equal(CoGanhBoard.Parse("c2"), capture.From);
        Assert.Equal(CoGanhBoard.Parse("c3"), capture.To);
    }
}
