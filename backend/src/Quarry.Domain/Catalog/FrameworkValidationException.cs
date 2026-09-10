namespace Quarry.Domain.Catalog;

public sealed class FrameworkValidationException : Exception
{
    public IReadOnlyDictionary<string, string[]> Errors { get; }

    public FrameworkValidationException(IReadOnlyDictionary<string, string[]> errors) : base("Framework metadata is invalid.")
    {
        Errors = errors;
    }
}
