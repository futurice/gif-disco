@echo off
setlocal ENABLEDELAYEDEXPANSION

set filename=preview.png
      
%IMG%convert ^
  %filename% ^
  -brightness-contrast 2 ^
  -fx 'r+b-1.1*g' ^
  -transparent black ^
  -alpha extract ^
  %filename%_mask.png
  
%IMG%convert ^
  %filename% ^
  %filename%_mask.png ^
  -alpha Off ^
  -compose CopyOpacity ^
  -composite ^
  %filename%_frame.png