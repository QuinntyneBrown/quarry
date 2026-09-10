[CmdletBinding()]
param(
    [string]$SqlTestConnection = $env:QUARRY_TEST_SQL,
    [string]$OutputDirectory = (Join-Path $PSScriptRoot '../test-results/relevance')
)

$ErrorActionPreference = 'Stop'
if ([string]::IsNullOrWhiteSpace($SqlTestConnection)) {
    throw 'Set QUARRY_TEST_SQL to an isolated-test SQL Server instance with database-create permission.'
}
$repository = Split-Path $PSScriptRoot -Parent
$runDirectory = Join-Path ([System.IO.Path]::GetFullPath($OutputDirectory)) ([DateTime]::UtcNow.ToString('yyyyMMddTHHmmss') + '-' + [Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $runDirectory -Force | Out-Null
$previousSql = $env:QUARRY_TEST_SQL
$previousOllama = $env:QUARRY_TEST_OLLAMA
$previousReport = $env:QUARRY_EVALUATION_REPORT
try {
    $env:QUARRY_TEST_SQL = $SqlTestConnection
    $env:QUARRY_TEST_OLLAMA = '1'
    $env:QUARRY_EVALUATION_REPORT = Join-Path $runDirectory 'relevance.json'
    git -C $repository rev-parse HEAD | Set-Content -LiteralPath (Join-Path $runDirectory 'commit.txt')
    dotnet test (Join-Path $repository 'backend/tests/Quarry.Api.AcceptanceTests/Quarry.Api.AcceptanceTests.csproj') --configuration Release --filter 'FullyQualifiedName~RealRelevanceEvaluationTests' --logger 'trx;LogFileName=relevance.trx' --results-directory $runDirectory
    $testExit = $LASTEXITCODE
    [xml]$trx = Get-Content -LiteralPath (Join-Path $runDirectory 'relevance.trx') -Raw
    $counters = $trx.TestRun.ResultSummary.Counters
    if ([int]$counters.total -ne 1 -or [int]$counters.executed -ne 1) {
        throw 'The real-model evaluation must execute exactly one test; skipped or missing tests cannot pass.'
    }
    if ($testExit -ne 0) { throw "Real-model relevance failed. Evidence: $runDirectory" }
    $report = Get-Content -LiteralPath $env:QUARRY_EVALUATION_REPORT -Raw | ConvertFrom-Json
    if (-not $report.passed -or @($report.queries).Count -ne 6 -or @($report.queries | Where-Object { -not $_.passed }).Count -ne 0) {
        throw 'All six relevance judgments must be present and pass.'
    }
    Write-Output "Real-model relevance passed. Evidence: $runDirectory"
} finally {
    $env:QUARRY_TEST_SQL = $previousSql
    $env:QUARRY_TEST_OLLAMA = $previousOllama
    $env:QUARRY_EVALUATION_REPORT = $previousReport
}
