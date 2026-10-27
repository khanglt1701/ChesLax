namespace Cheslax.GameEngine.Caro;

public static class CaroBoardConfig
{
    public const int DefaultSize = 12;
    public const int MinSize = 5;
    public const int MaxSize = 19;
}

public sealed class CaroState
{
    public const int WinLength = 5;
    public const int Empty = 0;
    public const int X = 1;
    public const int O = 2;

    public int Size { get; set; } = CaroBoardConfig.DefaultSize;
    public int[] Cells { get; set; } = new int[CaroBoardConfig.DefaultSize * CaroBoardConfig.DefaultSize];
    public int CurrentPlayer { get; set; } = X;
    public string Status { get; set; } = "playing";
    public string? Winner { get; set; }
    public int? LastIndex { get; set; }
    public List<int> WinningLine { get; set; } = [];

    public CaroState Clone() => new()
    {
        Size = Size,
        Cells = (int[])Cells.Clone(),
        CurrentPlayer = CurrentPlayer,
        Status = Status,
        Winner = Winner,
        LastIndex = LastIndex,
        WinningLine = [.. WinningLine],
    };
}

public static class CaroRules
{
    public static CaroState CreateInitial(int? size = null)
    {
        var boardSize = size ?? CaroBoardConfig.DefaultSize;
        if (boardSize < CaroBoardConfig.MinSize || boardSize > CaroBoardConfig.MaxSize)
        {
            throw new ArgumentOutOfRangeException(nameof(size), boardSize, "Kích thước bàn caro không hợp lệ.");
        }

        return new CaroState
        {
            Size = boardSize,
            Cells = new int[boardSize * boardSize],
        };
    }

    /// <summary>
    /// Fills a missing size from an older saved board without resizing a ván that already has one.
    /// </summary>
    public static void Normalize(CaroState state)
    {
        var size = ResolveSize(state);
        state.Size = size;
        var expected = size * size;
        if (state.Cells.Length == expected)
        {
            return;
        }

        var cells = new int[expected];
        Array.Copy(state.Cells, cells, Math.Min(state.Cells.Length, expected));
        state.Cells = cells;
    }

    public static int ResolveSize(CaroState state)
    {
        if (state.Size is >= CaroBoardConfig.MinSize and <= CaroBoardConfig.MaxSize
            && state.Cells.Length == state.Size * state.Size)
        {
            return state.Size;
        }

        var length = state.Cells.Length;
        var root = (int)Math.Sqrt(length);
        if (root is >= CaroBoardConfig.MinSize and <= CaroBoardConfig.MaxSize && root * root == length)
        {
            return root;
        }

        return CaroBoardConfig.DefaultSize;
    }

    public static int Other(int player) => player == CaroState.X ? CaroState.O : CaroState.X;

    public static string SideOf(int player) => player == CaroState.X ? "x" : "o";

    public static int PlayerOf(string? side) => side == "o" ? CaroState.O : CaroState.X;

    public static bool InBounds(CaroState state, int index)
    {
        Normalize(state);
        return index >= 0 && index < state.Size * state.Size;
    }

    public static string Coordinate(CaroState state, int index)
    {
        Normalize(state);
        var column = index % state.Size;
        var row = index / state.Size;
        return $"{(char)('a' + column)}{state.Size - row}";
    }

    public static string Describe(CaroState state, int player, int index) =>
        $"{(player == CaroState.X ? "X" : "O")} {Coordinate(state, index)}";

    public static IReadOnlyList<int> LegalMoves(CaroState state)
    {
        if (state.Status != "playing") return [];
        Normalize(state);
        var size = state.Size;
        var count = size * size;
        var occupied = new List<(int Row, int Col)>();
        for (var index = 0; index < count; index++)
        {
            if (state.Cells[index] != CaroState.Empty)
            {
                occupied.Add((index / size, index % size));
            }
        }

        if (occupied.Count == 0)
        {
            return [size / 2 * size + size / 2];
        }

        var moves = new List<int>();
        for (var index = 0; index < count; index++)
        {
            if (state.Cells[index] != CaroState.Empty) continue;
            var row = index / size;
            var column = index % size;
            if (occupied.Any(stone => Math.Max(Math.Abs(stone.Row - row), Math.Abs(stone.Col - column)) <= 2))
            {
                moves.Add(index);
            }
        }

        return moves;
    }

