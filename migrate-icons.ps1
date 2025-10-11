$files = Get-ChildItem -Path "src" -Recurse -Filter "*.tsx"

$count = 0
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    if ($content -match "from\s+['`"]lucide-react['`"]") {
        $newContent = $content -replace "from\s+['`"]lucide-react['`"]", "from '@/utils/iconMapper'"
        Set-Content -Path $file.FullName -Value $newContent -Encoding UTF8 -NoNewline
        Write-Host "✓ Migrated: $($file.FullName)"
        $count++
    }
}

Write-Host "`n✅ Migration complete! Migrated $count files."

