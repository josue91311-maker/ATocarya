Add-Type -AssemblyName System.Drawing

$srcPath = Join-Path (Get-Location) "logooficial.jpg"
$src = [System.Drawing.Bitmap]::FromFile($srcPath)
Write-Host "Source image size: $($src.Width)x$($src.Height)"

# Find vertical white gap between the icon and the text "ATocarYa"
# Look between X=330 and X=410 for the column with minimum dark pixels
$minCol = 400
$minDark = 9999
for ($x = 330; $x -le 400; $x++) {
    $darkCount = 0
    for ($y = 0; $y -lt $src.Height; $y++) {
        $c = $src.GetPixel($x, $y)
        if ($c.R -lt 240 -or $c.G -lt 240 -or $c.B -lt 240) {
            $darkCount++
        }
    }
    if ($darkCount -lt $minDark) {
        $minDark = $darkCount
        $minCol = $x
    }
}
Write-Host "Column divider between icon and text found at X = $minCol (dark pixels: $minDark)"

# Now find exact bounding box of icon strictly on the left of $minCol
$minX = $src.Width
$minY = $src.Height
$maxX = 0
$maxY = 0

for ($y = 0; $y -lt $src.Height; $y++) {
    for ($x = 0; $x -lt $minCol; $x++) {
        $c = $src.GetPixel($x, $y)
        if ($c.R -lt 245 -or $c.G -lt 245 -or $c.B -lt 245) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

Write-Host "True Icon bounds: X: $minX to $maxX, Y: $minY to $maxY"
$iconW = $maxX - $minX
$iconH = $maxY - $minY
Write-Host "True Icon size: ${iconW}x${iconH}"

# Create a square centered crop with 6% margin
$maxDim = [Math]::Max($iconW, $iconH)
$pad = [int]($maxDim * 0.06)
$cropSize = $maxDim + ($pad * 2)

$centerX = [int](($minX + $maxX) / 2)
$centerY = [int](($minY + $maxY) / 2)

$cropX = [Math]::Max(0, [int]($centerX - ($cropSize / 2)))
$cropY = [Math]::Max(0, [int]($centerY - ($cropSize / 2)))
if ($cropX + $cropSize -gt $minCol) {
    $cropX = $minCol - $cropSize
}

$cropRect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropSize, $cropSize)
Write-Host "Crop rectangle: X: $cropX, Y: $cropY, Size: $cropSize"

$iconsDir = Join-Path (Get-Location) "public\icons"

# 1. Generate 512x512
$bmp512 = New-Object System.Drawing.Bitmap 512, 512
$g512 = [System.Drawing.Graphics]::FromImage($bmp512)
$g512.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g512.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g512.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g512.Clear([System.Drawing.Color]::White)
$destRect512 = New-Object System.Drawing.Rectangle(20, 20, 472, 472)
$g512.DrawImage($src, $destRect512, $cropRect, [System.Drawing.GraphicsUnit]::Pixel)
$out512 = Join-Path $iconsDir "icon-512x512.png"
$bmp512.Save($out512, [System.Drawing.Imaging.ImageFormat]::Png)
$g512.Dispose()
$bmp512.Dispose()

# 2. Generate 192x192
$bmp192 = New-Object System.Drawing.Bitmap 192, 192
$g192 = [System.Drawing.Graphics]::FromImage($bmp192)
$g192.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g192.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g192.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g192.Clear([System.Drawing.Color]::White)
$destRect192 = New-Object System.Drawing.Rectangle(8, 8, 176, 176)
$g192.DrawImage($src, $destRect192, $cropRect, [System.Drawing.GraphicsUnit]::Pixel)
$out192 = Join-Path $iconsDir "icon-192x192.png"
$bmp192.Save($out192, [System.Drawing.Imaging.ImageFormat]::Png)
$g192.Dispose()
$bmp192.Dispose()

# 3. Generate Maskable 512x512 (Safe-zone central)
$bmpMask = New-Object System.Drawing.Bitmap 512, 512
$gMask = [System.Drawing.Graphics]::FromImage($bmpMask)
$gMask.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gMask.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$gMask.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$gMask.Clear([System.Drawing.Color]::White)
$destRectMask = New-Object System.Drawing.Rectangle(64, 64, 384, 384)
$gMask.DrawImage($src, $destRectMask, $cropRect, [System.Drawing.GraphicsUnit]::Pixel)
$outMask = Join-Path $iconsDir "icon-maskable-512x512.png"
$bmpMask.Save($outMask, [System.Drawing.Imaging.ImageFormat]::Png)
$gMask.Dispose()
$bmpMask.Dispose()

# 4. Apple Touch Icon 180x180
$bmpApple = New-Object System.Drawing.Bitmap 180, 180
$gApple = [System.Drawing.Graphics]::FromImage($bmpApple)
$gApple.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gApple.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$gApple.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$gApple.Clear([System.Drawing.Color]::White)
$destRectApple = New-Object System.Drawing.Rectangle(8, 8, 164, 164)
$gApple.DrawImage($src, $destRectApple, $cropRect, [System.Drawing.GraphicsUnit]::Pixel)
$outApple = Join-Path (Get-Location) "public\apple-touch-icon.png"
$bmpApple.Save($outApple, [System.Drawing.Imaging.ImageFormat]::Png)
$gApple.Dispose()
$bmpApple.Dispose()

$src.Dispose()
Write-Host "Clean isolated icon successfully generated!"
