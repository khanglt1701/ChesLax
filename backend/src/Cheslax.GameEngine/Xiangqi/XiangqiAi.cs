namespace Cheslax.GameEngine.Xiangqi;

/// <summary>
/// Alpha-beta search with capture quiescence. Strength comes from depth, node/time
/// caps, noise, and blunder chance — not from a measured Elo.
/// </summary>
public static class XiangqiAi
{
    private static readonly int[] SoldierAdvance =
    [
        0, 0, 0, 0, 0, 0, 0, 0, 0,
        10, 10, 12, 14, 16, 14, 12, 10, 10,
        14, 16, 18, 22, 26, 22, 18, 16, 14,
        18, 22, 26, 30, 34, 30, 26, 22, 18,
        22, 26, 32, 36, 40, 36, 32, 26, 22,
        28, 32, 38, 42, 48, 42, 38, 32, 28,
        32, 36, 42, 48, 54, 48, 42, 36, 32,
        18, 22, 26, 30, 34, 30, 26, 22, 18,
        8, 10, 12, 14, 16, 14, 12, 10, 8,
        0, 0, 0, 0, 0, 0, 0, 0, 0,
    ];

    private static readonly int[] HorsePst =
    [
        -20, -10, -8, -6, -6, -6, -8, -10, -20,
        -10, 0, 4, 6, 8, 6, 4, 0, -10,
        -8, 4, 10, 14, 16, 14, 10, 4, -8,
        -6, 6, 14, 18, 20, 18, 14, 6, -6,
        -6, 8, 16, 20, 22, 20, 16, 8, -6,
        -6, 8, 16, 20, 22, 20, 16, 8, -6,
        -6, 6, 14, 18, 20, 18, 14, 6, -6,
        -8, 4, 10, 14, 16, 14, 10, 4, -8,
        -10, 0, 4, 6, 8, 6, 4, 0, -10,
        -20, -10, -8, -6, -6, -6, -8, -10, -20,
    ];

    public static XiangqiLegalMove ChooseMove(
        XiangqiPosition position,
        int depth,
        int noise,
        double blunderChance,
        int maxNodes,
        int maxTimeMs,
        bool quiesce,
        CancellationToken cancellationToken = default)
    {
        var legal = position.LegalMoves();
        if (legal.Count == 0)
        {
            throw new InvalidOperationException("Không còn nước đi hợp lệ.");
        }

        if (blunderChance > 0 && Random.Shared.NextDouble() < blunderChance)
        {
            return legal[Random.Shared.Next(legal.Count)];
        }

        var ctx = new SearchContext
        {
            MaxNodes = Math.Max(64, maxNodes),
            Deadline = DateTime.UtcNow.AddMilliseconds(Math.Clamp(maxTimeMs, 50, 1_500)),
            Quiesce = quiesce,
        };
        var ply = Math.Clamp(depth, 1, 3);
        XiangqiLegalMove best = legal[0];
        var bestScore = int.MinValue;
        foreach (var move in OrderMoves(position, legal))
        {
            cancellationToken.ThrowIfCancellationRequested();
            if (!position.TryMove(move.From, move.To, out var applied) || applied is null)
            {
                continue;
            }

            var score = -Negamax(applied.Position, ply - 1, -30_000, 30_000, ctx, cancellationToken);
            if (noise > 0)
            {
                score += Random.Shared.Next(-noise, noise + 1);
            }

            if (score > bestScore)
            {
                bestScore = score;
                best = move;
            }
        }

        return best;
    }

    private static int Negamax(
        XiangqiPosition position,
        int depth,
        int alpha,
        int beta,
        SearchContext ctx,
        CancellationToken cancellationToken)
    {
        ctx.Nodes++;
        if (cancellationToken.IsCancellationRequested || ctx.Nodes >= ctx.MaxNodes || DateTime.UtcNow >= ctx.Deadline)
        {
            return Evaluate(position);
        }

        if (position.IsCheckmate || position.IsStalemate)
        {
            return -20_000 + (4 - depth);
        }

        if (position.IsThreefold)
        {
            return 0;
        }

        if (depth <= 0)
        {
            return ctx.Quiesce ? Quiesce(position, alpha, beta, 2, ctx, cancellationToken) : Evaluate(position);
        }

        var legal = position.LegalMoves();
        var best = int.MinValue / 4;
        foreach (var move in OrderMoves(position, legal))
        {
            if (!position.TryMove(move.From, move.To, out var applied) || applied is null)
            {
                continue;
            }

            var score = -Negamax(applied.Position, depth - 1, -beta, -alpha, ctx, cancellationToken);
            if (score > best) best = score;
            if (score > alpha) alpha = score;
            if (alpha >= beta) break;
        }

        return best;
    }

