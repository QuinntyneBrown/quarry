// Acceptance Test
// Traces to: L2-003, L2-006, L2-028, L2-034, L2-040, L2-041
// Description: Only an explicit development command populates an isolated, labeled evaluation catalog.
using System.Diagnostics;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;

namespace Quarry.Api.AcceptanceTests;

public sealed class EvaluationSeedTests
{
    private static async Task<int> RunSeedAsync(string connection, string environment = "Development")
    {
        var start = new ProcessStartInfo("dotnet") { UseShellExecute = false, CreateNoWindow = true, RedirectStandardOutput = true, RedirectStandardError = true };
        start.ArgumentList.Add(typeof(Program).Assembly.Location);
        start.ArgumentList.Add("--seed-evaluation=true");
        start.ArgumentList.Add("--urls=http://127.0.0.1:0");
        start.Environment["ASPNETCORE_ENVIRONMENT"] = environment;
        start.Environment["DOTNET_ENVIRONMENT"] = environment;
        start.Environment["ConnectionStrings__QuarryEvaluation"] = connection;
        using var process = Process.Start(start)!;
        var output = process.StandardOutput.ReadToEndAsync();
        var error = process.StandardError.ReadToEndAsync();
        using var deadline = new CancellationTokenSource(TimeSpan.FromSeconds(10));
        try { await process.WaitForExitAsync(deadline.Token); }
        catch (OperationCanceledException) { process.Kill(entireProcessTree: true); await process.WaitForExitAsync(); }
        await Task.WhenAll(output, error);
        Assert.False(deadline.IsCancellationRequested, "The seed command must finish instead of starting an API server.");
        return process.ExitCode;
    }

    [SqlServerFact]
    public async Task ExplicitSeedPublishesEightLabeledFixturesAndIsIdempotent()
    {
        await using var fixture = await SqlMaintenanceFixture.CreateAsync(evaluation: true);
        await using var database = fixture.CreateContext();
        Assert.Empty(await database.FrameworkRevisions.ToListAsync());
        Assert.Equal(0, await RunSeedAsync(database.Database.GetConnectionString()!));
        var entries = await database.FrameworkRevisions.AsNoTracking().ToListAsync();
        Assert.Equal(8, entries.Count);
        Assert.All(entries, entry => { Assert.True(entry.IsPublished); Assert.EndsWith("(evaluation)", entry.Name); Assert.Equal("1", entry.Revision); });
        Assert.Equal(8, await database.PublishedFrameworkSnapshots.CountAsync());
        Assert.Equal(8, await database.IndexWorkItems.CountAsync());
        Assert.Empty(await database.FrameworkVectors.ToListAsync());
        var audit = await database.MaintenanceAuditRecords.SingleAsync();
        Assert.Equal("evaluation-seed", audit.Operation);
        using var evidence = JsonDocument.Parse((await database.PublishedFrameworkSnapshots.FirstAsync()).EvidenceJson);
        Assert.Equal("illustrative-evaluation-fixture", evidence.RootElement.GetProperty("kind").GetString());
        var revision = (await database.CatalogState.AsNoTracking().SingleAsync()).Revision;
        Assert.Equal(1, revision);
        Assert.Equal(0, await RunSeedAsync(database.Database.GetConnectionString()!));
        Assert.Equal(8, await database.IndexWorkItems.CountAsync());
        Assert.Equal(1, await database.MaintenanceAuditRecords.CountAsync());
        Assert.Equal(revision, (await database.CatalogState.AsNoTracking().SingleAsync()).Revision);
    }

    [SqlServerFact]
    public async Task ProductionAndNonEvaluationDatabasesRejectSeedWithoutWrites()
    {
        await using var fixture = await SqlMaintenanceFixture.CreateAsync(evaluation: true);
        await using var database = fixture.CreateContext();
        Assert.NotEqual(0, await RunSeedAsync(database.Database.GetConnectionString()!, "Production"));
        Assert.Empty(await database.FrameworkRevisions.ToListAsync());
        await using var ordinary = await SqlMaintenanceFixture.CreateAsync();
        await using var ordinaryDatabase = ordinary.CreateContext();
        Assert.NotEqual(0, await RunSeedAsync(ordinaryDatabase.Database.GetConnectionString()!));
        Assert.Empty(await ordinaryDatabase.FrameworkRevisions.ToListAsync());
    }
}
