# Local operator credential helper. Signing material stays in the caller's environment.
[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidateNotNullOrEmpty()]
    [string] $Subject,

    [ValidateRange(1, 60)]
    [int] $LifetimeMinutes = 15
)

$ErrorActionPreference = 'Stop'
if ([string]::IsNullOrWhiteSpace($Subject)) { throw 'Subject must identify the operator.' }
$keyBytes = [Text.Encoding]::UTF8.GetBytes([string]$env:Jwt__SigningKey)
if ($keyBytes.Length -lt 32) { throw 'Set Jwt__SigningKey to a private key containing at least 32 UTF-8 bytes.' }
$issuer = if ($env:Jwt__Issuer) { $env:Jwt__Issuer } else { 'Quarry' }
$audience = if ($env:Jwt__Audience) { $env:Jwt__Audience } else { 'Quarry.Maintenance' }

function ConvertTo-Base64Url([byte[]] $Bytes) {
    [Convert]::ToBase64String($Bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
}

$now = [DateTimeOffset]::UtcNow
$header = ConvertTo-Base64Url ([Text.Encoding]::UTF8.GetBytes('{"alg":"HS256","typ":"JWT"}'))
$claims = [ordered]@{
    iss = $issuer
    aud = $audience
    sub = $Subject
    permission = 'maintenance'
    iat = $now.ToUnixTimeSeconds()
    nbf = $now.ToUnixTimeSeconds()
    exp = $now.AddMinutes($LifetimeMinutes).ToUnixTimeSeconds()
    jti = [Guid]::NewGuid().ToString('D')
}
$payload = ConvertTo-Base64Url ([Text.Encoding]::UTF8.GetBytes(($claims | ConvertTo-Json -Compress)))
$unsigned = "$header.$payload"
$hmac = [Security.Cryptography.HMACSHA256]::new($keyBytes)
try {
    $signature = ConvertTo-Base64Url ($hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes($unsigned)))
    "$unsigned.$signature"
}
finally {
    $hmac.Dispose()
    [Array]::Clear($keyBytes, 0, $keyBytes.Length)
}
