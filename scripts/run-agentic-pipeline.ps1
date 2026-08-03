param(
  [string]$Story = "option-a"
)

$root = Split-Path -Parent $PSScriptRoot
$pipelineRoot = Join-Path $root "aegis/pipeline"

Write-Host "Agentic SDLC Pipeline" -ForegroundColor Cyan
Write-Host "Story track: $Story"

$envTemplate = Join-Path $pipelineRoot "pipeline.env.example"
if (Test-Path $envTemplate) {
  Write-Host "Use local env file based on: $envTemplate"
}

$stageFiles = @(
  "01-requirements-agent.md",
  "02-architecture-agent.md",
  "03-design-review-agent.md",
  "04-implementation-plan-agent.md",
  "05-implementation-agent.md",
  "06-review-agent.md",
  "07-verify-agent.md",
  "08-pr-agent.md"
)

foreach ($stage in $stageFiles) {
  $path = Join-Path $pipelineRoot "stages/$stage"
  if (Test-Path $path) {
    Write-Host "- $path"
  } else {
    Write-Host "- Missing stage file: $path" -ForegroundColor Yellow
  }
}

Write-Host "\nArtifacts:" -ForegroundColor Cyan
Get-ChildItem (Join-Path $pipelineRoot "artifacts") -File | ForEach-Object {
  Write-Host "- $($_.FullName)"
}

Write-Host "\nNext: Open each stage prompt in order and run it with Copilot Agent Mode." -ForegroundColor Green
