@echo off
REM ============================================
REM Script: Restore NuGet Packages
REM Project: QuanLiQuanHeXaHoi
REM ============================================

echo.
echo ========================================
echo   NuGet Package Restore Script
echo   QuanLiQuanHeXaHoi Project
echo ========================================
echo.

REM Check if NuGet.exe exists
if not exist "..\packages\NuGet.exe" (
    echo [INFO] Downloading NuGet.exe...
    mkdir ..\packages 2>nul
    powershell -Command "& {Invoke-WebRequest -Uri 'https://dist.nuget.org/win-x86-commandline/latest/nuget.exe' -OutFile '..\packages\NuGet.exe'}"
    if errorlevel 1 (
        echo [ERROR] Failed to download NuGet.exe
        pause
        exit /b 1
    )
    echo [OK] NuGet.exe downloaded successfully
)

echo.
echo [INFO] Restoring NuGet packages...
echo.

..\packages\NuGet.exe restore QuanLiQuanHeXaHoi.csproj -PackagesDirectory ..\packages

if errorlevel 1 (
    echo.
    echo [ERROR] Package restore failed!
    echo.
    echo Troubleshooting:
    echo   1. Check internet connection
    echo   2. Check packages.config file
    echo   3. Try running Visual Studio as Administrator
    echo   4. Try: Tools ^> NuGet Package Manager ^> Package Manager Console
    echo      Then run: Update-Package -reinstall
    echo.
    pause
    exit /b 1
)

echo.
echo [SUCCESS] All packages restored successfully!
echo.
echo Next steps:
echo   1. Open CongCuVui.sln in Visual Studio
echo   2. Build ^> Rebuild Solution
echo   3. Press F5 to run
echo.
pause
