namespace Cheslax.GameEngine.CoGanh;

public static class CoGanhAi
{
    public static CoGanhMove ChooseMove(
        CoGanhState state,
        int depth,
        int noise,
        double blunderChance,
        CancellationToken cancellationToken)
    {
        if (state.Status != "playing")
        {
            throw new InvalidOperationException("Ván đã kết thúc.");
        }

        var legal = CoGanhRules.LegalMoves(state);
        if (legal.Count == 0)
        {
            throw new InvalidOperationException("Không còn nước đi.");
        }

        var scored = new List<(CoGanhMove Move, int Captures, CoGanhState Next, int Score)>(legal.Count);
        foreach (var move in legal)
        {
            cancellationToken.ThrowIfCancellationRequested();
            if (!CoGanhRules.TryMove(state, move.From, move.To, out var applied) || applied is null) continue;
            var captures = applied.Ganh.Count + applied.Vay.Count;
            scored.Add((move, captures, applied.State, Evaluate(applied.State, state.Turn, captures)));
        }

        var winning = scored.FirstOrDefault(item => item.Next.Status == "ended" && item.Next.Winner == state.Turn);
        if (winning.Next is not null) return winning.Move;

        var capturing = scored.Where(item => item.Captures > 0).OrderByDescending(item => item.Captures).ToList();
        if (capturing.Count > 0 && Random.Shared.NextDouble() >= blunderChance)
        {
            return capturing[0].Move;
        }

        var safe = scored.Where(item => OpponentBestCapture(item.Next) < 4).ToList();
        var pool = (safe.Count > 0 ? safe : scored)
            .Select(item => item with { Score = item.Score + (noise <= 0 ? 0 : Random.Shared.Next(-noise, noise + 1)) })
            .OrderByDescending(item => item.Score)
            .ToList();

        if (blunderChance > 0 && Random.Shared.NextDouble() < blunderChance)
        {
            return pool[Random.Shared.Next(Math.Min(pool.Count, 4))].Move;
        }

        if (depth <= 1) return pool[0].Move;

        var best = pool[0];
        foreach (var candidate in pool.Take(12))
        {
            cancellationToken.ThrowIfCancellationRequested();
            var score = candidate.Score - BestReply(candidate.Next);
            if (score > best.Score) best = candidate with { Score = score };
        }

        return best.Move;
    }

    private static int BestReply(CoGanhState state)
    {
        var best = int.MinValue;
        foreach (var move in CoGanhRules.LegalMoves(state))
        {
            if (!CoGanhRules.TryMove(state, move.From, move.To, out var applied) || applied is null) continue;
            var captures = applied.Ganh.Count + applied.Vay.Count;
            var score = applied.State.Status == "ended" ? 10_000 : Evaluate(applied.State, state.Turn, captures);
            if (score > best) best = score;
        }

        return best == int.MinValue ? 0 : best;
    }

    private static int OpponentBestCapture(CoGanhState state)
    {
        if (state.Status != "playing") return 0;
        var best = 0;
        foreach (var move in CoGanhRules.LegalMoves(state))
        {
            if (!CoGanhRules.TryMove(state, move.From, move.To, out var applied) || applied is null) continue;
            if (applied.State.Status == "ended") return 16;
            var captures = applied.Ganh.Count + applied.Vay.Count;
            if (captures > best) best = captures;
        }

        return best;
    }

    private static int Evaluate(CoGanhState state, string player, int captures)
    {
        if (state.Status == "ended")
        {
            return state.Winner == player ? 10_000 : -10_000;
        }

        var mine = CoGanhRules.PieceCount(state.Cells, player);
        var theirs = CoGanhRules.PieceCount(state.Cells, CoGanhSides.Other(player));
        var playerValue = CoGanhSides.ValueOf(player);
        var mobility = 0;
        var center = 0;
        for (var index = 0; index < CoGanhBoard.Points; index++)
        {
            if (state.Cells[index] != playerValue) continue;
            mobility += CoGanhBoard.Neighbors[index].Count(next => state.Cells[next] == CoGanhSides.Empty);
            if (index == 12) center += 6;
            else if (index is 6 or 7 or 8 or 11 or 13 or 16 or 17 or 18) center += 2;
        }

        return (mine - theirs) * 120 + captures * 80 + mobility * 3 + center;
    }
}
