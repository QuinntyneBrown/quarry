namespace Quarry.Infrastructure.Persistence;

public sealed class FrameworkVectorEntity
{
    public Guid FrameworkId { get; set; }

    public string SourceRevision { get; set; } = "0";

    public string Model { get; set; } = string.Empty;

    public int Dimensions { get; set; }

    public string ValuesJson { get; set; } = "[]";

    public DateTimeOffset IndexedAtUtc { get; set; }
}
