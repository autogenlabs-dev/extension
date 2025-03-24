# AutoGen API

The AutoGen extension exposes an API that can be used by other extensions. To use this API in your extension:

1. Copy `src/extension-api/AutoGen.d.ts` to your extension's source directory.
2. Include `AutoGen.d.ts` in your extension's compilation.
3. Get access to the API with the following code:

    ```ts
    const autogenExtension = vscode.extensions.getExtension<AutoGenAPI>("saoudrizwan.claude-dev")

    if (!autogenExtension?.isActive) {
    	throw new Error("AutoGen extension is not activated")
    }

    const AutoGen = autogenExtension.exports

    if (AutoGen) {
    	// Now you can use the API

    	// Set custom instructions
    	await AutoGen.setCustomInstructions("Talk like a pirate")

    	// Get custom instructions
    	const instructions = await AutoGen.getCustomInstructions()
    	console.log("Current custom instructions:", instructions)

    	// Start a new task with an initial message
    	await AutoGen.startNewTask("Hello, AutoGen! Let's make a new project...")

    	// Start a new task with an initial message and images
    	await AutoGen.startNewTask("Use this design language", ["data:image/webp;base64,..."])

    	// Send a message to the current task
    	await AutoGen.sendMessage("Can you fix the @problems?")

    	// Simulate pressing the primary button in the chat interface (e.g. 'Save' or 'Proceed While Running')
    	await AutoGen.pressPrimaryButton()

    	// Simulate pressing the secondary button in the chat interface (e.g. 'Reject')
    	await AutoGen.pressSecondaryButton()
    } else {
    	console.error("AutoGen API is not available")
    }
    ```

    **Note:** To ensure that the `saoudrizwan.claude-dev` extension is activated before your extension, add it to the `extensionDependencies` in your `package.json`:

    ```json
    "extensionDependencies": [
        "saoudrizwan.claude-dev"
    ]
    ```

For detailed information on the available methods and their usage, refer to the `AutoGen.d.ts` file.
