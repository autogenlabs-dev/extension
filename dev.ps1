# Start the webview development server
$webviewJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD\webview-ui
    npm run dev:webview
}

# Wait a moment for the webview server to start
Start-Sleep -Seconds 3

# Display information about the setup
Write-Host @"
----------------------------------------
AutoGen DEVELOPMENT ENVIRONMENT
----------------------------------------
Webview Dev Server: Running on http://localhost:25463
HMR Status: Enabled for webview components

To use:
1. VS Code will now open with the extension loaded
2. Any changes to webview UI will hot reload
3. See the status indicator in the bottom right of the modern chat

Press Ctrl+C to stop all processes when done
----------------------------------------
"@

# Open VS Code with the extension
code --new-window --extensionDevelopmentPath="$PWD"

# Keep the script running until user cancels
try {
    while ($true) {
        # Check if VS Code is still running
        if (-not (Get-Process -Name "code" -ErrorAction SilentlyContinue)) {
            break
        }
        
        # Show job output
        Receive-Job -Job $webviewJob
        
        Start-Sleep -Seconds 1
    }
} finally {
    # Clean up when the user ends the script
    Stop-Job -Job $webviewJob
    Remove-Job -Job $webviewJob -Force
    Write-Host "Development environment shut down."
}