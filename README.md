# 🤖 AI Agent Server

A **pluggable AI agent server** built with TypeScript, featuring RAG (Retrieval-Augmented Generation), memory management, and a plugin system. This agent can answer questions using contextual knowledge from markdown documents and execute plugins for weather and math operations.

## 🚀 Features

- **🧠 LLM Integration**: Powered by OpenAI GPT-4 with custom prompt engineering
- **📚 RAG System**: Retrieves relevant context from markdown documents using vector embeddings
- **💾 Session Memory**: Maintains conversation context across sessions
- **🔌 Plugin System**: Extensible plugin architecture with Weather and Math plugins
- **⚡ Fast & Scalable**: Built with Express.js and TypeScript
- **🔒 Production Ready**: Includes logging, error handling, and security middleware

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Agent Server                          │
├─────────────────────────────────────────────────────────────┤
│  🧠 LLM Core (OpenAI GPT-4)                                │
│  ├── Message Processing                                     │
│  ├── Session Memory Management                              │
│  └── Response Generation                                    │
├─────────────────────────────────────────────────────────────┤
│  📚 RAG System (Vector Search)                             │
│  ├── Document Chunking                                      │
│  ├── Embedding Generation                                   │
│  ├── Similarity Search                                      │
│  └── Context Injection                                      │
├─────────────────────────────────────────────────────────────┤
│  🔌 Plugin System                                           │
│  ├── Weather Plugin (WeatherAPI.com)                       │
│  ├── Math Plugin (Expression Evaluation)                    │
│  └── Intent Detection                                       │
└─────────────────────────────────────────────────────────────┘
```

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key
- WeatherAPI.com API key (optional, for weather plugin)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-agent-server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your API keys:
   ```env
   # Required
   OPENAI_API_KEY=your_openai_api_key_here
   
   # Optional (for weather plugin)
   WEATHER_API_KEY=your_weatherapi_key_here
   
   # Server configuration
   PORT=3000
   NODE_ENV=development
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

5. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 🎯 API Endpoints

### POST `/agent/message`
Send a message to the AI agent.

**Request:**
```json
{
  "message": "What are the benefits of using Markdown for blogging?",
  "session_id": "user_123_session_456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "Based on the documentation, Markdown offers several key benefits...",
    "session_id": "user_123_session_456",
    "context_used": [
      "Markdown reduces formatting overhead...",
      "Benefits include simplicity, focus, portability..."
    ],
    "plugins_called": [],
    "timestamp": "2025-01-08T10:30:00Z"
  },
  "timestamp": "2025-01-08T10:30:00Z"
}
```

### GET `/agent/stats`
Get agent statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "vectorDB": {
      "count": 45,
      "name": "in_memory_vector_db"
    },
    "memory": {
      "totalSessions": 5,
      "totalMessages": 23
    },
    "plugins": [
      {
        "name": "weather",
        "description": "Get current weather information"
      },
      {
        "name": "math",
        "description": "Evaluate mathematical expressions"
      }
    ]
  }
}
```

### GET `/agent/health`
Health check endpoint.

### POST `/agent/clear`
Clear all agent data (for testing/reset).

## 🔌 Plugin System

### Weather Plugin
Get current weather information for any location.

**Example:**
```
User: "What's the weather like in Tokyo?"
Agent: "The weather in Tokyo is partly cloudy with a temperature of 22°C..."
```

### Math Plugin
Evaluate mathematical expressions.

**Example:**
```
User: "Calculate 15 * 23 + 7"
Agent: "15 * 23 + 7 = 352. Here's how I calculated it..."
```

## 📚 Sample Queries

### Knowledge-Based Queries
- "What are the benefits of using Markdown for blogging?"
- "How does Markdown help with version control?"
- "What is LLM-friendly content?"

### Plugin Queries
- "What's the weather in Bangalore today?"
- "Calculate 2 + 2 * 5"
- "What's the temperature in New York?"

### Hybrid Queries
- "What's the weather in Tokyo and how does it compare to writing in Markdown?"

## 🧪 Testing

### Using curl
```bash
# Send a message
curl -X POST http://localhost:3000/agent/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are the benefits of using Markdown?",
    "session_id": "test_session_1"
  }'

# Get stats
curl http://localhost:3000/agent/stats

# Health check
curl http://localhost:3000/agent/health
```

### Using Postman
1. Import the collection from `postman_collection.json`
2. Set the base URL to `http://localhost:3000`
3. Send requests to test different endpoints

## 🔧 Configuration

### Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `OPENAI_API_KEY` | OpenAI API key | Required |
| `OPENAI_MODEL` | OpenAI model | `gpt-4` |
| `WEATHER_API_KEY` | OpenWeatherMap API key | Optional |
| `LOG_LEVEL` | Logging level | `info` |

### RAG Configuration
- **Chunk Size**: 1000 characters
- **Chunk Overlap**: 200 characters
- **Top K Results**: 3
- **Similarity Threshold**: 0.7

### Memory Configuration
- **Max Messages per Session**: 10
- **Max Sessions**: 1000

## 📁 Project Structure

```
src/
├── config/          # Configuration management
├── routes/          # API routes
├── services/        # Core services
│   ├── agent.ts     # Main agent orchestrator
│   ├── llm.ts       # OpenAI integration
│   ├── memory.ts    # Session memory
│   ├── plugins.ts   # Plugin system
│   └── vectorDB.ts  # Vector database
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
│   ├── chunking.ts  # Document processing
│   ├── embeddings.ts # Vector operations
│   └── logger.ts    # Logging
└── server.ts        # Express server
```

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Docker (Optional)
```bash
docker build -t ai-agent-server .
docker run -p 3000:3000 ai-agent-server
```

## 🔍 Monitoring & Logging

The application includes comprehensive logging:
- Request/response logging
- Error tracking
- Performance metrics
- Plugin execution logs

Logs are written to:
- Console (development)
- `logs/combined.log` (all logs)
- `logs/error.log` (error logs only)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For issues and questions:
1. Check the logs for error details
2. Verify your API keys are correct
3. Ensure all dependencies are installed
4. Check the health endpoint: `GET /agent/health`

## 🎯 Roadmap

- [ ] ChromaDB integration for persistent vector storage
- [ ] Additional plugins (calendar, email, etc.)
- [ ] WebSocket support for real-time chat
- [ ] User authentication and authorization
- [ ] Rate limiting and API quotas
- [ ] Docker containerization
- [ ] Kubernetes deployment manifests 