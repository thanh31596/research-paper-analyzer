# Research Paper Analyzer

An AI-powered web application for analyzing and discussing research papers using Claude AI. Upload PDF research papers and get comprehensive analysis with interactive Q&A capabilities.

## Features

- 📄 PDF upload and text extraction
- 🧠 AI-powered paper analysis
- 💬 Interactive Q&A with conversation memory
- 🔊 Text-to-speech functionality
- 🎯 Specialized for recommender systems research
- 📱 Responsive design

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Anthropic API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd research-paper-analyzer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` and add your Anthropic API key:
   ```
   # For backend proxy approach
   ANTHROPIC_API_KEY=your_actual_api_key_here
   
   # For CORS proxy approach (React app)
   REACT_APP_ANTHROPIC_API_KEY=your_actual_api_key_here
   ```

4. **Get your Anthropic API key**
   - Go to [Anthropic Console](https://console.anthropic.com/)
   - Create an account and get your API key
   - Add it to the `.env` file

### Running the Application

#### Option 1: Backend Proxy (Recommended)
```bash
# Run both frontend and backend concurrently
npm run dev
```

This will start:
- React development server on http://localhost:3000
- Express backend server on http://localhost:3001

#### Option 2: CORS Proxy (Quick Setup)
```bash
# Run only the React development server
npm start
```

This uses a CORS proxy service and runs only the frontend.

#### Production Mode
```bash
# Build the React app
npm run build

# Start the production server
npm run server
```

The app will be available at http://localhost:3001

### Deployment

For GitHub Pages deployment:
```bash
npm run deploy
```

## Troubleshooting

### CORS Errors
- **Backend Proxy**: The backend proxy handles CORS issues
- **CORS Proxy**: Uses cors-anywhere.herokuapp.com service
- Make sure the server is running on port 3001 (for backend approach)

### API Key Issues
- Ensure your `.env` file contains the correct API key
- Check that the API key has sufficient credits
- For CORS proxy approach, use `REACT_APP_ANTHROPIC_API_KEY`
- For backend proxy approach, use `ANTHROPIC_API_KEY`

### PDF Processing Errors
- Ensure the PDF file is not corrupted
- Try with a smaller PDF file first
- Check browser console for detailed error messages

## Architecture

- **Frontend**: React with Tailwind CSS
- **Backend**: Express.js proxy server
- **AI**: Anthropic Claude API
- **Deployment**: GitHub Pages

## API Endpoints

- `POST /api/analyze` - Proxy endpoint for Anthropic API calls

## License

MIT License 