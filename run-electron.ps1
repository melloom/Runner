Write-Host "Starting 3D Runner Game in Electron..." -ForegroundColor Green
Write-Host ""
Write-Host "This will:" -ForegroundColor Yellow
Write-Host "1. Start the React development server" -ForegroundColor White
Write-Host "2. Wait for it to be ready" -ForegroundColor White
Write-Host "3. Launch the Electron app" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop both processes" -ForegroundColor Red
Write-Host ""

try {
    npm run electron-dev
} catch {
    Write-Host "Error running Electron app: $_" -ForegroundColor Red
}

Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 