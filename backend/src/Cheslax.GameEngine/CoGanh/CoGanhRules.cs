namespace Cheslax.GameEngine.CoGanh;

public static class CoGanhRules
{
    public static CoGanhState CreateInitial()
    {
        var cells = new int[CoGanhBoard.Points];
        foreach (var index in CoGanhBoard.RedStart) cells[index] = CoGanhSides.Red;
        foreach (var index in CoGanhBoard.BlueStart) cells[index] = CoGanhSides.Blue;
        return new CoGanhState { Cells = cells };
    }

    public static int PieceCount(int[] cells, string side)
    {
        var value = CoGanhSides.ValueOf(side);
        return cells.Count(cell => cell == value);
    }

    public static List<int> DetectGanhs(int[] cells, int landing, string player)
    {
        var opponent = CoGanhSides.ValueOf(CoGanhSides.Other(player));
        var captured = new List<int>();
        foreach (var axis in CoGanhBoard.GanhAxes)
        {
            var left = CoGanhBoard.NeighborInDirection(landing, axis[0].DRow, axis[0].DCol);
            var right = CoGanhBoard.NeighborInDirection(landing, axis[1].DRow, axis[1].DCol);
            if (left is null || right is null) continue;
            if (cells[left.Value] == opponent && cells[right.Value] == opponent)
            {
                captured.Add(left.Value);
                captured.Add(right.Value);
            }
        }

        return captured;
    }

    public static IReadOnlyList<CoGanhMove> LegalMoves(CoGanhState state, int? from = null)
    {
        if (state.Status != "playing") return [];
        var player = CoGanhSides.ValueOf(state.Turn);
        if (from is int origin)
        {
            if (origin < 0 || origin >= CoGanhBoard.Points || state.Cells[origin] != player) return [];
            return CoGanhBoard.Neighbors[origin]
                .Where(to => state.Cells[to] == CoGanhSides.Empty)
                .Select(to => new CoGanhMove(origin, to))
                .ToList();
        }

        var moves = new List<CoGanhMove>();
        for (var index = 0; index < CoGanhBoard.Points; index++)
        {
            if (state.Cells[index] != player) continue;
            foreach (var to in CoGanhBoard.Neighbors[index])
            {
                if (state.Cells[to] == CoGanhSides.Empty) moves.Add(new CoGanhMove(index, to));
            }
        }

        return moves;
    }

    public static bool IsLegal(CoGanhState state, int from, int to) => IllegalReason(state, from, to) is null;

    public static CoGanhState ApplyMove(CoGanhState state, int from, int to)
    {
        if (!TryMove(state, from, to, out var applied) || applied is null)
        {
            throw new InvalidOperationException(IllegalReason(state, from, to) ?? "Nước đi không hợp lệ.");
        }

        return applied.State;
    }

    public static bool TryMove(CoGanhState state, int from, int to, out CoGanhMoveResult? result)
    {
        var reason = IllegalReason(state, from, to);
        if (reason is not null)
        {
            result = null;
            return false;
        }

        var player = state.Turn;
        var cells = (int[])state.Cells.Clone();
        cells[to] = cells[from];
        cells[from] = CoGanhSides.Empty;

        var ganh = DetectGanhs(cells, to, player).Distinct().ToList();
        var playerValue = CoGanhSides.ValueOf(player);
        foreach (var index in ganh) cells[index] = playerValue;

        var vay = CoGanhVay.Detect(cells, player).Distinct().ToList();
        foreach (var index in vay) cells[index] = playerValue;

        var opponent = CoGanhSides.Other(player);
        var ended = PieceCount(cells, opponent) == 0;
        var notation = Describe(player, from, to, ganh.Count, vay.Count);
        var next = new CoGanhState
        {
            Cells = cells,
            Turn = ended ? player : opponent,
            Status = ended ? "ended" : "playing",
            Winner = ended ? player : null,
            LastFrom = from,
            LastTo = to,
            Ganh = ganh,
            Vay = vay,
            History = [.. state.History, notation],
        };
        result = new CoGanhMoveResult(next, from, to, ganh, vay, notation);
        return true;
    }

    public static string? WinnerOf(CoGanhState state) => state.Status == "ended" ? state.Winner : null;

    public static string Describe(string side, int from, int to, int ganhCount, int vayCount)
    {
        var tags = new List<string>();
        if (ganhCount > 0) tags.Add($"Gánh {ganhCount}");
        if (vayCount > 0) tags.Add($"Vây {vayCount}");
        var extra = tags.Count == 0 ? "" : $" ({string.Join(", ", tags)})";
        return $"{CoGanhSides.Label(side)} {CoGanhBoard.NameOf(from)}-{CoGanhBoard.NameOf(to)}{extra}";
    }

    public static string ResultLabel(CoGanhState state)
    {
        if (state.Status == "ended" && state.Winner is not null)
        {
            return $"{CoGanhSides.Label(state.Winner)} thắng — chiếm toàn bộ quân đối phương";
        }

        return $"Lượt {CoGanhSides.Label(state.Turn)} · Đỏ {PieceCount(state.Cells, CoGanhSides.RedId)} — Xanh {PieceCount(state.Cells, CoGanhSides.BlueId)}";
    }

    public static string PlayerOf(string side) =>
        side is CoGanhSides.BlueId or "b" ? CoGanhSides.BlueId : CoGanhSides.RedId;

    private static string? IllegalReason(CoGanhState state, int from, int to)
    {
        if (state.Status != "playing") return "Ván đã kết thúc.";
        if (from < 0 || from >= CoGanhBoard.Points || to < 0 || to >= CoGanhBoard.Points) return "Giao điểm không tồn tại.";
        if (state.Cells[from] != CoGanhSides.ValueOf(state.Turn)) return "Không phải quân của bạn.";
        if (state.Cells[to] != CoGanhSides.Empty) return "Giao điểm này đã có quân.";
        if (!CoGanhBoard.AreAdjacent(from, to)) return "Hai giao điểm không nối trực tiếp.";
        return null;
    }
}
