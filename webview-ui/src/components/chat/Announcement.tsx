import React from "react"
import styled from "styled-components"
import { getAsVar, VSCodeStyles } from "../../utils/vscStyles"
import { VSCodeButton, VSCodeLink } from "@vscode/webview-ui-toolkit/react"
import { memo } from "react"
import { vscode } from "../../utils/vscode"

interface AnnouncementProps {
	version: string
	hideAnnouncement: () => void
}

/*
You must update the latestAnnouncementId in AutoGenProvider for new announcements to show to users. This new id will be compared with whats in state for the 'last announcement shown', and if it's different then the announcement will render. As soon as an announcement is shown, the id will be updated in state. This ensures that announcements are not shown more than once, even if the user doesn't close it themselves.
*/
const AnnouncementContainer = styled.div`
	padding: 8px 16px;
	margin: 8px 0;
	background-color: ${() => getAsVar(VSCodeStyles.VSC_EDITOR_BACKGROUND)};
	color: ${() => getAsVar(VSCodeStyles.VSC_DESCRIPTION_FOREGROUND)};
	border: 1px solid ${() => getAsVar(VSCodeStyles.VSC_INPUT_BORDER)};
	border-radius: 4px;
	font-size: 12px;
	line-height: 1.4;
`

const Announcement = ({ version, hideAnnouncement }: AnnouncementProps) => {
	const minorVersion = version.split(".").slice(0, 2).join(".") // 2.0.0 -> 2.0
	return (
		<AnnouncementContainer>
			<div
				style={{
					padding: "8px 16px",
					backgroundColor: getAsVar(VSCodeStyles.VSC_INACTIVE_SELECTION_BACKGROUND),
					display: "flex",
					alignItems: "center",
					gap: "8px",
				}}>
				<div
					style={{
						width: "8px",
						height: "8px",
						borderRadius: "50%",
						background: getAsVar(VSCodeStyles.VSC_DESCRIPTION_FOREGROUND),
					}}
				/>
				<VSCodeButton appearance="icon" onClick={hideAnnouncement} style={{ position: "absolute", top: "8px", right: "8px" }}>
					<span className="codicon codicon-close"></span>
				</VSCodeButton>
				<h3 style={{ margin: "0 0 8px" }}>
					🎉{"  "}New in v{minorVersion}
				</h3>
				<ul style={{ margin: "0 0 8px", paddingLeft: "12px" }}>
					<li>
						<b>Introducing MCP Marketplace:</b> Discover and install the best MCP servers right from the extension, with
						new servers added regularly! Get started by going to the{" "}
						<span className="codicon codicon-extensions" style={{ marginRight: "4px", fontSize: 10 }}></span>
						<VSCodeLink
							onClick={() => {
								vscode.postMessage({ type: "showMcpView" })
							}}>
							MCP Servers tab
						</VSCodeLink>
						.
					</li>
					<li>
						<b>Mermaid diagrams in Plan mode!</b> AutoGen can now visualize his plans using flowcharts, sequences,
						entity-relationships, and more. When he explains his approach using mermaid, you'll see a diagram right in
						chat that you can click to expand.
					</li>
					<li>
						Use <code>@terminal</code> to reference terminal contents, and <code>@git</code> to reference working changes
						and commits!
					</li>
					<li>
						New visual indicator for checkpoints after edits & commands, and automatic checkpoint at the start of each
						task.
					</li>
				</ul>
				<VSCodeLink href="https://x.com/sdrzn/status/1892262424881090721" style={{ display: "inline" }}>
					See a demo of the changes here!
				</VSCodeLink>
				{/*<ul style={{ margin: "0 0 8px", paddingLeft: "12px" }}>
					 <li>
						OpenRouter now supports prompt caching! They also have much higher rate limits than other providers,
						so I recommend trying them out.
						<br />
						{!apiConfiguration?.openRouterApiKey && (
							<VSCodeButtonLink
								href={getOpenRouterAuthUrl(vscodeUriScheme)}
								style={{
									transform: "scale(0.85)",
									transformOrigin: "left center",
									margin: "4px -30px 2px 0",
								}}>
								Get OpenRouter API Key
							</VSCodeButtonLink>
						)}
						{apiConfiguration?.openRouterApiKey && apiConfiguration?.apiProvider !== "openrouter" && (
							<VSCodeButton
								onClick={() => {
									vscode.postMessage({
										type: "apiConfiguration",
										apiConfiguration: { ...apiConfiguration, apiProvider: "openrouter" },
									})
								}}
								style={{
									transform: "scale(0.85)",
									transformOrigin: "left center",
									margin: "4px -30px 2px 0",
								}}>
								Switch to OpenRouter
							</VSCodeButton>
						)}
					</li>
					<li>
						<b>Edit AutoGen's changes before accepting!</b> When he creates or edits a file, you can modify his
						changes directly in the right side of the diff view (+ hover over the 'Revert Block' arrow button in
						the center to undo "<code>{"// rest of code here"}</code>" shenanigans)
					</li>
					<li>
						New <code>search_files</code> tool that lets AutoGen perform regex searches in your project, letting
						him refactor code, address TODOs and FIXMEs, remove dead code, and more!
					</li>
					<li>
						When AutoGen runs commands, you can now type directly in the terminal (+ support for Python
						environments)
					</li>
				</ul>*/}
				<div
					style={{
						height: "1px",
						background: getAsVar(VSCodeStyles.VSC_DESCRIPTION_FOREGROUND),
						opacity: 0.1,
						margin: "8px 0",
					}}
				/>
				<p style={{ margin: "0" }}>
					Join us on{" "}
					<VSCodeLink style={{ display: "inline" }} href="https://x.com/AutoGen">
						X,
					</VSCodeLink>{" "}
					<VSCodeLink style={{ display: "inline" }} href="https://discord.gg/AutoGen">
						discord,
					</VSCodeLink>{" "}
					or{" "}
					<VSCodeLink style={{ display: "inline" }} href="https://www.reddit.com/r/AutoGen/">
						r/AutoGen
					</VSCodeLink>
					for more updates!
				</p>
			</div>
		</AnnouncementContainer>
	)
}

export default memo(Announcement)
