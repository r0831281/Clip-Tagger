# Clip Tagger

Clip Tagger is a web application for uploading, analyzing, and organizing audio WAV files. It uses AI analysis to extract features like tags and musical key, allowing you to build a well-organized library of audio samples.

## Features

- Upload WAV audio files
- AI-powered analysis to detect tags (drums, instrumental, vocals, fx, and more)
- Automatic musical key detection
- Smart filename suggestions based on audio content
- Organize clips by tags and musical key
- Play audio files directly in the browser
- Edit tags and key information
- Delete clips when no longer needed

## Technology Stack

- **Frontend**: React, styled-components, react-router-dom
- **Backend**: Node.js, Express
- **Audio Analysis**: OpenAI API (with fallback to music-metadata and filename analysis)

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)

### Installation

1. Clone the repository
2. Install backend dependencies:
   ```
   cd backend
   npm install
   ```
3. Install frontend dependencies:
   ```
   cd frontend
   npm install
   ```
4. Configure OpenAI API key:
   - Create or edit `.env` file in the `backend` directory
   - Add your OpenAI API key:
     ```
     PORT=5000
     OPENAI_API_KEY=your_actual_openai_api_key
     ```
   - If you don't have an OpenAI API key, the system will fall back to analysis based on audio metadata and filename

### Running the application

You can start both the frontend and backend using the provided batch file:

```
start-app.bat
```

Or manually start them:

**Backend**:
```
cd backend
npm run dev
```

**Frontend**:
```
cd frontend
npm start
```

The backend will run on port 5000, and the frontend will be available at http://localhost:3000.

## Usage

1. Upload a WAV file using the upload page
2. The system will analyze the file using AI (if configured) or fallback methods:
   - Tags (drums, vocals, fx, instrumental, etc.)
   - Musical key detection
   - Smart name suggestions for cryptic filenames
3. Browse your collection in the library page
4. Filter and sort clips by tags or key
5. Edit clip information as needed

## AI Analysis

The application uses a multi-layered approach to audio analysis:

1. **OpenAI API** (primary method if configured):
   - Analyzes the audio content directly
   - Provides accurate tags, key detection, and name suggestions
   - Requires a valid API key in the `.env` file

2. **Music Metadata Analysis** (first fallback):
   - Extracts technical metadata from the audio file
   - Provides basic audio characteristics
   - No API key required

3. **Filename Analysis** (final fallback):
   - Extracts meaningful information from the original filename
   - Works even without internet connection
   - Always available
