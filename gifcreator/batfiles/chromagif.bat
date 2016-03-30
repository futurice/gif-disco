@echo off
setlocal ENABLEDELAYEDEXPANSION

set vdub="C:\tools\VirtualDub-1.9.11\vdub"
set ffmpeg="C:\tools\ffmpeg\bin\ffmpeg"
set device="Logitech Webcam 600"
rem set device="FaceTime HD"
set filename=preview
set bg=bg
set input_dir=frames
set temp_dir=temp
set output_dir=disco
rem set output_dir="C:\gifaccepter\static\img"
set output_name=

set size=320x240
set rotate=-90
set crop=319x239+0+0
rem set crop=100x200+0+50
set /a skip=2

rem cd C:\chromagif

del /q "%input_dir%\*.png"
del /q "%temp_dir%\*.png"

goto Animation

echo Capturing...

%vdub% /capture /capdevice %device% /capfile "%filename%.avi" /capstart 2s

if "%1"=="" goto Animation

:Background
echo Extracting background...

%ffmpeg% -i "%filename%.avi" -an -ss 00:00:00.500 -an -r 1 -f image2 -s %size% -vframes 1 -y %bg%.png
  
  %IMG%convert ^
    %bg%.png ^
    -rotate %rotate% ^
    -gravity South ^
    -crop %crop% ^
    %bg%.png
  
goto done

:Animation
echo Extracting image sequence...

ffmpeg -i "%filename%.avi" -an -r 7 -f image2 -s %size% "%input_dir%\%filename%%%4d.png"

echo Removing backgrounds...

for /r %%i in (%input_dir%/*.png) do (
  
  if !skip! gtr 0 (
    set /a skip=!skip! - 1 
  ) else (
  
    if "!output_name!"=="" (
      set output_name=%%~ni
    )

    echo %%~ni
    
    %IMG%convert ^
      %input_dir%/%%~nxi ^
      -rotate %rotate% ^
      -gravity South ^
      -crop %crop% ^
      %temp_dir%/%%~ni_crop.png
      
    %IMG%convert ^
      %temp_dir%/%%~ni_crop.png ^
      -brightness-contrast 2 ^
      -fx 'r+b-1.2*g' ^
      -transparent black ^
      -alpha extract ^
      %temp_dir%/%%~ni_mask.png
      
    %IMG%convert ^
      %temp_dir%/%%~ni_crop.png ^
      %temp_dir%/%%~ni_mask.png ^
      -alpha off ^
      -compose CopyOpacity ^
      -composite ^
      %temp_dir%/%%~ni.png
	  
    del /q "%temp_dir%\%%~ni_crop.png"
    del /q "%temp_dir%\%%~ni_mask.png"
  )
)

echo Generating gif...

%IMG%convert ^
  +repage ^
  -delay 12 ^
  -loop 0 ^
  -ordered-dither o8x8,8,8,4 ^
  +map ^
  -dispose Background ^
  %temp_dir%/*.png ^
  -coalesce ^
  -trim ^
  -layers TrimBounds ^
  -duplicate 1,-2-1 ^
  -quiet ^
  %output_dir%/"%filename%".gif
  
:Done
echo Done
