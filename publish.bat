@echo off
if "%1"=="" goto MissingArgument
if "%2"=="" goto MissingArgument
if "%3"=="" goto MissingArgument

:Compile
node lib/Compiler.js %1 %2 %3
exit /b %errorlevel%

:MissingArgument
echo "Usage: publish.bat path/to/story/directory/ path/to/template.html [bundleScripts: true or false]"
exit /b 1
