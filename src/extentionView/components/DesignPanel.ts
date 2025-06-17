/**
 * Function to create HTML content for the Figma Design panel
 */
export function showDesignContent(designStyle: string): string {
	// Design options and their details
	let title: string, description: string, imageUrl: string
	let components: string[] = []
	let colors: string[] = []

	if (designStyle === "Modern Minimal") {
		title = "Modern Minimal Design"
		description = "Clean interfaces with ample white space, minimal color palette, and subtle shadows."
		imageUrl =
			"https://cdn.dribbble.com/userupload/10922203/file/original-e9ec8adcddec9a8e2fac9c9486c342dc.png?crop=603x452-1812x1359"
		components = ["Navigation", "Cards", "Forms", "Modals"]
		colors = ["#FFFFFF", "#F8F9FA", "#212529", "#0D6EFD"]
	} else if (designStyle === "Glassmorphism") {
		title = "Glassmorphism UI"
		description = "Frosted glass effect with transparency, blur effects and subtle borders."
		imageUrl =
			"https://cdn.dribbble.com/userupload/10627047/file/original-55e59fa626b6cacef163259302382126.png?crop=0x0-1600x1200"
		components = ["Glass Cards", "Transparent Nav", "Blurred Modals", "Layered Panels"]
		colors = ["rgba(255,255,255,0.7)", "rgba(255,255,255,0.3)", "#8A2BE2", "#4B0082"]
	} else if (designStyle === "Retro Theme") {
		title = "Retro Web Design"
		description = "Bold colors, pixel art, chunky elements and nostalgic typography."
		imageUrl =
			"https://cdn.dribbble.com/userupload/10920808/file/original-b429a6c9a7939d4449d172ed88a981ca.png?crop=0x0-1600x1200"
		components = ["Pixel Buttons", "Chunky Text", "Grid Layouts", "Retro Icons"]
		colors = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#1A535C"]
	} else {
		title = designStyle
		description = "Custom design style with unique visual elements."
		imageUrl = "https://placehold.co/600x400/2a2a2a/white?text=Design+Preview"
		components = ["Custom Components"]
		colors = ["#CCCCCC", "#333333"]
	}

	// Create HTML markup for the design preview card
	let html = `
    <div class="w-full border rounded-lg overflow-hidden bg-gray-800 border-gray-700">
        <div class="border-b border-gray-700">
            <div class="flex items-center px-4 py-3">
                <h2 class="text-sm font-medium text-gray-200">${title}</h2>
            </div>
        </div>
        <div class="p-8 bg-gray-900/50">
            <img src="${imageUrl}" alt="${title}" style="width: 100%; border-radius: 6px;">
            <p class="text-sm text-gray-400 mt-4">${description}</p>
            
            <div class="mt-4">
                <h4 class="text-sm font-medium text-gray-200">Components:</h4>
                <div class="flex flex-wrap gap-2 mt-2">
                    ${components.map((comp) => `<span class="tag">${comp}</span>`).join("")}
                </div>
            </div>
            
            <div class="mt-4">
                <h4 class="text-sm font-medium text-gray-200">Color Palette:</h4>
                <div class="flex flex-wrap gap-2 mt-2">
                    ${colors.map((color) => `<span class="color-dot" style="background-color: ${color}; display: inline-block; width: 24px; height: 24px; border-radius: 50%;" title="${color}"></span>`).join("")}
                </div>
            </div>
            
            <button class="debug-button mt-6" id="generateDesignComponents">Generate Components</button>
        </div>
    </div>
    
    <div class="mt-8 p-4 border rounded-lg border-gray-700">
        <h4 class="text-sm font-medium text-gray-200 mb-2">How to Use This Design</h4>
        <ol class="text-sm text-gray-400 list-decimal pl-5">
            <li>Review the components and color palette above</li>
            <li>Click "Generate Components" to create code for this design style</li>
            <li>Customize the generated components in your project</li>
        </ol>
    </div>`

	return html
}

/**
 * Generate a prompt for the selected design style
 */
export function getDesignPrompt(designStyle: string): string {
	// Get design details
	let title: string, description: string
	let components: string[] = []
	let colors: string[] = []

	if (designStyle === "Modern Minimal") {
		title = "Modern Minimal Design"
		description = "Clean interfaces with ample white space, minimal color palette, and subtle shadows."
		components = ["Navigation", "Cards", "Forms", "Modals"]
		colors = ["#FFFFFF", "#F8F9FA", "#212529", "#0D6EFD"]
	} else if (designStyle === "Glassmorphism") {
		title = "Glassmorphism UI"
		description = "Frosted glass effect with transparency, blur effects and subtle borders."
		components = ["Glass Cards", "Transparent Nav", "Blurred Modals", "Layered Panels"]
		colors = ["rgba(255,255,255,0.7)", "rgba(255,255,255,0.3)", "#8A2BE2", "#4B0082"]
	} else if (designStyle === "Retro Theme") {
		title = "Retro Web Design"
		description = "Bold colors, pixel art, chunky elements and nostalgic typography."
		components = ["Pixel Buttons", "Chunky Text", "Grid Layouts", "Retro Icons"]
		colors = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#1A535C"]
	} else {
		title = designStyle
		description = "Custom design style with unique visual elements."
		components = ["Custom Components"]
		colors = ["#CCCCCC", "#333333"]
	}

	// Create the prompt using string concatenation to avoid template literal nesting issues
	const prompt =
		"Generate UI components using the " +
		designStyle +
		" design style with the following details:\\n" +
		"- Title: " +
		title +
		"\\n" +
		"- Description: " +
		description +
		"\\n" +
		"- Components: " +
		components.join(", ") +
		"\\n" +
		"- Color palette: " +
		colors.join(", ") +
		"\\n\\n" +
		"Please create responsive, accessible components that follow this design style."

	return prompt
}
