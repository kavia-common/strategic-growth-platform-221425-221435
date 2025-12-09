const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const model = genAI ? genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }) : null;

class ChatService {
  async generateResponse(history, userMessage) {
    if (!model) {
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
      return 'I\'m sorry, I encountered an error while processing your request.';
    }
  }
}

module.exports = new ChatService();
