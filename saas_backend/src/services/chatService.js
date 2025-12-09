const { GoogleGenerativeAI } = require('@google/generative-ai');

// Resolve Gemini API Key: Prefer standard, fallback to NEXT_PUBLIC_
const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

const maskKey = (key) => key ? `${key.substring(0, 5)}...${key.substring(key.length - 5)}` : 'MISSING';

console.log('--- Gemini Configuration Check ---');
console.log(`Gemini API Key: ${maskKey(apiKey)}`);

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const model = genAI ? genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }) : null;

class ChatService {
  async generateResponse(history, userMessage) {
    if (!model) {
      console.error('Gemini model not initialized due to missing API Key.');
      const error = new Error('Gemini API Key is not configured.');
      error.statusCode = 503; // Service Unavailable
      throw error;
    }

    try {
      // Convert internal message format to Gemini format
      // Internal: { role: 'user'|'assistant', content: '...' }
      // Gemini: { role: 'user'|'model', parts: [{ text: '...' }] }
      const chatHistory = history.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      const chat = model.startChat({
        history: chatHistory,
      });

      const result = await chat.sendMessage(userMessage);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini API Error:', error);
      
      // Handle specific API key errors and map to status codes
      if (error.status === 401 || (error.message && error.message.includes('401'))) {
         const authError = new Error('Invalid Gemini API Key. Please check your configuration.');
         authError.statusCode = 401; // Unauthorized
         throw authError;
      }
      if (error.status === 403 || (error.message && error.message.includes('403'))) {
         const accessError = new Error('Access denied to Gemini API. Check quotas or key permissions.');
         accessError.statusCode = 403; // Forbidden
         throw accessError;
      }

      // Propagate other errors with 500 default
      const serverError = new Error('Error processing AI response.');
      serverError.statusCode = 500;
      throw serverError;
    }
  }
}

module.exports = new ChatService();
