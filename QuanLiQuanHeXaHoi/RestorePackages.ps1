# ====================================================
# PowerShell Script: Restore All NuGet Packages
# Project: QuanLiQuanHeXaHoi
# ====================================================

Write-Host ""
Write-Host "========================================"
Write-Host "  NuGet Package Installer (PowerShell)"
Write-Host "  QuanLiQuanHeXaHoi Project"
Write-Host "========================================"
Write-Host ""

# Check if running in correct directory
if (-not (Test-Path "QuanLiQuanHeXaHoi.csproj")) {
    Write-Host "[ERROR] QuanLiQuanHeXaHoi.csproj not found!" -ForegroundColor Red
    Write-Host "Please run this script from the QuanLiQuanHeXaHoi directory" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "[INFO] Installing NuGet packages..." -ForegroundColor Cyan
Write-Host ""

# Array of packages to install
$packages = @(
    @{Name="Microsoft.AspNet.WebApi"; Version="5.2.9"},
    @{Name="Microsoft.AspNet.WebApi.Client"; Version="5.2.9"},
    @{Name="Microsoft.AspNet.WebApi.Core"; Version="5.2.9"},
    @{Name="Microsoft.AspNet.WebApi.WebHost"; Version="5.2.9"},
    @{Name="Microsoft.AspNet.Cors"; Version="5.2.9"},
    @{Name="Microsoft.AspNet.WebApi.Cors"; Version="5.2.9"},
    @{Name="EntityFramework"; Version="6.4.4"},
    @{Name="System.Data.SQLite"; Version="1.0.118.0"},
    @{Name="System.Data.SQLite.Core"; Version="1.0.118.0"},
    @{Name="System.Data.SQLite.EF6"; Version="1.0.118.0"},
    @{Name="System.Data.SQLite.Linq"; Version="1.0.118.0"},
    @{Name="BCrypt.Net-Next"; Version="4.0.3"},
    @{Name="Newtonsoft.Json"; Version="13.0.3"}
)

$installed = 0
$failed = 0

foreach ($package in $packages) {
    $name = $package.Name
    $version = $package.Version

    Write-Host "Installing $name $version..." -ForegroundColor Yellow

    try {
        # Use nuget.exe if available, otherwise use Install-Package cmdlet
        if (Test-Path "..\packages\nuget.exe") {
            & ..\packages\nuget.exe install $name -Version $version -OutputDirectory ..\packages -NonInteractive
        } else {
            Install-Package -Name $name -Version $version -Source "https://api.nuget.org/v3/index.json" -ProjectName "QuanLiQuanHeXaHoi" -ErrorAction Stop
        }

        Write-Host "  ✓ Success: $name" -ForegroundColor Green
        $installed++
    }
    catch {
        Write-Host "  ✗ Failed: $name - $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }

    Write-Host ""
}

Write-Host "========================================"
Write-Host "Summary:"
Write-Host "  Installed: $installed packages" -ForegroundColor Green
Write-Host "  Failed: $failed packages" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Green" })
Write-Host "========================================"
Write-Host ""

if ($failed -eq 0) {
    Write-Host "[SUCCESS] All packages installed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Close and reopen Visual Studio" -ForegroundColor White
    Write-Host "  2. Build > Rebuild Solution" -ForegroundColor White
    Write-Host "  3. Press F5 to run" -ForegroundColor White
} else {
    Write-Host "[WARNING] Some packages failed to install" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Cyan
    Write-Host "  1. Check internet connection" -ForegroundColor White
    Write-Host "  2. Run Visual Studio as Administrator" -ForegroundColor White
    Write-Host "  3. Try: Tools > NuGet Package Manager > Package Manager Console" -ForegroundColor White
    Write-Host "     Then run: Update-Package -reinstall" -ForegroundColor White
}

Write-Host ""
Read-Host "Press Enter to exit"
