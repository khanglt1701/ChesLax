using Cheslax.GameEngine.CoGanh;

namespace Cheslax.UnitTests;

public class CoGanhRulesTests
{
    [Fact]
    public void Board_graph_has_orthogonal_and_alquerque_diagonal_lines()
    {
        Assert.Equal(56, CoGanhBoard.Edges.Count);
        for (var index = 0; index < CoGanhBoard.Points; index++)
        {
            var row = CoGanhBoard.RowOf(index);
            var col = CoGanhBoard.ColOf(index);
            foreach (var next in CoGanhBoard.Neighbors[index])
            {
                Assert.True(CoGanhBoard.AreAdjacent(index, next));
                Assert.True(CoGanhBoard.AreAdjacent(next, index));
                var dRow = Math.Abs(CoGanhBoard.RowOf(next) - row);
                var dCol = Math.Abs(CoGanhBoard.ColOf(next) - col);
                Assert.True(dRow <= 1 && dCol <= 1 && dRow + dCol > 0);
                if (dRow == 1 && dCol == 1)
                {
                    Assert.True(CoGanhBoard.HasDiagonals(row, col));
                    Assert.True(CoGanhBoard.HasDiagonals(CoGanhBoard.RowOf(next), CoGanhBoard.ColOf(next)));
                }
            }
        }

        Assert.False(CoGanhBoard.HasDiagonals(0, 1));
        Assert.False(CoGanhBoard.AreAdjacent(CoGanhBoard.IndexOf(0, 1), CoGanhBoard.IndexOf(1, 0)));
        Assert.Equal(8, CoGanhBoard.Neighbors[CoGanhBoard.IndexOf(2, 2)].Length);
        Assert.Equal("a1", CoGanhBoard.NameOf(Must("a1")));
        Assert.Equal("c3", CoGanhBoard.NameOf(Must("c3")));
    }

    [Fact]
    public void Initial_position_has_eight_pieces_each_on_the_rim()
    {
        var state = CoGanhRules.CreateInitial();
        Assert.Equal(8, CoGanhRules.PieceCount(state.Cells, CoGanhSides.RedId));
        Assert.Equal(8, CoGanhRules.PieceCount(state.Cells, CoGanhSides.BlueId));
        Assert.Equal(9, state.Cells.Count(cell => cell == CoGanhSides.Empty));
        Assert.Equal(CoGanhSides.RedId, state.Turn);
        Assert.Equal(CoGanhSides.Red, state.Cells[Must("a1")]);
        Assert.Equal(CoGanhSides.Blue, state.Cells[Must("e5")]);
        Assert.Equal(CoGanhSides.Empty, state.Cells[Must("c3")]);
        foreach (var index in CoGanhBoard.RedStart) Assert.Equal(CoGanhSides.Red, state.Cells[index]);
        foreach (var index in CoGanhBoard.BlueStart) Assert.Equal(CoGanhSides.Blue, state.Cells[index]);
    }

    [Fact]
    public void Legal_step_along_a_line_and_rejects_occupied_or_unconnected_points()
    {
        var state = CoGanhRules.CreateInitial();
        Assert.True(CoGanhRules.IsLegal(state, Must("c1"), Must("c2")));
        var next = CoGanhRules.ApplyMove(state, Must("c1"), Must("c2"));
        Assert.Equal(CoGanhSides.Empty, next.Cells[Must("c1")]);
        Assert.Equal(CoGanhSides.Red, next.Cells[Must("c2")]);
        Assert.Equal(CoGanhSides.BlueId, next.Turn);

        Assert.False(CoGanhRules.IsLegal(state, Must("a1"), Must("b1")));
        Assert.False(CoGanhRules.IsLegal(state, Must("a1"), Must("a3")));
        Assert.False(CoGanhRules.IsLegal(state, Must("a5"), Must("a4")));
        Assert.False(CoGanhRules.TryMove(state, Must("e5"), Must("d4"), out _));
        Assert.Equal("b2", CoGanhBoard.NameOf(CoGanhRules.LegalMoves(state, Must("a1")).Single().To));
        Assert.Empty(CoGanhRules.LegalMoves(state, Must("a5")));
    }

