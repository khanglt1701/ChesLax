using Cheslax.Domain;

namespace Cheslax.UnitTests;

public class GameTypeTests
{
    [Theory]
    [InlineData("chess", GameType.Chess)]
    [InlineData("o-an-quan", GameType.OAnQuan)]
    [InlineData("caro", GameType.Caro)]
    [InlineData("co-tuong", GameType.CoTuong)]
    [InlineData("co-ganh", GameType.CoGanh)]
    public void Parses_canonical_ids(string id, GameType expected)
    {
        Assert.True(GameTypeIds.TryParse(id, out var gameType));
        Assert.Equal(expected, gameType);
        Assert.Equal(id, gameType.ToId());
    }
}
