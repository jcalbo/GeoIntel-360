Project Brief: GeoIntel-360 Dashboard (OSINT Platform)
🤖 Role
You are a Senior Full-Stack Engineer and OSINT (Open Source Intelligence) Architect. Your goal is to build a high-performance, three-tier web application for monitoring global geopolitics, cybersecurity, and economics.

🏗️ System Architecture
The application must follow a professional decoupled architecture:

Frontend (The Glass): React (Vite) + Tailwind CSS + Lucide Icons.

Middle Layer (The Gears): Python (FastAPI) acting as a logic controller and MCP (Model Context Protocol) Server.

Storage Layer (The Memory): Elasticsearch running in a Docker container for persistence and full-text search.

🛠️ Technical Specifications
1. Data Sources & Tabs
Create a 3-tab navigation system with modern transitions (Framer Motion):

Tab 1: Geopolitics: Fetch from NewsAPI/NewsData.io or specified RSS (Reuters/CFR).

Tab 2: Cybersecurity: Fetch from CISA Alerts, BleepingComputer, and The Hacker News.

Tab 3: Economics: Fetch from FRED API (St. Louis Fed) and Alpha Vantage.

2. Backend Logic (Python/FastAPI)
Aggregation: Scrape/Fetch data from the sources above.

Normalization: Map all data to a unified schema: { id, title, source, date, summary, url, category, ai_analysis }.

Deduplication: Check the url or a hash of the title against Elasticsearch before saving.

LLM Integration: Create a /summarize endpoint. It must take a news snippet and return a 3-bullet point executive summary using a configurable provider (OpenAI/Anthropic).

MCP Implementation: Include FastMCP code to expose these functions as tools for my IDE agent.

3. Persistence (Elasticsearch & Docker)
Provide a docker-compose.yml for a single-node Elasticsearch instance.

Articles must be indexed in Elasticsearch to allow for historical search across all categories.

4. UI/UX Requirements (Tailwind CSS)
Style: "Intelligence Command Center" aesthetic (Dark mode, Zinc/Slate palette).

Components: Use "Card" layouts. Each card must show:

Category Badge (e.g., "Cybersecurity" in Purple).

Source and Relative Date (e.g., "2h ago").

"Deep Analysis" Button: Triggers the LLM summarization.

Global Search: A search bar at the top that queries the Elasticsearch backend.

🚀 Execution Instructions for the Agent
Phase 1 (Infrastructure): Generate the docker-compose.yml for Elasticsearch and a requirements.txt for Python (include fastapi, elasticsearch, fastmcp, httpx, beautifulsoup4).

Phase 2 (Backend): Create the FastAPI app with routes for /news, /search, and /summarize. Ensure connection logic for Elasticsearch is robust.

Phase 4 (Frontend): Scaffold the Vite/React app. Implement the Tab state and fetch logic using TanStack Query.

Phase 5 (Refinement): Add skeleton loaders for news cards and ensure the AI summarization results are displayed in a modern modal or expandable drawer.

Context for Agent: This app runs locally on a personal computer. Handle CORS between the React frontend (3000/5173) and FastAPI backend (8000) prope
