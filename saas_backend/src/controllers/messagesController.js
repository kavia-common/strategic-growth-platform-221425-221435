const conversationService = require('../services/conversationService');
const chatService = require('../services/chatService');
const { z } = require('zod');

const messageSchema = z.object({
  content: z.string().min(1)
});

class MessagesController {
  // PUBLIC_INTERFACE
  async create(req, res) {
    try {
      const { id: conversationId } = req.params;
      const { content } = messageSchema.parse(req.body);
      const userId = req.user.id;

      // 1. Save User Message
      const userMessage = await conversationService.addMessage(conversationId, userId, 'user', content);

      // 2. Fetch context for AI
      const history = await conversationService.getMessages(conversationId);
      // Remove the just-added message from history sent to LLM to avoid duplication if LLM api handles it differently, 
      // but Gemini expects history + new prompt.
      // We will exclude the last message we just added from "history" param of generateResponse, 
      // and pass it as the prompt.
      const previousHistory = history.filter(m => m.id !== userMessage.id);

      // 3. Call Gemini
      const aiResponseText = await chatService.generateResponse(previousHistory, content);

      // 4. Save Assistant Message
      const aiMessage = await conversationService.addMessage(conversationId, null, 'assistant', aiResponseText);

      res.status(201).json({
        userMessage,
        assistantMessage: aiMessage
      });

    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new MessagesController();
