namespace Quarry.Domain.Catalog;

public sealed class Framework
{
    public Guid Id { get; }
    public string Revision { get; } = "1";
    public FrameworkMetadata Metadata { get; }
    public int ComponentCount => Metadata.Components!.Count;

    private Framework(Guid id, FrameworkMetadata metadata)
    {
        Id = id;
        Metadata = metadata;
    }

    public static Framework CreateDraft(Guid id, FrameworkMetadata metadata)
    {
        var errors = new Dictionary<string, string[]>();
        if (id == Guid.Empty) errors["id"] = ["A nonempty framework ID is required."];
        if (!ValidText(metadata.Name, 200)) errors["name"] = ["Name must contain 1–200 characters."];
        if (!ValidText(metadata.Description, 4000)) errors["description"] = ["Description must contain 1–4000 characters."];
        if (metadata.Technology is not ("React" or "Angular" or "Vue" or "Web Components")) errors["technology"] = ["Select a supported technology."];
        if (!ValidTexts(metadata.Tags, 20, 100)) errors["tags"] = ["Supply 1–20 unique tags of 1–100 characters."];
        if (!ValidTexts(metadata.UseCases, 20, 200)) errors["useCases"] = ["Supply 1–20 unique use cases of 1–200 characters."];
        if (metadata.Capabilities is not { Count: > 0 and <= 50 } || metadata.Capabilities.Any(item => item is null || !ValidText(item.Id, 100) || !ValidText(item.Description, 1000))
            || metadata.Capabilities.Select(item => item!.Id!.Trim()).Distinct(StringComparer.Ordinal).Count() != metadata.Capabilities.Count)
            errors["capabilities"] = ["Supply 1–50 capabilities with unique IDs (1–100 characters) and descriptions (1–1000 characters)."];
        if (metadata.Components is not { Count: > 0 and <= 200 } || metadata.Components.Any(item => item is null || !ValidText(item.Id, 100) || !ValidText(item.Name, 200) || !ValidText(item.Description, 1000))
            || metadata.Components.Select(item => item!.Id!.Trim()).Distinct(StringComparer.Ordinal).Count() != metadata.Components.Count)
            errors["components"] = ["Supply 1–200 components with unique IDs, names, and descriptions within their limits."];
        if (errors.Count != 0) throw new FrameworkValidationException(errors);

        return new Framework(id, new FrameworkMetadata(metadata.Name!.Trim(), metadata.Description!.Trim(), metadata.Technology,
            Array.AsReadOnly(metadata.Tags!.Select(item => (string?)item!.Trim()).ToArray()),
            Array.AsReadOnly(metadata.Capabilities!.Select(item => (FrameworkCapabilityMetadata?)new FrameworkCapabilityMetadata(item!.Id!.Trim(), item.Description!.Trim())).ToArray()),
            Array.AsReadOnly(metadata.UseCases!.Select(item => (string?)item!.Trim()).ToArray()),
            Array.AsReadOnly(metadata.Components!.Select(item => (FrameworkComponentMetadata?)new FrameworkComponentMetadata(item!.Id!.Trim(), item.Name!.Trim(), item.Description!.Trim())).ToArray())));
    }

    private static bool ValidText(string? value, int maximum) => !string.IsNullOrWhiteSpace(value) && value.Trim().Length <= maximum;

    private static bool ValidTexts(IReadOnlyList<string?>? values, int count, int length) => values is { Count: > 0 }
        && values.Count <= count && values.All(value => ValidText(value, length))
        && values.Select(value => value!.Trim()).Distinct(StringComparer.Ordinal).Count() == values.Count;
}
