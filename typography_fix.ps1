
$srcDir = "E:\BACK_UP_14-05-2026\BachatKaro_V6-SMS\src"
$files = Get-ChildItem -Path $srcDir -Recurse -Include *.ts,*.tsx

$count10px = 0
$count11px = 0
$countTracking = 0
$modifiedFiles = 0

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    if ([string]::IsNullOrWhiteSpace($content)) {
        continue
    }
    $originalContent = $content
    $modified = $false

    # Count occurrences for summary
    $matches10 = ([regex]::Matches($content, [regex]::Escape('text-[10px]'))).Count
    $matches11 = ([regex]::Matches($content, [regex]::Escape('text-[11px]'))).Count
    $matchesTrack = ([regex]::Matches($content, [regex]::Escape('tracking-widest'))).Count

    if ($matches10 -gt 0) {
        $content = $content.Replace('text-[10px]', 'text-xs')
        $count10px += $matches10
        $modified = $true
    }
    if ($matches11 -gt 0) {
        $content = $content.Replace('text-[11px]', 'text-xs')
        $count11px += $matches11
        $modified = $true
    }
    if ($matchesTrack -gt 0) {
        $content = $content.Replace('tracking-widest', 'tracking-wider')
        $countTracking += $matchesTrack
        $modified = $true
    }

    if ($modified) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $modifiedFiles++
    }
}

Write-Host "Typography Correction Summary:"
Write-Host "----------------------------"
Write-Host "Total Files Modified: $modifiedFiles"
Write-Host "Total 'text-[10px]' -> 'text-xs' replacements: $count10px"
Write-Host "Total 'text-[11px]' -> 'text-xs' replacements: $count11px"
Write-Host "Total 'tracking-widest' -> 'tracking-wider' replacements: $countTracking"
