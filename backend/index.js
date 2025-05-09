const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { analyzeAudio } = require('./audioAnalyzer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage for uploaded files
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// Filter only .wav files
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'audio/wav') {
        cb(null, true);
    } else {
        cb(new Error('Only .wav files are allowed!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// In-memory database for clips (replace with a real database in production)
let clips = [];

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)){
    fs.mkdirSync(dataDir, { recursive: true });
}

// Try to load test clips if available
const testClipsPath = path.join(dataDir, 'test-clips.json');
if (fs.existsSync(testClipsPath)) {    try {
        const testClipsData = fs.readFileSync(testClipsPath, 'utf8');
        clips = JSON.parse(testClipsData);
        
        // Fix any path issues that might occur after restart
        clips = clips.map(clip => {
            // If the file exists in uploads directory but the path is incorrect
            const filename = path.basename(clip.path);
            const expectedPath = path.join(uploadsDir, filename);
            
            if (fs.existsSync(expectedPath)) {
                return {
                    ...clip,
                    path: expectedPath
                };
            }
            return clip;
        });
        
        console.log(`Loaded ${clips.length} test clips`);
    } catch (error) {
        console.error('Error loading test clips:', error);
    }
}

// Function to save clips to the JSON file
const saveClipsToFile = () => {
    try {
        // First create a backup of the existing file if it exists
        if (fs.existsSync(testClipsPath)) {
            const backupPath = path.join(dataDir, 'test-clips.json.backup');
            fs.copyFileSync(testClipsPath, backupPath);
        }
        
        // Then save the current clips data
        fs.writeFileSync(testClipsPath, JSON.stringify(clips, null, 4), 'utf8');
        console.log(`Saved ${clips.length} clips to file`);
    } catch (error) {
        console.error('Error saving clips to file:', error);
    }
};

// Function to validate clips - removes any clips whose files no longer exist
const validateClips = () => {
    const validClips = clips.filter(clip => {
        const exists = fs.existsSync(clip.path);
        if (!exists) {
            console.log(`File not found for clip: ${clip.originalName} (${clip.path})`);
        }
        return exists;
    });
    
    if (validClips.length !== clips.length) {
        console.log(`Removed ${clips.length - validClips.length} clips with missing files`);
        clips = validClips;
        saveClipsToFile();
    }
};

// Validate clips on startup
validateClips();

// Routes
app.post('/api/upload', upload.array('audioFiles'), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        console.log(`Processing ${req.files.length} uploaded files...`);
        console.log(`Upload directory: ${uploadsDir}`);
        
        // Check if upload directory exists and is writable
        if (!fs.existsSync(uploadsDir)) {
            console.error(`Uploads directory does not exist: ${uploadsDir}`);
            fs.mkdirSync(uploadsDir, { recursive: true });
            console.log(`Created uploads directory: ${uploadsDir}`);
        }

        const uploadedClips = [];
        // Process each uploaded file
        const fileData = req.body.fileData ? JSON.parse(req.body.fileData) : [];
        
        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];
            
            // Verify file exists before processing
            if (!fs.existsSync(file.path)) {
                console.error(`File not found: ${file.path}`);
                return res.status(500).json({ error: 'File not found on disk. It may have been moved or deleted.' });
            }
            
            // Get the file metadata if provided, otherwise use empty defaults
            const fileMetadata = fileData[i] || {};
            
            // Analyze the audio file using AI
            const analysis = await analyzeAudio(file.path, file.originalname);
            
            // Use user-provided metadata if available, otherwise use AI-detected features
            const tags = fileMetadata.tags && fileMetadata.tags.length > 0 
                ? fileMetadata.tags 
                : analysis.tags;
                
            const key = fileMetadata.key && fileMetadata.key.length > 0
                ? fileMetadata.key
                : analysis.key;
                
            // Use the original filename or a suggested name if the original is cryptic
            const originalName = fileMetadata.name && fileMetadata.name.length > 0
                ? fileMetadata.name
                : analysis.suggestedName || file.originalname;
            
            const newClip = {
                id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
                filename: file.filename,
                originalName: originalName,
                path: file.path,
                tags: tags,
                key: key,
                uploadDate: new Date(),
                aiAnalyzed: true, // Mark as analyzed by AI
                detectedTags: analysis.tags, // Store original AI-detected tags
                detectedKey: analysis.key // Store original AI-detected key
            };

            clips.push(newClip);
            uploadedClips.push(newClip);
        }
          saveClipsToFile(); // Save to file after adding new clips
        res.status(201).json({ clips: uploadedClips });
    } catch (error) {
        console.error('Error uploading files:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all clips
app.get('/api/clips', (req, res) => {
    res.json(clips);
});

// Update clip details
app.put('/api/clips/:id', (req, res) => {
    const { id } = req.params;
    const { tags, key, name } = req.body;
    
    const clipIndex = clips.findIndex(clip => clip.id === id);
    
    if (clipIndex === -1) {
        return res.status(404).json({ error: 'Clip not found' });
    }
    
    if (tags) clips[clipIndex].tags = tags;
    if (key) clips[clipIndex].key = key;
      // Rename the file on disk if the name has changed
    if (name && name !== clips[clipIndex].originalName) {
        const currentFilePath = clips[clipIndex].path;
        const fileDir = path.dirname(currentFilePath);
        
        // Sanitize and validate the filename
        let newFilename = name.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9\-\.]/g, '');
            
        // Make sure filename doesn't already exist in this directory
        const existingFilenames = clips
            .filter(clip => clip.id !== id && path.dirname(clip.path) === fileDir)
            .map(clip => clip.filename.toLowerCase());
            
        if (existingFilenames.includes(newFilename.toLowerCase())) {
            // Add a timestamp to make filename unique
            const timestamp = Date.now();
            const fileNameParts = newFilename.split('.');
            if (fileNameParts.length > 1) {
                const ext = fileNameParts.pop();
                newFilename = `${fileNameParts.join('.')}-${timestamp}.${ext}`;
            } else {
                newFilename = `${newFilename}-${timestamp}`;
            }
        }
        
        const newFilePath = path.join(fileDir, newFilename);
        
        try {
            // Check if current file exists
            if (!fs.existsSync(currentFilePath)) {
                return res.status(404).json({ error: 'Source file not found on disk' });
            }
            
            // Check if destination would overwrite an existing file
            if (fs.existsSync(newFilePath) && currentFilePath !== newFilePath) {
                return res.status(409).json({ error: 'A file with that name already exists' });
            }
            
            // Rename the physical file
            fs.renameSync(currentFilePath, newFilePath);
            
            // Update the clip information
            clips[clipIndex].originalName = name;
            clips[clipIndex].filename = newFilename;
            clips[clipIndex].path = newFilePath;
        } catch (error) {
            console.error('Error renaming file:', error);
            return res.status(500).json({ error: `Error renaming file on disk: ${error.message}` });
        }
    } else if (name) {        clips[clipIndex].originalName = name;
    }
    
    saveClipsToFile(); // Save to file after updating clip
    res.json(clips[clipIndex]);
});

// Delete clip
app.delete('/api/clips/:id', (req, res) => {
    const { id } = req.params;
    
    const clipIndex = clips.findIndex(clip => clip.id === id);
    
    if (clipIndex === -1) {
        return res.status(404).json({ error: 'Clip not found' });
    }
    
    // Delete the file
    try {
        fs.unlinkSync(clips[clipIndex].path);
    } catch (error) {
        console.error('Error deleting file:', error);
    }    
    clips = clips.filter(clip => clip.id !== id);
    saveClipsToFile(); // Save to file after deleting clip
    
    res.status(204).send();
});

// Health check endpoint for Docker
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
