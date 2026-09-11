// Acceptance Test
// Traces to: L2-003, L2-029, L2-041
// Description: Invalid metadata cannot create an aggregate; supported text remains inert data.
using Quarry.Domain.Catalog;

namespace Quarry.Api.AcceptanceTests;

public sealed class FrameworkMetadataValidationTests
{
    [Fact]
    public void RevisionStringsPreservePrecisionBeyondJavaScriptIntegerLimits()
    {
        var revised = Framework.ReviseDraft(Guid.NewGuid(), "9007199254740993", ValidMetadata());
        Assert.Equal("9007199254740994", revised.Revision);
        Assert.Throws<FrameworkValidationException>(() => Framework.ReviseDraft(Guid.NewGuid(), new string('9', 30), ValidMetadata()));
    }

    private static FrameworkMetadata ValidMetadata() => new("Fixture", "Documented controls", "React", ["forms"],
        [new("forms", "Data entry")], ["Internal tools"], [new("input", "Input", "Editable text")]);

    [Theory]
    [InlineData("name")]
    [InlineData("description")]
    [InlineData("components")]
    [InlineData("capabilities")]
    [InlineData("tags")]
    public void InvalidLimitsAndDuplicateIdentifiersAreReportedByField(string field)
    {
        var metadata = ValidMetadata();
        metadata = field switch
        {
            "name" => metadata with { Name = new string('n', 201) },
            "description" => metadata with { Description = new string('d', 4001) },
            "components" => metadata with { Components = [new("same", "Input", "Text"), new(" same ", "Button", "Action")] },
            "capabilities" => metadata with { Capabilities = [new("forms", "Text"), new("forms", "Other")] },
            "tags" => metadata with { Tags = ["forms", " forms "] },
            _ => throw new InvalidOperationException()
        };
        var error = Assert.Throws<FrameworkValidationException>(() => Framework.CreateDraft(Guid.NewGuid(), metadata));
        Assert.Contains(field, error.Errors.Keys);
    }

    [Theory]
    [InlineData("React")]
    [InlineData("Angular")]
    [InlineData("Vue")]
    [InlineData("Web Components")]
    public void SupportedTechnologiesAndLiteralTextArePreserved(string technology)
    {
        const string text = "<script>alert('literal')</script>; DROP TABLE catalog;";
        var framework = Framework.CreateDraft(Guid.NewGuid(), ValidMetadata() with { Technology = technology, Description = text });
        Assert.Equal(technology, framework.Metadata.Technology);
        Assert.Equal(text, framework.Metadata.Description);
    }

    // The following DesignSystemUri cases extend L2-003's metadata-validation coverage for a
    // framework's optional whole-app design-system iframe URL; no dedicated L2 ID exists yet.
    [Theory]
    [InlineData("design-systems/cornerstone/")]
    [InlineData("ftp://example.test/design-systems/cornerstone/")]
    [InlineData("http://example.test/design-systems/cornerstone/")]
    [InlineData("https://operator:secret@example.test/design-systems/cornerstone/")]
    public void InvalidDesignSystemUriIsRejected(string designSystemUri)
    {
        var error = Assert.Throws<FrameworkValidationException>(
            () => Framework.CreateDraft(Guid.NewGuid(), ValidMetadata() with { DesignSystemUri = designSystemUri }));
        Assert.Contains("designSystemUri", error.Errors.Keys);
    }

    [Theory]
    [InlineData("https://example.test/design-systems/cornerstone/")]
    [InlineData("http://localhost:4180/design-systems/cornerstone/")]
    [InlineData("http://127.0.0.1:4180/design-systems/cornerstone/")]
    public void ValidDesignSystemUriIsPreserved(string designSystemUri)
    {
        var framework = Framework.CreateDraft(Guid.NewGuid(), ValidMetadata() with { DesignSystemUri = designSystemUri });
        Assert.Equal(designSystemUri, framework.Metadata.DesignSystemUri);
    }

    [Fact]
    public void AbsentDesignSystemUriIsValid()
    {
        var framework = Framework.CreateDraft(Guid.NewGuid(), ValidMetadata());
        Assert.Null(framework.Metadata.DesignSystemUri);
    }
}
