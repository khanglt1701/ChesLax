namespace Cheslax.GameEngine.Xiangqi;

/// <summary>
/// Vietnamese Xiangqi (Cờ Tướng) rules used by Cheslax.
///
/// Board: 9 files × 10 ranks, pieces on intersections. Red starts at the bottom (rank 0)
/// and moves first. Coordinates are ICCS-style: files a–i, ranks 0–9 (red general starts on e0).
///
/// Variations vs some tournament rulebooks:
/// - Stalemate (困毙 / hết nước đi, không bị chiếu) is a loss for the side to move.
/// - Repeating the same position three times is a draw. Perpetual check / chase
///   distinctions from Asian Xiangqi Federation rules are not implemented.
/// - The opposing general cannot be captured as an ordinary move; check and checkmate are used instead.
/// </summary>
public sealed record XiangqiMoveResult(XiangqiPosition Position, string Notation, string From, string To, char? Captured);

public readonly record struct XiangqiLegalMove(string From, string To);

public sealed class XiangqiPosition
{
    public const int FileCount = 9;
    public const int RankCount = 10;
    public const int SquareCount = FileCount * RankCount;
    public const string StartingFen = "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR r";

    private static readonly int[] OrthoFiles = [1, -1, 0, 0];
    private static readonly int[] OrthoRanks = [0, 0, 1, -1];
    private static readonly (int Df, int Dr, int Bf, int Br)[] HorseDeltas =
    [
        (1, 2, 0, 1), (-1, 2, 0, 1), (1, -2, 0, -1), (-1, -2, 0, -1),
        (2, 1, 1, 0), (2, -1, 1, 0), (-2, 1, -1, 0), (-2, -1, -1, 0),
    ];
    private static readonly (int Df, int Dr, int Ef, int Er)[] ElephantDeltas =
    [
        (2, 2, 1, 1), (2, -2, 1, -1), (-2, 2, -1, 1), (-2, -2, -1, -1),
    ];

    internal char[] Squares { get; }
    public char Turn { get; private set; } = 'r';
    public List<string> History { get; }
    public List<string> PositionKeys { get; }

    public XiangqiPosition()
        : this(StartingFen, [], [])
    {
    }

    public XiangqiPosition(string fen)
        : this(fen, [], [])
    {
    }

    public XiangqiPosition(string fen, IEnumerable<string> history, IEnumerable<string> keys)
    {
        Squares = new char[SquareCount];
        History = [.. history];
        PositionKeys = [.. keys];
        ParseFen(fen);
        if (PositionKeys.Count == 0)
        {
            PositionKeys.Add(PositionKey());
        }
    }

    public string Fen
    {
        get
        {
            var parts = new List<string>(RankCount);
            for (var rank = RankCount - 1; rank >= 0; rank--)
            {
                var empty = 0;
                var row = "";
                for (var file = 0; file < FileCount; file++)
                {
                    var piece = Squares[Index(file, rank)];
                    if (piece == '\0')
                    {
                        empty++;
                        continue;
                    }

                    if (empty > 0)
                    {
                        row += empty;
                        empty = 0;
                    }

                    row += piece;
                }

                if (empty > 0) row += empty;
                parts.Add(row);
            }

            return $"{string.Join('/', parts)} {Turn}";
        }
    }

    public bool InCheck => IsKingAttacked(Turn);
    public bool IsCheckmate => InCheck && !HasLegalMove();
    public bool IsStalemate => !InCheck && !HasLegalMove();
    public bool IsThreefold => PositionKeys.Count(key => key == PositionKey()) >= 3;
    public bool IsGameOver => IsCheckmate || IsStalemate || IsThreefold;

    public string Status =>
        IsCheckmate ? "checkmate" :
        IsStalemate ? "stalemate" :
        IsThreefold ? "draw-threefold" :
        InCheck ? "check" :
        "playing";

    public XiangqiPosition Clone() => new(Fen, History, PositionKeys);

    public char PieceAt(string square) =>
        TryParseSquare(square, out var index) ? Squares[index] : '\0';

    public char PieceAt(int index) => index is >= 0 and < SquareCount ? Squares[index] : '\0';

    public int MaterialOn(int index)
    {
        var piece = Squares[index];
        if (piece == '\0') return 0;
        var value = PieceValue(piece);
        return char.IsUpper(piece) ? value : -value;
    }

    public bool TryMove(string from, string to, out XiangqiMoveResult? result)
    {
        result = null;
        if (!TryParseSquare(from, out var fromIndex) || !TryParseSquare(to, out var toIndex))
        {
            return false;
        }

        foreach (var move in GenerateLegalMoves())
        {
            if (move.From != from || move.To != to) continue;
            result = Apply(fromIndex, toIndex);
            return true;
        }

        return false;
    }

    public IReadOnlyList<XiangqiLegalMove> LegalMoves() => GenerateLegalMoves();

