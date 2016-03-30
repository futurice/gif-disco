@echo off
setlocal ENABLEDELAYEDEXPANSION

set image=preview
set output_dir=chroma_test
set /a multiplier=0
set /a multiplier_decimal=5

del /q "%output_dir%\*.png"

:Chroma
echo m:!multiplier!.!multiplier_decimal!

%IMG%convert ^
  %image%.png ^
  -brightness-contrast 2 ^
  -fx 'r+b-!multiplier!.!multiplier_decimal!*g' ^
  -transparent black ^
  -alpha extract ^
  %output_dir%/m!multiplier!.!multiplier_decimal!.png
  
set /a multiplier_decimal=!multiplier_decimal! + 1
if !multiplier_decimal! lss 10 goto Chroma

set /a multiplier_decimal=0
set /a multiplier=!multiplier! + 1
if !multiplier! lss 2 goto Chroma

:Done
echo Done