namespace Cheslax.GameEngine.CoGanh;

public static class CoGanhSides
{
    public const int Empty = 0;
    public const int Red = 1;
    public const int Blue = 2;
    public const string RedId = "red";
    public const string BlueId = "blue";

    public static int ValueOf(string side) => side == BlueId ? Blue : Red;

    public static string IdOf(int value) => value == Blue ? BlueId : RedId;

    public static string Other(string side) => side == RedId ? BlueId : RedId;

    public static string Label(string side) => side == RedId ? "Đỏ" : "Xanh";
}

public sealed class CoGanhState
{
    public int[] Cells { get; set; } = new int[CoGanhBoard.Points];
    public string Turn { get; set; } = CoGanhSides.RedId;
    public string Status { get; set; } = "playing";
    public string? Winner { get; set; }
    public int? LastFrom { get; set; }
    public int? LastTo { get; set; }
    public List<int> Ganh { get; set; } = [];
    public List<int> Vay { get; set; } = [];
    public List<string> History { get; set; } = [];

    public CoGanhState Clone() => new()
    {
        Cells = (int[])Cells.Clone(),
        Turn = Turn,
        Status = Status,
        Winner = Winner,
        LastFrom = LastFrom,
        LastTo = LastTo,
        Ganh = [.. Ganh],
        Vay = [.. Vay],
        History = [.. History],
    };
}

public readonly record struct CoGanhMove(int From, int To);

public sealed record CoGanhMoveResult(
    CoGanhState State,
    int From,
    int To,
    IReadOnlyList<int> Ganh,
    IReadOnlyList<int> Vay,
    string Notation);
