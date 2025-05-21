# API Integration Documentation

## Overview
The `src/api` directory handles all API integrations, including LLM providers and data transformation.

## Directory Structure

### 1. index.ts
Main API module entry point.
```typescript
// Exports:
- API client initialization
- Provider configuration
- Request handling
- Error management
```

### 2. retry.ts & retry.test.ts
Implements retry logic for API calls.
```typescript
// Features:
- Exponential backoff
- Error classification
- Retry conditions
- Timeout handling
```

### 3. providers/
Individual LLM provider implementations.
```typescript
// Supported Providers:
- Anthropic (Claude)
- OpenAI
- AWS Bedrock
- Google Vertex
- Ollama
- LM Studio
- Azure OpenAI
- And more...

// Each Provider Implements:
- Authentication
- Request formatting
- Response parsing
- Stream handling
- Error management
```

### 4. transform/
API response transformation utilities.
```typescript
// Functionality:
- Stream processing
- Content formatting
- Token counting
- Response validation
- Error handling
```

## Integration Workflows

### API Request Flow
1. Client initialization
2. Request formation
3. Provider selection
4. Request execution
5. Response transformation
6. Error handling

### Streaming Flow
1. Stream connection
2. Chunk processing
3. Content aggregation
4. Progress updates
5. Stream closure

### Error Handling Flow
1. Error detection
2. Classification
3. Retry decision
4. Backoff calculation
5. User notification

## Common Usage Patterns

### Basic Request
```typescript
// Example flow:
1. Configure provider
2. Initialize client
3. Send request
4. Process response
```

### Streaming Request
```typescript
// Example flow:
1. Setup stream
2. Process chunks
3. Update UI
4. Handle completion
```

### Error Recovery
```typescript
// Example flow:
1. Detect failure
2. Apply retry strategy
3. Log issues
4. Notify user
```
