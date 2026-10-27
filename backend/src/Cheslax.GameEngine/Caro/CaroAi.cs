namespace Cheslax.GameEngine.Caro;

public static class CaroAi
{
    private static readonly int[] ShapeScore = [0, 2, 18, 120, 900, 100_000];

    public static int ChooseMove(
        CaroState state,
        int depth,
        int noise,
        double blunderChance,
        CancellationToken cancellationToken)
    {
        if (state.Status != "playing")
        {
            throw new InvalidOperationException("Ván đã kết thúc.");
        }

        var player = state.CurrentPlayer;
        var legal = CaroRules.LegalMoves(state);
        if (legal.Count == 0)
        {
            throw new InvalidOperationException("Không còn ô trống.");
        }

        foreach (var index in legal)
        {
            cancellationToken.ThrowIfCancellationRequested();
            if (CaroRules.WouldWin(state, index, player))
            {
                return index;
            }
        }

        var opponent = CaroRules.Other(player);
        var blocks = legal.Where(index => CaroRules.WouldWin(state, index, opponent)).ToList();
        if (blocks.Count > 0 && Random.Shared.NextDouble() >= blunderChance)
        {
            return blocks[0];
        }

        var ranked = legal
            .Select(index => (
                index,
                score: Static(state, index, player) + (noise <= 0 ? 0 : Random.Shared.Next(-noise, noise + 1))))
            .OrderByDescending(item => item.score)
            .Take(depth <= 1 ? legal.Count : 10)
            .ToList();

        if (blunderChance > 0 && Random.Shared.NextDouble() < blunderChance)
        {
            return ranked[Random.Shared.Next(ranked.Count)].index;
        }

        if (depth <= 1)
        {
            return ranked[0].index;
        }

        var bestIndex = ranked[0].index;
        var best = int.MinValue;
        foreach (var candidate in ranked)
        {
            cancellationToken.ThrowIfCancellationRequested();
            var next = CaroRules.Place(state, candidate.index, player);
            var score = next.Status == "ended"
                ? (next.Winner == CaroRules.SideOf(player) ? 100_000 : 0)
                : -BestReply(next, opponent);
            if (score > best)
            {
                best = score;
                bestIndex = candidate.index;
            }
        }

        return bestIndex;
    }

    public static int Evaluate(CaroState state, int player)
    {
        CaroRules.Normalize(state);
        return Scan(state.Cells, state.Size, player) - Scan(state.Cells, state.Size, CaroRules.Other(player));
    }

    private static int BestReply(CaroState state, int player)
    {
        var legal = CaroRules.LegalMoves(state);
        var best = int.MinValue;
        foreach (var index in legal.OrderByDescending(index => Static(state, index, player)).Take(8))
        {
            if (CaroRules.WouldWin(state, index, player))
            {
                return 90_000;
            }

            var next = CaroRules.Place(state, index, player);
            var score = next.Status == "ended" ? 0 : Evaluate(next, player);
            if (score > best)
            {
                best = score;
            }
        }

        return best == int.MinValue ? 0 : best;
    }

    private static int Static(CaroState state, int index, int player)
    {
        var next = state.Clone();
        next.Cells[index] = player;
        return Scan(next.Cells, next.Size, player) - Scan(next.Cells, next.Size, CaroRules.Other(player));
    }

    private static int Scan(int[] cells, int size, int player)
    {
        var total = 0;
        for (var row = 0; row < size; row++)
        for (var column = 0; column <= size - CaroState.WinLength; column++)
        {
            total += Window(cells, size, row, column, 0, 1, player);
        }

        for (var column = 0; column < size; column++)
        for (var row = 0; row <= size - CaroState.WinLength; row++)
        {
            total += Window(cells, size, row, column, 1, 0, player);
        }

        for (var row = 0; row <= size - CaroState.WinLength; row++)
        for (var column = 0; column <= size - CaroState.WinLength; column++)
        {
            total += Window(cells, size, row, column, 1, 1, player);
        }

        for (var row = 0; row <= size - CaroState.WinLength; row++)
        for (var column = CaroState.WinLength - 1; column < size; column++)
        {
            total += Window(cells, size, row, column, 1, -1, player);
        }

        return total;
    }

    private static int Window(int[] cells, int size, int row, int column, int dRow, int dColumn, int player)
    {
        var mine = 0;
        var other = 0;
        for (var step = 0; step < CaroState.WinLength; step++)
        {
            var value = cells[(row + dRow * step) * size + (column + dColumn * step)];
            if (value == player) mine++;
            else if (value != CaroState.Empty) other++;
        }

        if (other > 0 || mine == 0) return 0;
        if (mine == CaroState.WinLength && BothEndsBlocked(cells, size, row, column, dRow, dColumn, player))
        {
            return 40;
        }

        return ShapeScore[mine];
    }

    private static bool BothEndsBlocked(int[] cells, int size, int row, int column, int dRow, int dColumn, int player)
    {
        return EndBlocked(cells, size, row - dRow, column - dColumn, player)
            && EndBlocked(cells, size, row + dRow * CaroState.WinLength, column + dColumn * CaroState.WinLength, player);
    }

    private static bool EndBlocked(int[] cells, int size, int row, int column, int player)
    {
        if (row < 0 || column < 0 || row >= size || column >= size)
        {
            return true;
        }

        var value = cells[row * size + column];
        return value != CaroState.Empty && value != player;
    }
}
