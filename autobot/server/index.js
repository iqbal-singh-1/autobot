import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import express from 'express';
import { WebSocketServer } from 'ws';

dotenv.config();

const app = express();
const port = 3001;

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Create a WebSocket server
const wss = new WebSocketServer({ port });

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      if (data.type === 'query') {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        
        const prompt = `You are AutoBot, a friendly and knowledgeable vehicle expert. Your task is to provide detailed information about "${data.content}" in a clear, engaging format.

If this is a real vehicle:

🚗 Vehicle Overview
• Type/Category: [e.g., Luxury SUV, Sports Car, etc.]
• Brand: [Manufacturer]
• Model Year(s): [If applicable]

⚡ Performance & Specs
• Engine: [Key specifications]
• Power Output: [HP/kW]
• Transmission: [Type]
• 0-60 mph: [If notable]
• Top Speed: [If notable]

💫 Key Features
• [3-4 standout features]
• [Focus on unique selling points]
• [Include tech/safety features]

💰 Price Range
• New: [If applicable]
• Used: [If applicable]
• Market Position: [Brief context]

🌟 Notable Facts
• [One interesting historical fact]
• [One cool feature or achievement]
• [Any records or awards]

If this is a fictional or custom vehicle:

🎨 Creative Interpretation
• Base Vehicle Type: [What it might be based on]
• Theme: [Description of the custom concept]
• Imagined Features: [3-4 creative features]
• Estimated Cost: [Base + customization range]
• Fun Twist: [One playful or imaginative detail]

Style Guidelines:
- Use emojis for section headers
- Keep descriptions concise and engaging
- Focus on what makes this vehicle special
- Use everyday language, avoid technical jargon
- Include real-world context where relevant

If you can't identify the vehicle or encounter an error, respond with:
{
  "type": "error",
  "content": "I couldn't find information about that vehicle. Could you please check the name or provide more details?"
}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        ws.send(JSON.stringify({
          type: 'response',
          content: response.text(),
        }));
      }
    } catch (error) {
      console.error('Error processing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
      }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});