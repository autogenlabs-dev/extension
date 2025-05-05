# Core Module Documentation

## Overview
The `src/core` directory contains the central logic of the extension, including the AutoGen agent, message handling, and prompt management.

## Key Components

### 1. Autogen.ts
Main agent implementation file that coordinates all core functionality.
```typescript
// Key Classes and Functions:
- class AutoGen
  - Manages task loops
  - Handles tool execution
  - Controls message presentation
  - Integrates with LLM APIs
  - Manages context and history
```

### 2. assistant-message/
Handles processing and formatting of assistant responses.
```typescript
// Key functionality:
- Message parsing
- Content formatting
- Code block handling
- Tool usage tracking
- Response validation
```

### 3. context-management/
Manages conversation context and state.
```typescript
// Features:
- Context window management
- Message history tracking
- Token counting
- Context pruning
- State persistence
```

### 4. ignore/
Handles workspace ignore patterns (similar to .gitignore).
```typescript
// Components:
- Ignore pattern parsing
- File filtering
- Path matching
- Configuration loading
```

### 5. mentions/
Processes @-mentions and references in messages.
```typescript
// Functionality:
- Mention detection
- Reference resolution
- Content fetching
- Link generation
```

### 6. prompts/
Contains system prompts and templates.
```typescript
// Organization:
- Base prompts
- Task-specific templates
- Dynamic prompt generation
- Prompt configuration
```

### 7. webview/
Manages communication with the webview UI.
```typescript
// Features:
- Message passing
- State synchronization
- Event handling
- UI updates
```

## Workflow Examples

### Task Processing Flow
1. User input received via webview
2. AutoGen processes request
3. Tools are executed as needed
4. Results are formatted
5. Response is sent back to UI

### Context Management Flow
1. New message received
2. Context window updated
3. Old messages pruned if needed
4. State persisted
5. UI synchronized
