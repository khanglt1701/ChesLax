namespace Cheslax.Domain;

public enum GameType
{
    Chess = 1,
    OAnQuan = 2,
    Caro = 3,
}

public static class GameTypeIds
{
    public const string Chess = "chess";
    public const string OAnQuan = "o-an-quan";
    public const string Caro = "caro";

    public static readonly GameType[] All = [GameType.Chess, GameType.OAnQuan, GameType.Caro];

    public static IReadOnlyList<string> AllIds { get; } = All.Select(game => game.ToId()).ToArray();

    public static string ToId(this GameType gameType) => gameType switch
    {
        GameType.Chess => Chess,
        GameType.OAnQuan => OAnQuan,
        GameType.Caro => Caro,
        _ => throw new ArgumentOutOfRangeException(nameof(gameType), gameType, "Unknown game type."),
    };

    public static bool TryParse(string? value, out GameType gameType)
    {
        switch (value?.Trim().ToLowerInvariant())
        {
            case Chess:
                gameType = GameType.Chess;
                return true;
            case OAnQuan:
            case "oanquan":
            case "o ăn quan":
                gameType = GameType.OAnQuan;
                return true;
            case Caro:
            case "cờ caro":
            case "co caro":
            case "gomoku":
                gameType = GameType.Caro;
                return true;
            default:
                gameType = default;
                return false;
        }
    }

    public static GameType Parse(string? value)
    {
        if (TryParse(value, out var gameType))
        {
            return gameType;
        }

        throw new ArgumentException($"Unknown game type '{value}'. Use '{Chess}', '{OAnQuan}', or '{Caro}'.", nameof(value));
    }
}
