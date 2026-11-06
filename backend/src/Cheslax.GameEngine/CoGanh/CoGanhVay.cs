namespace Cheslax.GameEngine.CoGanh;

public static class CoGanhVay
{
    /// <summary>
    /// Converts opponent groups that have no empty adjacent point along the board graph.
    /// Connected defender pieces share liberties. A piece blocked in only one direction is not Vây.
    /// </summary>
    public static List<int> Detect(int[] cells, string attacker)
    {
        var defender = CoGanhSides.ValueOf(CoGanhSides.Other(attacker));
        var seen = new bool[CoGanhBoard.Points];
        var captured = new List<int>();

        for (var index = 0; index < CoGanhBoard.Points; index++)
        {
            if (cells[index] != defender || seen[index]) continue;
            var group = new List<int>();
            var stack = new Stack<int>();
            stack.Push(index);
            seen[index] = true;
            var liberties = 0;

            while (stack.Count > 0)
            {
                var current = stack.Pop();
                group.Add(current);
                foreach (var next in CoGanhBoard.Neighbors[current])
                {
                    var occupant = cells[next];
                    if (occupant == CoGanhSides.Empty)
                    {
                        liberties++;
                    }
                    else if (occupant == defender && !seen[next])
                    {
                        seen[next] = true;
                        stack.Push(next);
                    }
                }
            }

            if (liberties == 0) captured.AddRange(group);
        }

        return captured;
    }

    public static bool HasLiberty(int[] cells, int index) =>
        CoGanhBoard.Neighbors[index].Any(next => cells[next] == CoGanhSides.Empty);
}