    private static int Quiesce(
        XiangqiPosition position,
        int alpha,
        int beta,
        int remain,
        SearchContext ctx,
        CancellationToken cancellationToken)
    {
        var stand = Evaluate(position);
        if (stand >= beta || remain <= 0 || ctx.Nodes >= ctx.MaxNodes)
        {
            return stand;
        }

        if (stand > alpha) alpha = stand;
        foreach (var move in position.LegalMoves())
        {
            cancellationToken.ThrowIfCancellationRequested();
            if (position.PieceAt(move.To) == '\0') continue;
            if (!position.TryMove(move.From, move.To, out var applied) || applied is null)
            {
                continue;
            }

            var score = -Quiesce(applied.Position, -beta, -alpha, remain - 1, ctx, cancellationToken);
            if (score >= beta) return score;
            if (score > alpha) alpha = score;
        }

        return alpha;
    }

    private static IEnumerable<XiangqiLegalMove> OrderMoves(XiangqiPosition position, IReadOnlyList<XiangqiLegalMove> legal)
    {
        return legal.OrderByDescending(move =>
        {
            var captured = position.PieceAt(move.To);
            return captured == '\0' ? 0 : XiangqiPosition.PieceValue(captured);
        });
    }

    private static int Evaluate(XiangqiPosition position)
    {
        var score = 0;
        var redMobility = 0;
        var blackMobility = 0;
        for (var i = 0; i < XiangqiPosition.SquareCount; i++)
        {
            var piece = position.PieceAt(i);
            if (piece == '\0') continue;
            var red = char.IsUpper(piece);
            var material = XiangqiPosition.PieceValue(piece);
            if (char.ToLowerInvariant(piece) == 'p' && XiangqiPosition.CrossedRiver(XiangqiPosition.RankOf(i), red ? 'r' : 'b'))
            {
                material += 40;
            }

            score += red ? material : -material;
            var pstIndex = red ? i : Mirror(i);
            var pst = char.ToLowerInvariant(piece) switch
            {
                'p' => SoldierAdvance[pstIndex],
                'n' => HorsePst[pstIndex],
                _ => 0,
            };
            score += red ? pst : -pst;
            if (char.ToLowerInvariant(piece) is 'r' or 'c' or 'n')
            {
                if (red) redMobility++;
                else blackMobility++;
            }
        }

        score += (redMobility - blackMobility) * 6;
        score += PalaceSafety(position, 'r') - PalaceSafety(position, 'b');
        return position.Turn == 'r' ? score : -score;
    }

    private static int PalaceSafety(XiangqiPosition position, char side)
    {
        var wanted = side == 'r' ? 'K' : 'k';
        var king = -1;
        for (var i = 0; i < XiangqiPosition.SquareCount; i++)
        {
            if (position.PieceAt(i) == wanted)
            {
                king = i;
                break;
            }
        }

        if (king < 0) return -800;
        var file = XiangqiPosition.FileOf(king);
        var rank = XiangqiPosition.RankOf(king);
        var safety = file == 4 ? 16 : 0;
        if (side == 'r' && rank == 0) safety += 8;
        if (side == 'b' && rank == 9) safety += 8;
        return safety;
    }

    private static int Mirror(int index)
    {
        var file = XiangqiPosition.FileOf(index);
        var rank = XiangqiPosition.RankOf(index);
        return XiangqiPosition.Index(file, 9 - rank);
    }

    private sealed class SearchContext
    {
        public int Nodes { get; set; }
        public int MaxNodes { get; set; }
        public DateTime Deadline { get; set; }
        public bool Quiesce { get; set; }
    }
}