    [Fact]
    public void Ganh_converts_opposite_enemy_pieces_on_connected_lines()
    {
        var horizontal = CoGanhRules.ApplyMove(State(Merge(Place(CoGanhSides.Blue, "b3", "d3"), CoGanhSides.Red, "c2")), Must("c2"), Must("c3"));
        Assert.Equal(2, horizontal.Ganh.Count);
        Assert.Equal(CoGanhSides.Red, horizontal.Cells[Must("b3")]);
        Assert.Equal(CoGanhSides.Red, horizontal.Cells[Must("d3")]);

        var vertical = CoGanhRules.ApplyMove(State(Merge(Place(CoGanhSides.Blue, "c4", "c2"), CoGanhSides.Red, "b3")), Must("b3"), Must("c3"));
        Assert.Equal(2, vertical.Ganh.Count);

        var diagonal = CoGanhRules.ApplyMove(State(Merge(Place(CoGanhSides.Blue, "b4", "d2"), CoGanhSides.Red, "c2")), Must("c2"), Must("c3"));
        Assert.Equal(2, diagonal.Ganh.Count);

        var odd = new int[CoGanhBoard.Points];
        odd[Must("b5")] = CoGanhSides.Blue;
        odd[Must("d3")] = CoGanhSides.Blue;
        odd[Must("c4")] = CoGanhSides.Red;
        Assert.Empty(CoGanhRules.DetectGanhs(odd, Must("c4"), CoGanhSides.RedId));
        Assert.False(CoGanhBoard.AreAdjacent(Must("c4"), Must("d3")));
    }

    [Fact]
    public void One_move_can_ganh_multiple_pairs()
    {
        var cells = new int[CoGanhBoard.Points];
        cells[Must("b3")] = CoGanhSides.Blue;
        cells[Must("d3")] = CoGanhSides.Blue;
        cells[Must("c4")] = CoGanhSides.Blue;
        cells[Must("c2")] = CoGanhSides.Blue;
        cells[Must("b2")] = CoGanhSides.Red;
        var next = CoGanhRules.ApplyMove(State(cells), Must("b2"), Must("c3"));
        Assert.Equal(4, next.Ganh.Count);
        Assert.Equal(5, CoGanhRules.PieceCount(next.Cells, CoGanhSides.RedId));
        Assert.Equal(0, CoGanhRules.PieceCount(next.Cells, CoGanhSides.BlueId));
        Assert.Equal("ended", next.Status);
        Assert.Equal(CoGanhSides.RedId, CoGanhRules.WinnerOf(next));
    }

    [Fact]
    public void Vay_requires_no_liberty_and_handles_corner_edge_and_groups()
    {
        var blockedOneWay = Merge(Place(CoGanhSides.Blue, "c3"), CoGanhSides.Red, "c4", "b3");
        Assert.True(CoGanhVay.HasLiberty(blockedOneWay, Must("c3")));
        Assert.Empty(CoGanhVay.Detect(blockedOneWay, CoGanhSides.RedId));

        var corner = new int[CoGanhBoard.Points];
        corner[Must("a5")] = CoGanhSides.Blue;
        corner[Must("b5")] = CoGanhSides.Red;
        corner[Must("a4")] = CoGanhSides.Red;
        corner[Must("b4")] = CoGanhSides.Red;
        Assert.Equal(Must("a5"), Assert.Single(CoGanhVay.Detect(corner, CoGanhSides.RedId)));

        var edge = new int[CoGanhBoard.Points];
        edge[Must("b5")] = CoGanhSides.Blue;
        edge[Must("a5")] = CoGanhSides.Red;
        edge[Must("c5")] = CoGanhSides.Red;
        edge[Must("b4")] = CoGanhSides.Red;
        Assert.Equal(3, CoGanhBoard.Neighbors[Must("b5")].Length);
        Assert.Equal(Must("b5"), Assert.Single(CoGanhVay.Detect(edge, CoGanhSides.RedId)));

        var group = new int[CoGanhBoard.Points];
        group[Must("a3")] = CoGanhSides.Blue;
        group[Must("a2")] = CoGanhSides.Blue;
        group[Must("a1")] = CoGanhSides.Red;
        group[Must("b1")] = CoGanhSides.Red;
        group[Must("b2")] = CoGanhSides.Red;
        group[Must("b3")] = CoGanhSides.Red;
        group[Must("a4")] = CoGanhSides.Red;
        group[Must("b4")] = CoGanhSides.Red;
        Assert.Equal(2, CoGanhVay.Detect(group, CoGanhSides.RedId).Count);

        var before = new int[CoGanhBoard.Points];
        before[Must("a5")] = CoGanhSides.Blue;
        before[Must("b5")] = CoGanhSides.Red;
        before[Must("b4")] = CoGanhSides.Red;
        before[Must("a3")] = CoGanhSides.Red;
        var next = CoGanhRules.ApplyMove(State(before), Must("a3"), Must("a4"));
        Assert.Equal(Must("a5"), Assert.Single(next.Vay));
        Assert.Equal(CoGanhSides.Red, next.Cells[Must("a5")]);
    }

