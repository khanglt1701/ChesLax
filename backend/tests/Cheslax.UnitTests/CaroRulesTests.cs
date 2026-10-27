using Cheslax.GameEngine.Caro;

namespace Cheslax.UnitTests;

public class CaroRulesTests
{
    [Fact]
    public void Five_in_a_row_wins_and_keeps_the_line()
    {
        var state = CaroRules.CreateInitial();
        var size = state.Size;
        for (var column = 0; column < 4; column++)
        {
            state = CaroRules.Place(state, column, CaroState.X);
            state = CaroRules.Place(state, size + column, CaroState.O);
        }

        state = CaroRules.Place(state, 4, CaroState.X);

        Assert.Equal("ended", state.Status);
        Assert.Equal("x", state.Winner);
        Assert.Equal(5, state.WinningLine.Count);
        Assert.Contains(4, state.WinningLine);
    }

    [Fact]
    public void Completing_six_in_a_row_still_wins()
    {
        var state = CaroRules.CreateInitial();
        int[] crosses = [0, 1, 2, 3, 5];
        int[] circles = [20, 22, 40, 42, 60];
        for (var step = 0; step < crosses.Length; step++)
        {
            state = CaroRules.Place(state, crosses[step], CaroState.X);
            state = CaroRules.Place(state, circles[step], CaroState.O);
        }

        state = CaroRules.Place(state, 4, CaroState.X);

        Assert.Equal("ended", state.Status);
        Assert.Equal("x", state.Winner);
        Assert.True(state.WinningLine.Count >= 6);
    }

    [Fact]
    public void Diagonal_five_wins()
    {
        var state = CaroRules.CreateInitial();
        var stride = state.Size + 1;
        for (var step = 0; step < 4; step++)
        {
            state = CaroRules.Place(state, step * stride, CaroState.X);
            state = CaroRules.Place(state, state.Size + 2 + step, CaroState.O);
        }

        state = CaroRules.Place(state, 4 * stride, CaroState.X);

        Assert.Equal("x", state.Winner);
        Assert.Equal(5, state.WinningLine.Count);
    }

    [Fact]
    public void Rejects_occupied_and_wrong_turn()
    {
        var state = CaroRules.Place(CaroRules.CreateInitial(), 112, CaroState.X);
        Assert.Throws<InvalidOperationException>(() => CaroRules.Place(state, 112, CaroState.O));
        Assert.Throws<InvalidOperationException>(() => CaroRules.Place(state, 113, CaroState.X));
    }

    [Fact]
    public void Full_board_without_five_is_a_draw()
    {
        var state = CaroRules.CreateInitial();
        for (var index = 0; index < state.Cells.Length; index++)
        {
            var row = index / state.Size;
            var column = index % state.Size;
            var band = (column + row * 2) % 5;
            state.Cells[index] = band < 3 ? CaroState.X : CaroState.O;
        }

        Assert.DoesNotContain(Enumerable.Range(0, state.Cells.Length), index =>
            state.Cells[index] != CaroState.Empty && CaroRules.WinningLine(state.Cells, state.Size, index, state.Cells[index]).Count > 0);

        state.Cells[0] = CaroState.Empty;
        state.CurrentPlayer = CaroState.O;
        state.Status = "playing";
        var ended = CaroRules.Place(state, 0, CaroState.O);

        Assert.Equal("ended", ended.Status);
        Assert.Equal("draw", ended.Winner);
    }

    [Fact]
    public void Ai_takes_a_winning_move_and_blocks_an_open_four()
    {
        var winning = CaroRules.CreateInitial();
        for (var column = 0; column < 4; column++)
        {
            winning.Cells[column] = CaroState.X;
        }

        winning.CurrentPlayer = CaroState.X;
        Assert.Equal(4, CaroAi.ChooseMove(winning, 1, 0, 0, CancellationToken.None));

        var blocking = CaroRules.CreateInitial();
        for (var column = 0; column < 4; column++)
        {
            blocking.Cells[column] = CaroState.X;
        }

        blocking.CurrentPlayer = CaroState.O;
        Assert.Equal(4, CaroAi.ChooseMove(blocking, 1, 0, 0, CancellationToken.None));
    }

