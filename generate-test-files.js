// This is a utility to generate some test WAV files for development purposes
// Run with Node.js: node generate-test-files.js

const fs = require('fs');
const path = require('path');

console.log('Starting test file generation...');

// Create the uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'backend', 'uploads');
console.log(`Creating uploads directory at: ${uploadsDir}`);

try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory');
  } else {
    console.log('Uploads directory already exists');
  }
} catch (error) {
  console.error('Error creating uploads directory:', error);
}

// Define some test clips with metadata
const testClips = [
  {
    id: '1687542367000',
    filename: '1687542367000.wav',
    originalName: 'Drum Loop 120BPM.wav',
    tags: ['drums'],
    key: 'C major',
    uploadDate: new Date('2023-06-23T14:32:47.000Z'),
    path: path.join(uploadsDir, '1687542367000.wav')
  },
  {
    id: '1687542368000',
    filename: '1687542368000.wav',
    originalName: 'Vocal Sample.wav',
    tags: ['vocals'],
    key: 'A minor',
    uploadDate: new Date('2023-06-23T14:32:48.000Z'),
    path: path.join(uploadsDir, '1687542368000.wav')
  },
  {
    id: '1687542369000',
    filename: '1687542369000.wav',
    originalName: 'FX Riser.wav',
    tags: ['fx'],
    key: 'F# minor',
    uploadDate: new Date('2023-06-23T14:32:49.000Z'),
    path: path.join(uploadsDir, '1687542369000.wav')
  },
  {
    id: '1687542370000',
    filename: '1687542370000.wav',
    originalName: 'Piano Melody.wav',
    tags: ['instrumental'],
    key: 'D major',
    uploadDate: new Date('2023-06-23T14:32:50.000Z'),
    path: path.join(uploadsDir, '1687542370000.wav')
  },
  {
    id: '1687542371000',
    filename: '1687542371000.wav',
    originalName: 'Full Beat.wav',
    tags: ['drums', 'instrumental'],
    key: 'G minor',
    uploadDate: new Date('2023-06-23T14:32:51.000Z'),
    path: path.join(uploadsDir, '1687542371000.wav')
  }
];

// Create an empty WAV file (1 second of silence)
function createEmptyWavFile(filePath) {
  console.log(`Creating WAV file at: ${filePath}`);
  
  try {
    // Very basic WAV header for 1 second of silence
    const header = Buffer.from([
      0x52, 0x49, 0x46, 0x46, // "RIFF"
      0x24, 0x00, 0x00, 0x00, // Chunk size (36 + data size)
      0x57, 0x41, 0x56, 0x45, // "WAVE"
      0x66, 0x6D, 0x74, 0x20, // "fmt "
      0x10, 0x00, 0x00, 0x00, // Subchunk1 size (16 bytes)
      0x01, 0x00,             // Audio format (1 = PCM)
      0x01, 0x00,             // Number of channels (1)
      0x44, 0xAC, 0x00, 0x00, // Sample rate (44100)
      0x44, 0xAC, 0x00, 0x00, // Byte rate (44100)
      0x01, 0x00,             // Block align (1)
      0x08, 0x00,             // Bits per sample (8)
      0x64, 0x61, 0x74, 0x61, // "data"
      0x00, 0x00, 0x00, 0x00  // Subchunk2 size (0 bytes of data)
    ]);

    fs.writeFileSync(filePath, header);
    return true;
  } catch (error) {
    console.error(`Error creating WAV file at ${filePath}:`, error);
    return false;
  }
}

// Create the test clips and write them to a JSON file
const clipsJsonPath = path.join(__dirname, 'backend', 'test-clips.json');
console.log(`Will create test clips metadata file at: ${clipsJsonPath}`);

let successCount = 0;

testClips.forEach(clip => {
  const wavPath = path.join(uploadsDir, clip.filename);
  if (createEmptyWavFile(wavPath)) {
    console.log(`Created test WAV file: ${clip.filename}`);
    successCount++;
  }
});

try {
  fs.writeFileSync(clipsJsonPath, JSON.stringify(testClips, null, 2));
  console.log(`Created test clips metadata file: test-clips.json`);
} catch (error) {
  console.error('Error writing test clips metadata file:', error);
}

console.log(`Successfully created ${successCount} out of ${testClips.length} test WAV files.`);
console.log('You can import this data in the backend to have some test clips.');
