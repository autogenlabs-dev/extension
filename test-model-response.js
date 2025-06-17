/**
 * Real-world test to check if Claude Sonnet 4 model is responding after authentication
 * This simulates the complete flow from authentication to model response
 */

const https = require('https');
// const fs = require('fs'); // Not used in this script

// Configuration for the test
const config = {
  model: 'provider-4/claude-sonnet-4-20250514',
  apiKey: 'ddc-a4f-a480842d898b49d4a15e14800c2f3c72', // Real A4F key format
  apiEndpoint: 'https://api.a4f.co/v1',
  testPrompt: 'Hello! Please respond to confirm that Claude Sonnet 4 is working correctly after authentication. What is your model name and version?'
};

// Function to make API request
function makeApiRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
            parseError: error.message
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

// Test function to check model response
async function testModelResponse() {
  console.log('🧪 Testing Claude Sonnet 4 Model Response...\n');
  
  // Step 1: Display configuration
  console.log('⚙️ Test Configuration:');
  console.log(`   Model: ${config.model}`);
  console.log(`   API Key: ${config.apiKey.substring(0, 15)}...`);
  console.log(`   Endpoint: ${config.apiEndpoint}`);
  console.log(`   Test Prompt: "${config.testPrompt}"\n`);
  
  // Step 2: Prepare API request
  const url = new URL(`${config.apiEndpoint}/chat/completions`);
  const requestBody = JSON.stringify({
    model: config.model,
    messages: [
      {
        role: 'user',
        content: config.testPrompt
      }
    ],
    max_tokens: 150,
    temperature: 0.7
  });
  
  const options = {
    hostname: url.hostname,
    port: url.port || 443,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(requestBody)
    }
  };
  
  console.log('📡 Making API Request...');
  
  try {
    // Step 3: Make the API request
    const response = await makeApiRequest(options, requestBody);
    
    console.log(`📊 Response Status: ${response.status}\n`);
    
    // Step 4: Analyze response
    if (response.status === 200 && response.data.choices) {
      // Success case
      const modelResponse = response.data.choices[0]?.message?.content || 'No content';
      const usage = response.data.usage || {};
      
      console.log('✅ MODEL IS RESPONDING SUCCESSFULLY!\n');
      console.log('🤖 Model Response:');
      console.log(`   "${modelResponse}"\n`);
      
      console.log('📈 Usage Statistics:');
      console.log(`   Prompt Tokens: ${usage.prompt_tokens || 'N/A'}`);
      console.log(`   Completion Tokens: ${usage.completion_tokens || 'N/A'}`);
      console.log(`   Total Tokens: ${usage.total_tokens || 'N/A'}\n`);
      
      // Step 5: Validate response content
      const responseValidation = {
        hasContent: modelResponse.length > 0,
        mentionsModel: modelResponse.toLowerCase().includes('claude') || 
                      modelResponse.toLowerCase().includes('sonnet'),
        isCoherent: modelResponse.length > 10 && !modelResponse.includes('error'),
        hasUsage: usage.total_tokens > 0
      };
      
      console.log('🔍 Response Validation:');
      console.log(`   ✅ Has Content: ${responseValidation.hasContent}`);
      console.log(`   ✅ Model Identified: ${responseValidation.mentionsModel}`);
      console.log(`   ✅ Coherent Response: ${responseValidation.isCoherent}`);
      console.log(`   ✅ Token Usage Recorded: ${responseValidation.hasUsage}\n`);
      
      const allValidationsPassed = Object.values(responseValidation).every(v => v === true);
      
      if (allValidationsPassed) {
        console.log('🎉 ALL TESTS PASSED - Claude Sonnet 4 is responding correctly!');
        return {
          success: true,
          model: config.model,
          response: modelResponse,
          usage: usage,
          validations: responseValidation
        };
      } else {
        console.log('⚠️  Some validations failed - model may have issues');
        return {
          success: false,
          model: config.model,
          response: modelResponse,
          issues: responseValidation
        };
      }
      
    } else if (response.status === 401) {
      // Authentication error
      console.log('❌ AUTHENTICATION FAILED');
      console.log('   Error: Invalid API key or unauthorized access');
      console.log('   Solution: Verify A4F API key is correct and active\n');
      
      return {
        success: false,
        error: 'Authentication failed - invalid API key',
        status: response.status,
        response: response.data
      };
      
    } else if (response.status === 404) {
      // Model not found
      console.log('❌ MODEL NOT FOUND');
      console.log(`   Error: Model "${config.model}" is not available`);
      console.log('   Solution: Check if model name is correct or available through A4F\n');
      
      return {
        success: false,
        error: 'Model not found',
        status: response.status,
        model: config.model
      };
      
    } else if (response.status === 429) {
      // Rate limit
      console.log('❌ RATE LIMIT EXCEEDED');
      console.log('   Error: Too many requests');
      console.log('   Solution: Wait before making more requests\n');
      
      return {
        success: false,
        error: 'Rate limit exceeded',
        status: response.status,
        retryAfter: response.headers['retry-after']
      };
      
    } else {
      // Other error
      console.log('❌ API REQUEST FAILED');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(response.data, null, 2)}\n`);
      
      return {
        success: false,
        error: 'API request failed',
        status: response.status,
        response: response.data
      };
    }
    
  } catch (error) {
    // Network or connection error
    console.log('❌ NETWORK ERROR');
    console.log(`   Error: ${error.message}`);
    console.log('   This could be due to:');
    console.log('   - Network connectivity issues');
    console.log('   - Invalid API endpoint');
    console.log('   - SSL/TLS certificate problems\n');
    
    return {
      success: false,
      error: 'Network error',
      details: error.message
    };
  }
}

// Function to test multiple scenarios
async function runComprehensiveTests() {
  console.log('🚀 Starting Comprehensive Model Response Tests\n');
  console.log('=' * 60 + '\n');
  
  // Test 1: Basic model response
  console.log('TEST 1: Basic Model Response');
  console.log('-' * 30);
  const basicTest = await testModelResponse();
  
  console.log('\n' + '=' * 60 + '\n');
  
  // Test 2: Model availability check
  console.log('TEST 2: Model Availability Check');
  console.log('-' * 30);
  
  try {
    const modelsUrl = new URL(`${config.apiEndpoint}/models`);
    const modelsOptions = {
      hostname: modelsUrl.hostname,
      port: modelsUrl.port || 443,
      path: modelsUrl.pathname,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    };
    
    const modelsResponse = await makeApiRequest(modelsOptions);
    
    if (modelsResponse.status === 200 && modelsResponse.data.data) {
      const availableModels = modelsResponse.data.data;
      const claudeModels = availableModels.filter(model =>
        model.id.includes('claude') || model.id.includes('sonnet')
      );
      
      console.log(`📋 Total Available Models: ${availableModels.length}`);
      console.log(`🤖 Claude Models Available: ${claudeModels.length}`);
      
      const targetModelFound = availableModels.some(model => model.id === config.model);
      console.log(`🎯 Target Model (${config.model}) Available: ${targetModelFound ? '✅ YES' : '❌ NO'}`);
      
      if (claudeModels.length > 0) {
        console.log('\n🔍 Available Claude Models:');
        claudeModels.forEach(model => {
          console.log(`   - ${model.id} (${model.owned_by || 'unknown'})`);
        });
      }
    } else {
      console.log('❌ Failed to fetch available models');
      console.log(`   Status: ${modelsResponse.status}`);
    }
    
  } catch (error) {
    console.log(`❌ Model availability check failed: ${error.message}`);
  }
  
  console.log('\n' + '=' * 60 + '\n');
  
  // Final Summary
  console.log('📊 FINAL TEST SUMMARY');
  console.log('-' * 30);
  
  if (basicTest.success) {
    console.log('🎉 RESULT: Claude Sonnet 4 Model IS RESPONDING');
    console.log('✅ Authentication: Working');
    console.log('✅ API Connection: Successful');
    console.log('✅ Model Response: Received');
    console.log('✅ Token Usage: Tracked');
    console.log('\n🚀 Ready for production use!');
  } else {
    console.log('❌ RESULT: Model Response Issues Detected');
    console.log('🔧 Troubleshooting needed:');
    
    if (basicTest.error?.includes('Authentication')) {
      console.log('   - Check A4F API key validity');
      console.log('   - Verify account permissions');
    } else if (basicTest.error?.includes('Model not found')) {
      console.log('   - Verify model name is correct');
      console.log('   - Check model availability through A4F');
    } else if (basicTest.error?.includes('Network')) {
      console.log('   - Check internet connection');
      console.log('   - Verify API endpoint URL');
    } else {
      console.log('   - Review API response details');
      console.log('   - Check A4F service status');
    }
  }
  
  return basicTest;
}

// Export for testing
if (require.main === module) {
  runComprehensiveTests()
    .then(result => {
      console.log('\n📝 Test completed');
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testModelResponse, runComprehensiveTests, config };