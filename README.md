# AgriBot - Multi-Agent AI Platform for Farmers

AgriBot is a state-of-the-art agricultural intelligence platform designed to empower farmers with specialized AI expertise, real-time data, and multilingual accessibility. Built with Next.js 14 and powered by Groq's high-performance LLMs, AgriBot provides a comprehensive suite of tools for the modern farm.

## 🚀 Key Features

### 🤖 Multi-Agent RAG System
AgriBot features 8 specialized AI agents, each with a unique domain of expertise. The system automatically routes queries to the most relevant expert:
- **AgriDetect**: Computer vision-based disease and pest detection.
- **Seed Sage**: Personalized seed variety recommendations tailored to local soil and climate.
- **Market Oracle**: Real-time mandi pricing intelligence and market trends.
- **Weather Intelligence**: Hyper-local weather forecasts and actionable farming advice.
- **Rotation Master**: AI-driven crop rotation planning for soil health and profit.
- **Irrigation Planner**: Data-informed water management and scheduling.
- **Training Hub**: Best practices for fertilizers, pesticides, and sustainable farming.
- **Voice AI Assistant**: A friendly, fallback assistant for general agricultural guidance.

### 🌍 Multilingual & Voice-First
Designed for inclusivity, AgriBot supports:
- **Full Localization**: Seamlessly switch between **English**, **Hindi**, and **Marathi**.
- **Voice Interface**: Hands-free interaction with Speech-to-Text (STT) and natural-sounding Text-to-Speech (TTS).
- **Regional Language Intelligence**: Agents are specifically prompted to provide high-quality, structured advice in regional languages.

### 📊 Advanced Data Capabilities
- **Document Ingestion**: Upload CSV, PDF, or TXT datasets to enrich the RAG knowledge base.
- **Vision Analysis**: Upload photos of crops for instant diagnostic feedback.
- **Farmer Profiles**: Personalized advice based on crop history, location, and soil type.

## 🛠️ Technology Stack
- **Frontend**: Next.js 14, Tailwind CSS, Lucide Icons, Shadcn UI
- **AI/LLM**: Groq SDK (Llama 3 / Mixtral models)
- **RAG Engine**: Custom in-memory vector store with TF-IDF chunking and cosine similarity
- **Voice**: Whisper API (STT), Web Speech API (TTS)
- **Formatting**: React-Markdown with GFM support

## 🚦 Getting Started

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables in `.env.local`:
   ```env
   GROQ_API_KEY=your_key_here
   NEXT_PUBLIC_OPENWEATHER_API_KEY=your_key_here
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) to start your AI farm journey.

---
*AgriBot: Cultivating the Future with Intelligence.*"# AgriBot-Project" 
