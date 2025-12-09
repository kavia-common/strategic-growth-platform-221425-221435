const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GEMINI_API_KEY;

const maskKey = (key) => key ? `${key.substring(0, 5)}...${key.substring(key.length - 5)}` : 'MISSING';

console.log('--- Gemini Configuration Check ---');
console.log(`Gemini API Key: ${maskKey(apiKey)}`);

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const model = genAI ? genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }) : null;

class ChatService {
  async generateResponse(history, userMessage) {
    if (!model) {
      console.error('Gemini model not initialized due to missing API Key.');
      return 'Gemini API Key is not configured. Please set GEMINI_API_KEY.';
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
      
      // Handle specific API key errors
      if (error.status === 401 || (error.message && error.message.includes('401'))) {
         return 'Error: Invalid Gemini API Key. Please check your configuration.';
      }
      if (error.status === 403 || (error.message && error.message.includes('403'))) {
         return 'Error: Access denied to Gemini API. Check quotas or key permissions.';
      }

      return 'I\'m sorry, I encountered an error while processing your request.';
    }
  }
}

module.exports = new ChatService();