    public IReadOnlyList<XiangqiLegalMove> LegalMovesFrom(string from)
    {
        if (!TryParseSquare(from, out _)) return [];
        return GenerateLegalMoves().Where(move => move.From == from).ToList();
    }

    private XiangqiMoveResult Apply(int fromIndex, int toIndex)
    {
        var next = Clone();
        var piece = next.Squares[fromIndex];
        var captured = next.Squares[toIndex];
        next.Squares[fromIndex] = '\0';
        next.Squares[toIndex] = piece;
        var notation = Describe(piece, captured, fromIndex, toIndex);
        next.History.Add(notation);
        next.Turn = Opponent(Turn);
        next.PositionKeys.Add(next.PositionKey());
        return new XiangqiMoveResult(next, notation, NameOf(fromIndex), NameOf(toIndex), captured == '\0' ? null : captured);
    }

    private List<XiangqiLegalMove> GenerateLegalMoves()
    {
        var legal = new List<XiangqiLegalMove>();
        foreach (var move in GeneratePseudoMoves(Turn))
        {
            if (!TryParseSquare(move.From, out var fromIndex) || !TryParseSquare(move.To, out var toIndex))
            {
                continue;
            }

            var next = Clone();
            next.Squares[toIndex] = next.Squares[fromIndex];
            next.Squares[fromIndex] = '\0';
            if (next.IsKingAttacked(Turn)) continue;
            legal.Add(move);
        }

        return legal;
    }

    private bool HasLegalMove() => GenerateLegalMoves().Count > 0;

    private List<XiangqiLegalMove> GeneratePseudoMoves(char side)
    {
        var moves = new List<XiangqiLegalMove>();
        for (var index = 0; index < SquareCount; index++)
        {
            var piece = Squares[index];
            if (piece == '\0' || SideOf(piece) != side) continue;
            switch (char.ToLowerInvariant(piece))
            {
                case 'k':
                    AddGeneralMoves(moves, index, side);
                    break;
                case 'a':
                    AddAdvisorMoves(moves, index, side);
                    break;
                case 'b':
                    AddElephantMoves(moves, index, side);
                    break;
                case 'n':
                    AddHorseMoves(moves, index, side);
                    break;
                case 'r':
                    AddChariotMoves(moves, index, side);
                    break;
                case 'c':
                    AddCannonMoves(moves, index, side);
                    break;
                case 'p':
                    AddSoldierMoves(moves, index, side);
                    break;
            }
        }

        return moves;
    }

    private void AddGeneralMoves(List<XiangqiLegalMove> moves, int index, char side)
    {
        var file = FileOf(index);
        var rank = RankOf(index);
        for (var dir = 0; dir < 4; dir++)
        {
            var nextFile = file + OrthoFiles[dir];
            var nextRank = rank + OrthoRanks[dir];
            if (!InPalace(nextFile, nextRank, side)) continue;
            TryAddMove(moves, index, Index(nextFile, nextRank), side);
        }
    }

    private void AddAdvisorMoves(List<XiangqiLegalMove> moves, int index, char side)
    {
        var file = FileOf(index);
        var rank = RankOf(index);
        foreach (var (df, dr) in new[] { (1, 1), (1, -1), (-1, 1), (-1, -1) })
        {
            var nextFile = file + df;
            var nextRank = rank + dr;
            if (!InPalace(nextFile, nextRank, side)) continue;
            TryAddMove(moves, index, Index(nextFile, nextRank), side);
        }
    }

    private void AddElephantMoves(List<XiangqiLegalMove> moves, int index, char side)
    {
        var file = FileOf(index);
        var rank = RankOf(index);
        foreach (var (df, dr, ef, er) in ElephantDeltas)
        {
            var eyeFile = file + ef;
            var eyeRank = rank + er;
            var nextFile = file + df;
            var nextRank = rank + dr;
            if (!OnBoard(eyeFile, eyeRank) || Squares[Index(eyeFile, eyeRank)] != '\0') continue;
            if (!OnBoard(nextFile, nextRank) || !ElephantOnHome(nextRank, side)) continue;
            TryAddMove(moves, index, Index(nextFile, nextRank), side);
        }
    }

    private void AddHorseMoves(List<XiangqiLegalMove> moves, int index, char side)
    {
        var file = FileOf(index);
        var rank = RankOf(index);
        foreach (var (df, dr, bf, br) in HorseDeltas)
        {
            var blockFile = file + bf;
            var blockRank = rank + br;
            if (!OnBoard(blockFile, blockRank) || Squares[Index(blockFile, blockRank)] != '\0') continue;
            var nextFile = file + df;
            var nextRank = rank + dr;
            if (!OnBoard(nextFile, nextRank)) continue;
            TryAddMove(moves, index, Index(nextFile, nextRank), side);
        }
    }

