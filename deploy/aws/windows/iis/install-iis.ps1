Write-Host "Installing IIS..." -ForegroundColor Cyan
Install-WindowsFeature -Name Web-Server -IncludeManagementTools

Write-Host "IIS installation finished." -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Copy the extracted build files to C:\inetpub\wwwroot"
Write-Host "2. Ensure web.config is present in C:\inetpub\wwwroot"
Write-Host "3. Run iisreset"
Write-Host ""
Write-Host "Note: if you need route refresh support for the SPA, install the IIS URL Rewrite module."
