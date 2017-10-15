@echo off
if "%1"=="" goto MissingArgument
if "%2"=="" goto MissingArgument

:Compile
node lib/Compiler.js %1 %2
if %errorlevel%==0 http-server %1
exit /b %errorlevel%

:MissingArgument
echo "Usage: publish.bat path/to/story/directory/ path/to/template.html"
exit /b 1
