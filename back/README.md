# 🚀 Synaps

> AI-powered professional search and analysis platform with real-time results and intelligent filtering

A full-stack application that searches for people using **Exa.ai** and provides intelligent summaries and custom processing with **Claude AI**.

## 🏗️ Architecture

```
people-search-ai/
├── backend/           # FastAPI Python backend
│   ├── main.py       # FastAPI app entry point
│   ├── search_service.py    # Exa.ai search integration
│   ├── summary_service.py   # Claude AI summarization
│   ├── process_service.py   # Custom instruction processing
│   └── requirements.txt     # Python dependencies
├── frontend/         # React TypeScript frontend
│   ├── src/
│   │   └── components/PeopleSearch.tsx
│   └── package.json  # Node.js dependencies
└── package.json      # Monorepo scripts
```

## ✨ Features

### 🔍 **Search Layer**
- **Exa.ai Integration** - Real-time web search for people profiles
- **Smart Content Extraction** - Automatically extracts relevant information

### 🤖 **AI Processing Layer**
- **Claude AI Summarization** - Structures search results into person profiles
- **Custom Instructions** - Process results with natural language commands
- **Markdown Support** - Rich formatting for analysis results

### 🎨 **Frontend**
- **Beautiful UI** - Modern React interface with Tailwind CSS
- **Real-time Search** - Live connection to backend API
- **Two-Column Results** - Structured profiles + custom analysis
- **Responsive Design** - Works on all devices

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ 
- **Python** 3.10+
- **API Keys**:
  - Exa.ai API key
  - Claude/Anthropic API key

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd people-search-ai

# Install everything
npm run install:all
```

### 2. Environment Setup
Create `backend/.env`:
```env
EXA_API_KEY=your_exa_api_key_here
CLAUDE_API_KEY=your_claude_api_key_here
```

### 3. Run Everything
```bash
# Start both frontend and backend
npm run dev
```

**That's it!** 🎉
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:8001

## 📋 Available Scripts

### 🛠️ Development
```bash
npm run dev              # Start both frontend and backend
npm run dev:frontend     # Start only frontend (port 8080)
npm run dev:backend      # Start only backend (port 8001)
```

### 📦 Installation
```bash
npm run install:all      # Install all dependencies
npm run install:frontend # Install only frontend deps
npm run install:backend  # Install only backend deps
```

### 🏗️ Production
```bash
npm run build           # Build frontend for production
npm run start           # Start both in production mode
```

### 🧹 Maintenance
```bash
npm run cleanup         # Clean build artifacts and caches
```

## 🔧 API Usage

### Search Endpoint
```bash
POST http://localhost:8001/search
Content-Type: application/json

{
  "query": "OpenAI executive team",
  "instruction": "Create bullet points with CEO and CTO only"
}
```

### Response Format
```json
{
  "response": "Structured JSON with person profiles...",
  "result": "Custom processed result based on instruction..."
}
```

## 💡 Example Queries

### Basic Search
- **Query**: `"Sam Altman"`
- **Instruction**: `"Create a brief summary"`

### Executive Search
- **Query**: `"OpenAI executive team"`
- **Instruction**: `"Show only CEO and CTO in bullet points"`

### Detailed Analysis
- **Query**: `"YC partners"`
- **Instruction**: `"Format as table with LinkedIn profiles and investment focus"`

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **Exa.ai** - Web search and content extraction
- **Claude AI** - Text processing and summarization
- **Pydantic** - Data validation
- **python-dotenv** - Environment management

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **Shadcn/ui** - Component library
- **React Markdown** - Markdown rendering

## 🏗️ Project Structure

### Backend Services
```python
# Three-layer architecture
SearchService    # Exa.ai integration
SummaryService   # Claude AI summarization  
ProcessService   # Custom instruction processing
```

### Frontend Components
```typescript
PeopleSearch.tsx  # Main search interface
- Search form with query + instructions
- Two-column results display
- Real-time API integration
```

## 🔐 Environment Variables

### Backend (.env)
```env
EXA_API_KEY=your_exa_api_key
CLAUDE_API_KEY=your_claude_api_key
```

## 🚦 Development Workflow

1. **Start Development**
   ```bash
   npm run dev
   ```

2. **Make Changes**
   - Backend: Edit files in `backend/`
   - Frontend: Edit files in `frontend/src/`
   - Both auto-reload on changes

3. **Test API**
   ```bash
   curl -X POST "http://localhost:8001/search" \
     -H "Content-Type: application/json" \
     -d '{"query": "test query"}'
   ```

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Built with ❤️ by [Ghiles Djebara](https://linkedin.com/in/ghiles-djebara-7005b417a)** 