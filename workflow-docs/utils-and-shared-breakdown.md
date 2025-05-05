# Utils and Shared Code Documentation

## Overview
Documentation for utility functions and shared code in `src/utils` and `src/shared` directories.

## Utils Directory (`src/utils/`)

### 1. cost.ts & cost.test.ts
Token and API cost calculation.
```typescript
// Features:
- Token counting
- Cost estimation
- Usage tracking
- Budget management
```

### 2. fs.ts & fs.test.ts
File system utilities.
```typescript
// Functionality:
- File operations
- Directory handling
- Path resolution
- Error handling
```

### 3. git.ts
Git integration utilities.
```typescript
// Capabilities:
- Repository operations
- Change tracking
- Branch management
- Commit handling
```

### 4. path.ts & path.test.ts
Path manipulation utilities.
```typescript
// Features:
- Path normalization
- Resolution
- URL handling
- Platform specifics
```

### 5. shell.ts
Shell command utilities.
```typescript
// Functions:
- Command execution
- Output parsing
- Error handling
- Environment management
```

### 6. storage.ts
Data persistence utilities.
```typescript
// Features:
- State management
- Caching
- Configuration storage
- Data serialization
```

## Shared Directory (`src/shared/`)

### 1. API Related
```typescript
// Files:
- api.ts: API types and interfaces
- AutoGenAccount.ts: Account management
- ChatContent.ts: Chat data structures
- ChatSettings.ts: Chat configuration
```

### 2. Settings and Configuration
```typescript
// Files:
- AutoApprovalSettings.ts
- BrowserSettings.ts
- TelemetrySetting.ts
- Languages.ts
```

### 3. Message Handling
```typescript
// Files:
- ExtensionMessage.ts
- WebviewMessage.ts
- context-mentions.ts
```

### 4. Data Processing
```typescript
// Files:
- array.ts & array.test.ts
- combineApiRequests.ts
- combineCommandSequences.ts
```

## Common Utilities

### File Operations
```typescript
// Example usage:
1. Path resolution
2. File reading/writing
3. Directory operations
4. Error handling
```

### Data Management
```typescript
// Patterns:
1. State persistence
2. Cache handling
3. Configuration management
4. Data validation
```

### Shell Operations
```typescript
// Common flows:
1. Command building
2. Execution
3. Output processing
4. Error handling
```

## Best Practices

### Error Handling
```typescript
// Guidelines:
- Use type-safe errors
- Provide context
- Handle async errors
- Clean up resources
```

### Performance
```typescript
// Considerations:
- Cache results
- Batch operations
- Optimize loops
- Memory management
```

### Testing
```typescript
// Approaches:
- Unit tests
- Integration tests
- Mock systems
- Error scenarios
```

## Shared Types and Interfaces

### Common Types
```typescript
// Examples:
- API request/response types
- Configuration interfaces
- Message types
- Status enums
```

### Type Guards
```typescript
// Patterns:
- Type narrowing
- Validation
- Safe type casting
- Error boundaries
```

### Constants
```typescript
// Categories:
- API endpoints
- Configuration values
- Error messages
- Default settings
```
