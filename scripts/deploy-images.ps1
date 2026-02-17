# Copies the latest N images from a source folder into the project's deploy/assets/images folder
# Usage:
#   .\scripts\deploy-images.ps1                # uses Downloads folder and copies 5 images
#   .\scripts\deploy-images.ps1 -SourceFolder 'C:\path\to\images' -Count 3

param(
    [string]$SourceFolder,
    [int]$Count = 5,
    [switch]$Force
)

$source = if ($SourceFolder) { $SourceFolder } else { Join-Path $env:USERPROFILE 'Downloads' }
$projectRoot = Split-Path -Parent $PSScriptRoot  # scripts folder parent
$deployImages = Join-Path $projectRoot 'deploy\assets\images'

# Create destination
New-Item -ItemType Directory -Force -Path $deployImages | Out-Null

# If destination already has enough images and the user did not request force, skip
$existing = Get-ChildItem -Path $deployImages -Include $exts -File -ErrorAction SilentlyContinue
if (-not $Force -and $existing -and $existing.Count -ge $Count) {
    Write-Host "Destination already contains $($existing.Count) image(s). No action taken. Use -Force to overwrite."
    exit 0
}

# Supported image extensions
$exts = '*.jpg','*.jpeg','*.png','*.gif','*.webp','*.bmp'

if (-not (Test-Path $source)) {
    Write-Host "Source folder not found: $source"
    exit 1
}

# Get latest N image files from source sorted by LastWriteTime
# Use a wildcard path so -Include works reliably for a single directory
$searchPath = Join-Path $source '*'
$files = Get-ChildItem -Path $searchPath -Include $exts -File -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First $Count

if (-not $files -or $files.Count -eq 0) {
    Write-Host "No image files found in $source"
    Write-Host "Tip: place JPG/PNG/GIF/WEBP/BMP files in that folder or call the script with -SourceFolder <path>"
    exit 1
}

# Copy them one by one and name them photo1..photoN preserving extension
$index = 1
foreach ($f in $files) {
    $ext = $f.Extension
    $dest = Join-Path $deployImages ("photo{0}{1}" -f $index, $ext)
    Copy-Item -Path $f.FullName -Destination $dest -Force
    Write-Host "Copied $($f.Name) -> $dest"
    $index++
}

Write-Host "Finished copying $($files.Count) files to $deployImages"