    private void AddChariotMoves(List<XiangqiLegalMove> moves, int index, char side)
    {
        var file = FileOf(index);
        var rank = RankOf(index);
        for (var dir = 0; dir < 4; dir++)
        {
            var nextFile = file + OrthoFiles[dir];
            var nextRank = rank + OrthoRanks[dir];
            while (OnBoard(nextFile, nextRank))
            {
                var dest = Index(nextFile, nextRank);
                var occupant = Squares[dest];
                if (occupant == '\0')
                {
                    moves.Add(new XiangqiLegalMove(NameOf(index), NameOf(dest)));
                }
                else
                {
                    TryAddMove(moves, index, dest, side);
                    break;
                }

                nextFile += OrthoFiles[dir];
                nextRank += OrthoRanks[dir];
            }
        }
    }

    private void AddCannonMoves(List<XiangqiLegalMove> moves, int index, char side)
    {
        var file = FileOf(index);
        var rank = RankOf(index);
        for (var dir = 0; dir < 4; dir++)
        {
            var screens = 0;
            var nextFile = file + OrthoFiles[dir];
            var nextRank = rank + OrthoRanks[dir];
            while (OnBoard(nextFile, nextRank))
            {
                var dest = Index(nextFile, nextRank);
                var occupant = Squares[dest];
                if (occupant == '\0')
                {
                    if (screens == 0)
                    {
                        moves.Add(new XiangqiLegalMove(NameOf(index), NameOf(dest)));
                    }
                }
                else
                {
                    screens++;
                    if (screens == 2)
                    {
                        TryAddMove(moves, index, dest, side);
                        break;
                    }
                }

                nextFile += OrthoFiles[dir];
                nextRank += OrthoRanks[dir];
            }
        }
    }

    private void AddSoldierMoves(List<XiangqiLegalMove> moves, int index, char side)
    {
        var file = FileOf(index);
        var rank = RankOf(index);
        var forward = side == 'r' ? 1 : -1;
        var nextRank = rank + forward;
        if (OnBoard(file, nextRank))
        {
            TryAddMove(moves, index, Index(file, nextRank), side);
        }

        if (!CrossedRiver(rank, side)) return;
        if (OnBoard(file - 1, rank)) TryAddMove(moves, index, Index(file - 1, rank), side);
        if (OnBoard(file + 1, rank)) TryAddMove(moves, index, Index(file + 1, rank), side);
    }

    private void TryAddMove(List<XiangqiLegalMove> moves, int from, int to, char side)
    {
        var occupant = Squares[to];
        if (occupant != '\0' && SideOf(occupant) == side) return;
        if (char.ToLowerInvariant(occupant) == 'k') return;
        moves.Add(new XiangqiLegalMove(NameOf(from), NameOf(to)));
    }

    internal bool IsKingAttacked(char side)
    {
        var king = FindKing(side);
        return king >= 0 && IsSquareAttacked(king, Opponent(side));
    }

    private bool IsSquareAttacked(int target, char bySide)
    {
        var file = FileOf(target);
        var rank = RankOf(target);
        for (var index = 0; index < SquareCount; index++)
        {
            var piece = Squares[index];
            if (piece == '\0' || SideOf(piece) != bySide) continue;
            if (AttacksSquare(index, piece, file, rank, target)) return true;
        }

        return false;
    }

    private bool AttacksSquare(int from, char piece, int targetFile, int targetRank, int target)
    {
        var file = FileOf(from);
        var rank = RankOf(from);
        var side = SideOf(piece);
        switch (char.ToLowerInvariant(piece))
        {
            case 'k':
                if (Math.Abs(file - targetFile) + Math.Abs(rank - targetRank) == 1 && InPalace(targetFile, targetRank, side))
                {
                    return true;
                }

                return file == targetFile && PathClear(from, target) && char.ToLowerInvariant(Squares[target]) == 'k';
            case 'a':
                return Math.Abs(file - targetFile) == 1 && Math.Abs(rank - targetRank) == 1 && InPalace(targetFile, targetRank, side);
            case 'b':
                if (Math.Abs(file - targetFile) != 2 || Math.Abs(rank - targetRank) != 2) return false;
                if (!ElephantOnHome(targetRank, side)) return false;
                var eye = Index((file + targetFile) / 2, (rank + targetRank) / 2);
                return Squares[eye] == '\0';
            case 'n':
                foreach (var (df, dr, bf, br) in HorseDeltas)
                {
                    if (file + df != targetFile || rank + dr != targetRank) continue;
                    var block = Index(file + bf, rank + br);
                    return Squares[block] == '\0';
                }

                return false;
            case 'r':
                return (file == targetFile || rank == targetRank) && PathClear(from, target);
            case 'c':
                return (file == targetFile || rank == targetRank) && ScreensBetween(from, target) == 1;
            case 'p':
                var forward = side == 'r' ? 1 : -1;
                if (file == targetFile && targetRank == rank + forward) return true;
                return CrossedRiver(rank, side) && targetRank == rank && Math.Abs(targetFile - file) == 1;
            default:
                return false;
        }
    }

