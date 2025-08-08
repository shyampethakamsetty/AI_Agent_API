# NOTES

## What was AI-generated
- Initial scaffolding of `README.md` examples and some endpoint curl snippets
- Boilerplate for `server.ts` middleware list
- Outline for `PROJECT_SUMMARY.md`

The following implementation work was reviewed by me:
- `src/services/agent.ts` end-to-end message flow, document loading, stats, clear
- `src/services/memory.ts` session memory store and memory summary (last 2)
- `src/services/plugins.ts` weather + math plugins, intent detection and execution
- `src/services/vectorDB.ts` in-memory vector store, search, and stats
- `src/utils/chunking.ts` chunking and markdown processing
- `src/services/llm.ts` OpenAI integration and prompt construction (system, memory summary, retrieved context, plugin outputs)
- `src/routes/agent.ts` API routes
- `src/types/index.ts` types for messages, memory, RAG, plugins, prompt context, configs

## Bugs faced and how I solved them
- OpenAI API errors when embedding large text: switched to chunked embedding and added error handling with clear messages.
- Location extraction for weather queries occasionally misfired on common words: added filtering of common stop words and multiple regex patterns.
- RAG sometimes didn’t run for plugin queries: changed flow to always run vector search each turn.
- Since I used Render for backend deployment, I faced server down issue which it shutsdown server if no request was recieved for 15 mins, So i used Uptime Robot to keep sending requests (health checks) for every 5 minutes

## How the agent routes plugin calls + embeds memory + context
1. Detects intent via keyword scan and light parameter extraction.
2. Executes relevant plugins (weather/math) and collects outputs.
3. Always performs vector search on the user message to retrieve top-k (3) chunks.
4. Builds prompt with:
   - System instructions
   - Memory summary (last 2 messages)
   - Recent memory context (last 4 messages)
   - Retrieved document chunks
   - Plugin outputs
5. Sends prompt to OpenAI and returns the assistant response. 