namespace Cheslax.GameEngine.CoGanh;

public static class CoGanhBoard
{
    public const int Size = 5;
    public const int Points = Size * Size;

    public static readonly int[][] Neighbors = BuildNeighbors();
    public static readonly IReadOnlyList<(int From, int To)> Edges = BuildEdges();

    public static readonly (int DRow, int DCol)[][] GanhAxes =
    [
        [(0, 1), (0, -1)],
        [(1, 0), (-1, 0)],
        [(1, 1), (-1, -1)],
        [(1, -1), (-1, 1)],
    ];

    public static readonly int[] RedStart =
    [
        IndexOf(4, 0), IndexOf(4, 1), IndexOf(4, 2), IndexOf(4, 3), IndexOf(4, 4),
        IndexOf(3, 0), IndexOf(3, 4), IndexOf(2, 0),
    ];

    public static readonly int[] BlueStart =
    [
        IndexOf(0, 0), IndexOf(0, 1), IndexOf(0, 2), IndexOf(0, 3), IndexOf(0, 4),
        IndexOf(1, 0), IndexOf(1, 4), IndexOf(2, 4),
    ];

    public static bool InBounds(int row, int col) => row is >= 0 and < Size && col is >= 0 and < Size;

    public static int IndexOf(int row, int col) => row * Size + col;

    public static int RowOf(int index) => index / Size;

    public static int ColOf(int index) => index % Size;

    public static bool HasDiagonals(int row, int col) => (row + col) % 2 == 0;

    public static bool AreAdjacent(int from, int to) =>
        from >= 0 && from < Points && Neighbors[from].Contains(to);

    public static int? NeighborInDirection(int from, int dRow, int dCol)
    {
        var row = RowOf(from) + dRow;
        var col = ColOf(from) + dCol;
        if (!InBounds(row, col)) return null;
        var index = IndexOf(row, col);
        return AreAdjacent(from, index) ? index : null;
    }

    public static string NameOf(int index)
    {
        var col = ColOf(index);
        var row = RowOf(index);
        return $"{(char)('a' + col)}{Size - row}";
    }

    public static int? Parse(string? name)
    {
        if (string.IsNullOrWhiteSpace(name) || name.Length != 2) return null;
        var col = char.ToLowerInvariant(name[0]) - 'a';
        var rank = name[1] - '0';
        var row = Size - rank;
        return InBounds(row, col) ? IndexOf(row, col) : null;
    }

    private static int[][] BuildNeighbors()
    {
        var ortho = new (int, int)[] { (0, 1), (0, -1), (1, 0), (-1, 0) };
        var diag = new (int, int)[] { (1, 1), (1, -1), (-1, 1), (-1, -1) };
        var all = new int[Points][];
        for (var index = 0; index < Points; index++)
        {
            var row = RowOf(index);
            var col = ColOf(index);
            var next = new List<int>(8);
            foreach (var (dRow, dCol) in ortho)
            {
                var rowTo = row + dRow;
                var colTo = col + dCol;
                if (InBounds(rowTo, colTo)) next.Add(IndexOf(rowTo, colTo));
            }

            if (HasDiagonals(row, col))
            {
                foreach (var (dRow, dCol) in diag)
                {
                    var rowTo = row + dRow;
                    var colTo = col + dCol;
                    if (InBounds(rowTo, colTo)) next.Add(IndexOf(rowTo, colTo));
                }
            }

            all[index] = [.. next];
        }

        return all;
    }

    private static IReadOnlyList<(int From, int To)> BuildEdges()
    {
        var edges = new List<(int, int)>();
        for (var from = 0; from < Points; from++)
        {
            foreach (var to in Neighbors[from])
            {
                if (from < to) edges.Add((from, to));
            }
        }

        return edges;
    }
}