    private bool PathClear(int from, int to)
    {
        return ScreensBetween(from, to) == 0;
    }

    private int ScreensBetween(int from, int to)
    {
        var file = FileOf(from);
        var rank = RankOf(from);
        var targetFile = FileOf(to);
        var targetRank = RankOf(to);
        var df = Math.Sign(targetFile - file);
        var dr = Math.Sign(targetRank - rank);
        if (df != 0 && dr != 0) return -1;
        var screens = 0;
        var nextFile = file + df;
        var nextRank = rank + dr;
        while (nextFile != targetFile || nextRank != targetRank)
        {
            if (!OnBoard(nextFile, nextRank)) return -1;
            if (Squares[Index(nextFile, nextRank)] != '\0') screens++;
            nextFile += df;
            nextRank += dr;
        }

        return screens;
    }

    private int FindKing(char side)
    {
        var wanted = side == 'r' ? 'K' : 'k';
        for (var index = 0; index < SquareCount; index++)
        {
            if (Squares[index] == wanted) return index;
        }

        return -1;
    }

    private void ParseFen(string fen)
    {
        var parts = fen.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var board = parts[0];
        var ranks = board.Split('/');
        if (ranks.Length != RankCount)
        {
            throw new ArgumentException("Xiangqi FEN must contain 10 ranks.", nameof(fen));
        }

        for (var fenRank = 0; fenRank < RankCount; fenRank++)
        {
            var rank = RankCount - 1 - fenRank;
            var file = 0;
            foreach (var symbol in ranks[fenRank])
            {
                if (char.IsDigit(symbol))
                {
                    file += symbol - '0';
                    continue;
                }

                if (file >= FileCount) throw new ArgumentException("Xiangqi FEN rank is too long.", nameof(fen));
                Squares[Index(file, rank)] = symbol;
                file++;
            }

            if (file != FileCount) throw new ArgumentException("Xiangqi FEN rank is the wrong width.", nameof(fen));
        }

        Turn = parts.Length > 1 && parts[1].StartsWith('b') ? 'b' : 'r';
    }

    private string PositionKey()
    {
        var board = new char[SquareCount];
        for (var i = 0; i < SquareCount; i++)
        {
            board[i] = Squares[i] == '\0' ? '.' : Squares[i];
        }

        return $"{new string(board)} {Turn}";
    }

    private static string Describe(char piece, char captured, int from, int to)
    {
        var name = PieceName(piece);
        var separator = captured == '\0' ? "-" : "x";
        return $"{name} {NameOf(from)}{separator}{NameOf(to)}";
    }

    public static string PieceName(char piece) => char.ToLowerInvariant(piece) switch
    {
        'k' => "Tướng",
        'a' => "Sĩ",
        'b' => "Tượng",
        'n' => "Mã",
        'r' => "Xe",
        'c' => "Pháo",
        'p' => "Tốt",
        _ => piece.ToString(),
    };

    public static int PieceValue(char piece) => char.ToLowerInvariant(piece) switch
    {
        'k' => 10_000,
        'r' => 900,
        'c' => 450,
        'n' => 400,
        'a' => 200,
        'b' => 200,
        'p' => 100,
        _ => 0,
    };

    public static bool TryParseSquare(string value, out int index)
    {
        index = -1;
        if (string.IsNullOrWhiteSpace(value) || value.Length != 2) return false;
        var file = char.ToLowerInvariant(value[0]) - 'a';
        var rank = value[1] - '0';
        if (!OnBoard(file, rank)) return false;
        index = Index(file, rank);
        return true;
    }

    public static string NameOf(int index) => $"{(char)('a' + FileOf(index))}{RankOf(index)}";

    public static int Index(int file, int rank) => rank * FileCount + file;
    public static int FileOf(int index) => index % FileCount;
    public static int RankOf(int index) => index / FileCount;
    public static char Opponent(char side) => side == 'r' ? 'b' : 'r';
    public static char SideOf(char piece) => char.IsUpper(piece) ? 'r' : 'b';
    public static bool OnBoard(int file, int rank) => file is >= 0 and < FileCount && rank is >= 0 and < RankCount;
    public static bool InPalace(int file, int rank, char side) =>
        file is >= 3 and <= 5 && (side == 'r' ? rank is >= 0 and <= 2 : rank is >= 7 and <= 9);
    public static bool ElephantOnHome(int rank, char side) => side == 'r' ? rank <= 4 : rank >= 5;
    public static bool CrossedRiver(int rank, char side) => side == 'r' ? rank >= 5 : rank <= 4;
}