    [Fact]
    public void Turn_switches_until_one_side_has_no_pieces_then_moves_stop()
    {
        var quiet = CoGanhRules.ApplyMove(CoGanhRules.CreateInitial(), Must("c1"), Must("c2"));
        Assert.Equal(CoGanhSides.BlueId, quiet.Turn);
        Assert.Null(CoGanhRules.WinnerOf(quiet));

        var winningCells = Merge(Place(CoGanhSides.Blue, "b3", "d3"), CoGanhSides.Red, "c2");
        for (var i = 0; i < CoGanhBoard.Points; i++)
        {
            if (winningCells[i] == CoGanhSides.Empty && i != Must("c3"))
            {
                winningCells[i] = CoGanhSides.Red;
            }
        }

        var win = CoGanhRules.ApplyMove(State(winningCells), Must("c2"), Must("c3"));
        Assert.Equal("ended", win.Status);
        Assert.Equal(CoGanhSides.RedId, CoGanhRules.WinnerOf(win));
        Assert.Empty(CoGanhRules.LegalMoves(win));
        Assert.Throws<InvalidOperationException>(() => CoGanhRules.ApplyMove(win, Must("c3"), Must("c4")));

        var majority = CoGanhRules.CreateInitial();
        majority.Cells[Must("a5")] = CoGanhSides.Red;
        Assert.True(CoGanhRules.PieceCount(majority.Cells, CoGanhSides.RedId) > CoGanhRules.PieceCount(majority.Cells, CoGanhSides.BlueId));
        Assert.Null(CoGanhRules.WinnerOf(majority));
    }

    [Fact]
    public void Clone_lets_a_move_be_undone_and_redone()
    {
        var before = State(Merge(Place(CoGanhSides.Blue, "b3", "d3"), CoGanhSides.Red, "c2"));
        var snapshot = before.Clone();
        var after = CoGanhRules.ApplyMove(before, Must("c2"), Must("c3"));
        Assert.Equal(2, after.Ganh.Count);
        Assert.Equal(CoGanhSides.Blue, snapshot.Cells[Must("b3")]);
        var redo = CoGanhRules.ApplyMove(snapshot, Must("c2"), Must("c3"));
        Assert.Equal(after.Cells, redo.Cells);
    }

    private static int Must(string name) =>
        CoGanhBoard.Parse(name) ?? throw new ArgumentException(name);

    private static int[] Place(int value, params string[] points)
    {
        var cells = new int[CoGanhBoard.Points];
        foreach (var point in points) cells[Must(point)] = value;
        return cells;
    }

    private static int[] Merge(int[] baseCells, int value, params string[] points)
    {
        var cells = (int[])baseCells.Clone();
        foreach (var point in points) cells[Must(point)] = value;
        return cells;
    }

    private static CoGanhState State(int[] cells, string turn = CoGanhSides.RedId) => new()
    {
        Cells = cells,
        Turn = turn,
    };
}
