Add-Type -AssemblyName System.Drawing

$srcDir = "c:\Users\Asus\OneDrive\Documents\Zyro Wears Webiste\Reviews"
$outDir = "c:\Users\Asus\OneDrive\Documents\Zyro Wears Webiste\Reviews_Cleaned"

if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Force -Path $outDir
}

$files = Get-ChildItem -Path $srcDir -Filter "*.jpeg"
foreach ($file in $files) {
    try {
        $img = [System.Drawing.Image]::FromFile($file.FullName)
        $w = $img.Width
        $h = $img.Height
        
        $topCrop = [int]($h * 0.14)
        $cropHeight = [int]($h * 0.76)
        
        $cropRect = New-Object System.Drawing.Rectangle(0, $topCrop, $w, $cropHeight)
        $target = New-Object System.Drawing.Bitmap($w, $cropHeight)
        $graphics = [System.Drawing.Graphics]::FromImage($target)
        $graphics.DrawImage($img, (New-Object System.Drawing.Rectangle(0, 0, $w, $cropHeight)), $cropRect, [System.Drawing.GraphicsUnit]::Pixel)
        
        $outPath = Join-Path $outDir $file.Name
        $target.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
        
        $graphics.Dispose()
        $target.Dispose()
        $img.Dispose()
        Write-Output "Cleaned: $($file.Name)"
    } catch {
        Write-Output "Error on $($file.Name): $_"
    }
}
