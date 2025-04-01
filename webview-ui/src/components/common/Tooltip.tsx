import React, { useState } from "react"
import styled from "styled-components"
import { getAsVar, VSCodeStyles } from "../../utils/vscStyles"

interface TooltipProps {
	visible: boolean
	hintText: string
	tipText: string
	children: React.ReactNode
	style?: React.CSSProperties
}

const TooltipContainer = styled.div`
	position: relative;
	display: inline-block;
`

const TooltipContent = styled.div<{ isVisible: boolean }>`
	visibility: ${(props) => (props.isVisible ? "visible" : "hidden")};
	position: absolute;
	z-index: 1000;
	bottom: 125%;
	left: 50%;
	transform: translateX(-50%);
	padding: 8px;
	border-radius: 4px;
	background-color: ${() => getAsVar(VSCodeStyles.VSC_SIDEBAR_BACKGROUND)};
	color: ${() => getAsVar(VSCodeStyles.VSC_DESCRIPTION_FOREGROUND)};
	text-align: center;
	font-size: 12px;
	white-space: nowrap;
	border: 1px solid ${() => getAsVar(VSCodeStyles.VSC_INPUT_BORDER)};

	&::after {
		content: "";
		position: absolute;
		top: 100%;
		left: 50%;
		margin-left: -5px;
		border-width: 5px;
		border-style: solid;
		border-color: ${() => getAsVar(VSCodeStyles.VSC_INPUT_PLACEHOLDER_FOREGROUND)} transparent transparent transparent;
	}
`

const Hint = styled.div`
	font-size: 0.8em;
	color: ${() => getAsVar(VSCodeStyles.VSC_INPUT_PLACEHOLDER_FOREGROUND)};
	opacity: 0.8;
	margin-top: 2px;
`

const Tooltip: React.FC<TooltipProps> = ({ visible, tipText, hintText, children, style }) => {
	return (
		<div style={{ position: "relative", display: "inline-block" }}>
			{children}
			{visible && (
				<TooltipContent isVisible={visible}>
					{tipText}
					{hintText && <Hint>{hintText}</Hint>}
				</TooltipContent>
			)}
		</div>
	)
}

export default Tooltip