    public static bool WouldWin(CaroState state, int index, int player)
    {
        Normalize(state);
        if (index < 0 || index >= state.Cells.Length || state.Cells[index] != CaroState.Empty) return false;
        var cells = (int[])state.Cells.Clone();
        cells[index] = player;
        return WinningLine(cells, state.Size, index, player).Count > 0;
    }

    public static CaroState Place(CaroState state, int index, int player)
    {
        if (state.Status != "playing")
        {
            throw new InvalidOperationException("Ván đã kết thúc.");
        }

        if (player != state.CurrentPlayer)
        {
            throw new InvalidOperationException("Không phải lượt của bạn.");
        }

        Normalize(state);
        if (index < 0 || index >= state.Cells.Length || state.Cells[index] != CaroState.Empty)
        {
            throw new InvalidOperationException("Ô này không đặt được.");
        }

        var next = state.Clone();
        next.Cells[index] = player;
        next.LastIndex = index;
        var line = WinningLine(next.Cells, next.Size, index, player);
        if (line.Count > 0)
        {
            next.Status = "ended";
            next.Winner = SideOf(player);
            next.WinningLine = line.ToList();
            return next;
        }

        if (next.Cells.All(cell => cell != CaroState.Empty))
        {
            next.Status = "ended";
            next.Winner = "draw";
            next.WinningLine = [];
            return next;
        }

        next.CurrentPlayer = Other(player);
        next.WinningLine = [];
        return next;
    }

    public static IReadOnlyList<int> WinningLine(int[] cells, int index, int player) =>
        WinningLine(cells, (int)Math.Sqrt(cells.Length), index, player);

    /// <summary>
    /// A continuous run of at least five stones wins unless both ends are blocked.
    /// An end is blocked by an opponent stone or by the edge of the board.
    /// Each direction is judged on its own, so crossing wins still count.
    /// </summary>
    public static IReadOnlyList<int> WinningLine(int[] cells, int size, int index, int player)
    {
        if (size < CaroBoardConfig.MinSize || index < 0 || index >= size * size || cells.Length < size * size)
        {
            return [];
        }

        var row = index / size;
        var column = index % size;
        (int Row, int Column)[] directions = [(0, 1), (1, 0), (1, 1), (1, -1)];
        var wins = new List<int>();
        var seen = new HashSet<int>();
        foreach (var (dRow, dColumn) in directions)
        {
            if (!TryWinningRun(cells, size, row, column, dRow, dColumn, player, out var run))
            {
                continue;
            }

            foreach (var cell in run)
            {
                if (seen.Add(cell))
                {
                    wins.Add(cell);
                }
            }
        }

        return wins;
    }

    private static bool TryWinningRun(
        int[] cells,
        int size,
        int row,
        int column,
        int dRow,
        int dColumn,
        int player,
        out List<int> run)
    {
        var startRow = row;
        var startColumn = column;
        while (true)
        {
            var previousRow = startRow - dRow;
            var previousColumn = startColumn - dColumn;
            if (!Inside(previousRow, previousColumn, size) || cells[previousRow * size + previousColumn] != player)
            {
                break;
            }

            startRow = previousRow;
            startColumn = previousColumn;
        }

        run = [];
        var endRow = startRow;
        var endColumn = startColumn;
        while (Inside(endRow, endColumn, size) && cells[endRow * size + endColumn] == player)
        {
            run.Add(endRow * size + endColumn);
            endRow += dRow;
            endColumn += dColumn;
        }

        if (run.Count < CaroState.WinLength)
        {
            return false;
        }

        var startBlocked = IsBlocked(cells, size, startRow - dRow, startColumn - dColumn, player);
        var endBlocked = IsBlocked(cells, size, endRow, endColumn, player);
        return !(startBlocked && endBlocked);
    }

    private static bool IsBlocked(int[] cells, int size, int row, int column, int player)
    {
        if (!Inside(row, column, size))
        {
            return true;
        }

        var value = cells[row * size + column];
        return value != CaroState.Empty && value != player;
    }

    private static bool Inside(int row, int column, int size) =>
        row >= 0 && column >= 0 && row < size && column < size;
}
