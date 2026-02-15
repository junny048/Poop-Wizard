param(
  [Parameter(Mandatory = $true)]
  [string]$ProjectId,
  [Parameter(Mandatory = $false)]
  [string]$FirebaseToken
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command firebase -ErrorAction SilentlyContinue)) {
  throw "firebase CLI not found. Install with: npm i -g firebase-tools"
}

if ($FirebaseToken) {
  $env:FIREBASE_TOKEN = $FirebaseToken
}

firebase deploy --only "firestore:rules,hosting" --project $ProjectId
