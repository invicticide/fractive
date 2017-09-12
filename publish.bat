@echo off
if "%1"=="" goto MissingArgument

:Compile
node lib/Compiler.js %1
exit /b %errorlevel%

:MissingArgument
echo "Usage: publish.bat path/to/story/directory/"
exit /b 1