    [Fact]
    public void New_games_use_twelve_and_keep_that_size()
    {
        var state = CaroRules.CreateInitial();
        Assert.Equal(CaroBoardConfig.DefaultSize, state.Size);
        Assert.Equal(144, state.Cells.Length);

        var center = state.Size / 2 * state.Size + state.Size / 2;
        var played = CaroRules.Place(state, center, CaroState.X);
        Assert.Equal(12, played.Size);
        Assert.Equal(144, played.Cells.Length);
    }

    [Fact]
    public void Legacy_board_without_size_keeps_its_cell_count()
    {
        var legacy = new CaroState { Size = 0, Cells = new int[225] };
        CaroRules.Normalize(legacy);
        Assert.Equal(15, legacy.Size);
        Assert.Equal(225, legacy.Cells.Length);
    }

    [Fact]
    public void Five_blocked_on_both_ends_does_not_win()
    {
        var state = OpenTurn();
        var row = state.Size * 2;
        state.Cells[row] = CaroState.O;
        for (var column = 1; column <= 4; column++)
        {
            state.Cells[row + column] = CaroState.X;
        }

        state.Cells[row + 6] = CaroState.O;
        state = CaroRules.Place(state, row + 5, CaroState.X);

        Assert.Equal("playing", state.Status);
        Assert.Null(state.Winner);
    }

    [Fact]
    public void Five_against_the_edge_and_an_opponent_does_not_win()
    {
        var state = OpenTurn();
        for (var column = 0; column < 4; column++)
        {
            state.Cells[column] = CaroState.X;
        }

        state.Cells[5] = CaroState.O;
        state = CaroRules.Place(state, 4, CaroState.X);

        Assert.Equal("playing", state.Status);
    }

    [Fact]
    public void Five_against_the_edge_with_one_open_end_wins()
    {
        var state = OpenTurn();
        for (var column = 0; column < 4; column++)
        {
            state.Cells[column] = CaroState.X;
        }

        state = CaroRules.Place(state, 4, CaroState.X);

        Assert.Equal("x", state.Winner);
        Assert.Equal(5, state.WinningLine.Count);
    }

    [Fact]
    public void Six_blocked_on_both_ends_does_not_win()
    {
        var state = OpenTurn();
        var row = state.Size;
        state.Cells[row] = CaroState.O;
        for (var column = 1; column <= 5; column++)
        {
            state.Cells[row + column] = CaroState.X;
        }

        state.Cells[row + 7] = CaroState.O;
        state = CaroRules.Place(state, row + 6, CaroState.X);

        Assert.Equal("playing", state.Status);
    }

    [Fact]
    public void An_open_crossing_line_wins_when_the_other_line_is_blocked()
    {
        var state = OpenTurn();
        var size = state.Size;
        const int row = 5;
        const int column = 4;
        var center = row * size + column;
        state.Cells[row * size + 1] = CaroState.O;
        state.Cells[row * size + 2] = CaroState.X;
        state.Cells[row * size + 3] = CaroState.X;
        state.Cells[row * size + 5] = CaroState.X;
        state.Cells[row * size + 6] = CaroState.X;
        state.Cells[row * size + 7] = CaroState.O;
        state.Cells[3 * size + column] = CaroState.X;
        state.Cells[4 * size + column] = CaroState.X;
        state.Cells[6 * size + column] = CaroState.X;
        state.Cells[7 * size + column] = CaroState.X;

        state = CaroRules.Place(state, center, CaroState.X);

        Assert.Equal("x", state.Winner);
        Assert.Contains(3 * size + column, state.WinningLine);
        Assert.Contains(center, state.WinningLine);
        Assert.DoesNotContain(row * size + 2, state.WinningLine);
    }

    private static CaroState OpenTurn()
    {
        var state = CaroRules.CreateInitial();
        state.CurrentPlayer = CaroState.X;
        return state;
    }
}
