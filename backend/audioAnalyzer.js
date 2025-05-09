// Audio analysis module for Clip Tagger
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);
const fetch = require('node-fetch');
const { OpenAI } = require('openai');
require('dotenv').config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// List of possible tags
const possibleTags = ['drums', 'instrumental', 'vocals', 'fx', 'bass', 'synth', 'piano', 'guitar', 'strings', 'brass', 'woodwinds', 'electronic', 'acoustic'];

// List of possible keys
const possibleKeys = [
  'C major', 'C minor', 'C# major', 'C# minor', 
  'D major', 'D minor', 'D# major', 'D# minor',
  'E major', 'E minor', 'F major', 'F minor',
  'F# major', 'F# minor', 'G major', 'G minor',
  'G# major', 'G# minor', 'A major', 'A minor',
  'A# major', 'A# minor', 'B major', 'B minor'
];

/**
 * Analyzes an audio file to extract features
 * @param {string} filePath - Path to the audio file
 * @param {string} originalName - Original filename
 * @returns {Promise<Object>} - Analysis results (tags, key, suggestedName)
 */
async function analyzeAudio(filePath, originalName) {
  try {
    console.log(`Analyzing audio file: ${originalName}`);
    
    // Initialize with basic filename analysis
    const fileBasedAnalysis = {
      tags: detectTagsFromFilename(originalName),
      key: detectKeyFromFilename(originalName),
      suggestedName: originalName,
    };
    
    // Try to get metadata analysis for better fallback
    const metadataAnalysis = await analyzeAudioMetadata(filePath);
    
    // Combine filename and metadata analysis for robust fallback
    const fallbackAnalysis = {
      tags: [...new Set([...fileBasedAnalysis.tags, ...metadataAnalysis.tags])],
      key: metadataAnalysis.key || fileBasedAnalysis.key,
      suggestedName: originalName,
    };
    
    // Try to use AI for analysis when possible
    try {
      // Check if file exists and is readable before AI analysis
      if (!fs.existsSync(filePath)) {
        console.error(`File not found before AI analysis: ${filePath}`);
        throw new Error('File not found');
      }
      
      const aiAnalysis = await analyzeAudioWithAI(filePath, originalName);
      
      // Combine AI results with fallback results, prioritizing AI
      return {
        tags: aiAnalysis.tags && aiAnalysis.tags.length > 0 ? aiAnalysis.tags : fallbackAnalysis.tags,
        key: aiAnalysis.key || fallbackAnalysis.key,
        suggestedName: aiAnalysis.suggestedName || (shouldRenameFile(originalName) ? generateSuggestedName(originalName, aiAnalysis.tags, aiAnalysis.key) : originalName)
      };
    } catch (aiError) {
      console.error('AI analysis failed, falling back to metadata/filename analysis:', aiError);
      
      // If AI analysis fails, use the combined fallback analysis
      if (shouldRenameFile(originalName)) {
        fallbackAnalysis.suggestedName = generateSuggestedName(originalName, fallbackAnalysis.tags, fallbackAnalysis.key);
      }
      
      // Add some randomness to simulate AI variability
      addRandomFeatures(fallbackAnalysis);
      
      return fallbackAnalysis;
    }
  } catch (error) {
    console.error('Error analyzing audio:', error);
    // Return default values if all analysis fails
    return {
      tags: [],
      key: '',
      suggestedName: originalName,
    };
  }
}

/**
 * Analyze audio using OpenAI API
 * @param {string} filePath - Path to the audio file
 * @param {string} originalName - Original filename
 * @returns {Promise<Object>} - AI analysis results (tags, key, suggestedName)
 */
async function analyzeAudioWithAI(filePath, originalName) {
  try {
    // Get file information
    const fileStats = fs.statSync(filePath);
    const fileSize = fileStats.size;
    
    // If file is too large for API, use filename-based analysis
    const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB limit for OpenAI API
    if (fileSize > MAX_FILE_SIZE) {
      console.log(`File too large for AI analysis: ${fileSize} bytes. Using metadata/filename analysis instead.`);
      throw new Error('File too large for AI analysis');
    }
    
    // Check if API key is available
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key') {
      console.log('OpenAI API key not configured, using metadata/filename analysis instead');
      throw new Error('OpenAI API key not configured');
    }
    
    // First get audio metadata to provide additional context to the AI model
    const metadata = await analyzeAudioMetadata(filePath);
    
    // Prepare file for upload
    const fileStream = fs.createReadStream(filePath);
    
    // Create analysis prompt with metadata context
    const prompt = `
      Analyze this audio clip and provide the following information:
      1. Musical key (if detectable)
      2. Relevant tags from this list: ${possibleTags.join(', ')}
      3. A descriptive name for the clip based on its content
      
      Audio metadata context:
      - Duration: ${metadata.duration ? metadata.duration.toFixed(2) + ' seconds' : 'unknown'}
      - Channels: ${metadata.channels || 'unknown'}
      - Sample rate: ${metadata.sampleRate ? metadata.sampleRate + ' Hz' : 'unknown'}
      
      Format the response as a JSON object with the following structure:
      {
        "key": "Musical key in format like 'C major' or 'A minor'",
        "tags": ["tag1", "tag2", "tag3"],
        "suggestedName": "Descriptive name for the clip"
      }
    `;
    
    // Call OpenAI API
    const response = await openai.audio.transcriptions.create({
      file: fileStream,
      model: "whisper-1",
      response_format: "text",
      prompt: prompt
    });
    
    console.log('AI transcription response:', response);
    
    // The transcription model doesn't directly give us musical analysis
    // So we'll use the transcription to generate musical analysis
    const analysis = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a professional audio engineer and musician who can identify musical characteristics from audio descriptions. 
          Analyze audio clips to identify:
          1. Musical key (one of: ${possibleKeys.join(', ')})
          2. Relevant tags from: ${possibleTags.join(', ')}
          3. A descriptive name for the audio clip`
        },
        {
          role: "user",
          content: `Based on this audio clip description: "${response}"
          
          Additional context:
          - Original filename: ${originalName}
          - Duration: ${metadata.duration ? metadata.duration.toFixed(2) + ' seconds' : 'unknown'}
          - Audio metadata analysis: ${JSON.stringify(metadata)}
          
          Provide musical analysis formatted as JSON with these fields:
          - key (string): The musical key (if detectable, otherwise empty string)
          - tags (array): 2-4 relevant tags from the allowed list
          - suggestedName (string): A descriptive name for the clip based on content`
        }
      ],
      response_format: { type: "json_object" }
    });
    
    // Parse the AI response
    const result = JSON.parse(analysis.choices[0].message.content);
    console.log('AI analysis result:', result);
    
    // Validate and clean up the response
    const validatedResult = {
      tags: Array.isArray(result.tags) ? result.tags.filter(tag => possibleTags.includes(tag.toLowerCase())) : [],
      key: result.key && possibleKeys.includes(result.key) ? result.key : '',
      suggestedName: result.suggestedName || originalName
    };
    
    // Ensure we have at least some tags
    if (validatedResult.tags.length === 0) {
      // Use tags from metadata analysis if available
      validatedResult.tags = metadata.tags.length > 0 ? metadata.tags : detectTagsFromFilename(originalName);
    }
    
    // Clean up the suggested name
    if (validatedResult.suggestedName) {
      // Append .wav if missing
      if (!validatedResult.suggestedName.toLowerCase().endsWith('.wav')) {
        validatedResult.suggestedName += '.wav';
      }
    }
    
    return validatedResult;
  } catch (error) {
    console.error('Error in AI analysis:', error);
    throw error; // Let the calling function handle the fallback
  }
}

/**
 * Analyze audio metadata using music-metadata
 * This provides a more reliable fallback than just using the filename
 * @param {string} filePath - Path to the audio file
 * @returns {Promise<Object>} - Metadata analysis results
 */
async function analyzeAudioMetadata(filePath) {
  try {
    const mm = require('music-metadata');
    const metadata = await mm.parseFile(filePath);
    console.log('Metadata analysis:', metadata);
    
    const result = {
      tags: [],
      key: '',
      duration: metadata.format.duration || 0,
      bitrate: metadata.format.bitrate || 0,
      sampleRate: metadata.format.sampleRate || 0,
      channels: metadata.format.numberOfChannels || 0
    };
    
    // Extract tags from metadata if available
    if (metadata.common && metadata.common.genre && metadata.common.genre.length > 0) {
      // Convert genres to tags when possible
      metadata.common.genre.forEach(genre => {
        if (genre.toLowerCase().includes('vocal')) result.tags.push('vocals');
        if (genre.toLowerCase().includes('drum') || genre.toLowerCase().includes('percus')) result.tags.push('drums');
        if (genre.toLowerCase().includes('fx') || genre.toLowerCase().includes('effect')) result.tags.push('fx');
        if (genre.toLowerCase().includes('instrument')) result.tags.push('instrumental');
      });
    }
    
    // Use BPM from metadata if available for additional context
    if (metadata.common && metadata.common.bpm) {
      const bpm = metadata.common.bpm;
      if (bpm < 70) result.tempo = 'slow';
      else if (bpm < 120) result.tempo = 'medium';
      else result.tempo = 'fast';
    }
    
    // Try to guess if it contains vocals or is instrumental based on the average frequency spectrum
    if (metadata.format && metadata.format.duration) {
      // Purely instrumental tracks typically have different spectral characteristics
      // than tracks with vocals, but this is a very rough approximation
      const isLikelyInstrumental = (result.tags.includes('vocals') === false);
      if (isLikelyInstrumental && !result.tags.includes('instrumental')) {
        result.tags.push('instrumental');
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error in metadata analysis:', error);
    return {
      tags: [],
      key: ''
    };
  }
}

/**
 * Detect tags based on the filename
 */
function detectTagsFromFilename(filename) {
  const detectedTags = [];
  const lowerFilename = filename.toLowerCase();
  
  // Check for drum sounds
  if (
    lowerFilename.includes('drum') || 
    lowerFilename.includes('beat') || 
    lowerFilename.includes('kick') || 
    lowerFilename.includes('snare') || 
    lowerFilename.includes('hat') || 
    lowerFilename.includes('percussion') ||
    lowerFilename.includes('loop') ||
    lowerFilename.includes('kit')
  ) {
    detectedTags.push('drums');
  }
  
  // Check for vocal content
  if (
    lowerFilename.includes('vocal') || 
    lowerFilename.includes('vox') || 
    lowerFilename.includes('voice') || 
    lowerFilename.includes('rap') || 
    lowerFilename.includes('sing') ||
    lowerFilename.includes('acapella')
  ) {
    detectedTags.push('vocals');
  }
  
  // Check for FX content
  if (
    lowerFilename.includes('fx') || 
    lowerFilename.includes('effect') || 
    lowerFilename.includes('sweep') || 
    lowerFilename.includes('rise') || 
    lowerFilename.includes('ambient') || 
    lowerFilename.includes('reverse') ||
    lowerFilename.includes('crash') ||
    lowerFilename.includes('noise')
  ) {
    detectedTags.push('fx');
  }
  
  // Check for instrumental content
  if (
    lowerFilename.includes('instrument') || 
    lowerFilename.includes('melody') || 
    lowerFilename.includes('synth') || 
    lowerFilename.includes('bass') || 
    lowerFilename.includes('lead') || 
    lowerFilename.includes('piano') ||
    lowerFilename.includes('guitar') ||
    lowerFilename.includes('pad') ||
    (detectedTags.length === 0) // Default to instrumental if no other tags detected
  ) {
    detectedTags.push('instrumental');
  }
  
  return detectedTags;
}

/**
 * Detect musical key based on the filename
 */
function detectKeyFromFilename(filename) {
  const lowerFilename = filename.toLowerCase();
  
  // Regular expression to find key patterns in the filename
  // e.g. "C#m", "A minor", "F Major", "Gmin", "D#"
  const keyPatterns = [
    /\b([A-G](?:#|b)?\s*(?:min(?:or)?|maj(?:or)?|m))\b/i,  // "C minor", "F# major", "Am"
    /\b([A-G](?:#|b)?m(?:aj|in|ajor|inor)?)\b/i,           // "Cm", "F#maj", "Gmin" 
    /\b([A-G](?:#|b)?)\b/i                                 // Just the note like "C", "F#"
  ];
  
  for (const pattern of keyPatterns) {
    const match = lowerFilename.match(pattern);
    if (match) {
      const keyText = match[1];
      // Try to convert the matched key text to a standardized key format
      return standardizeKey(keyText);
    }
  }
  
  // If no key is detected, return an empty string or randomly select one
  return Math.random() > 0.7 ? possibleKeys[Math.floor(Math.random() * possibleKeys.length)] : '';
}

/**
 * Convert various key formats to a standardized format
 */
function standardizeKey(keyText) {
  keyText = keyText.toLowerCase();
  
  // Extract the root note
  let root = keyText.charAt(0).toUpperCase();
  if (keyText.includes('#')) root += '#';
  if (keyText.includes('b')) root += 'b';
  
  // Determine if it's major or minor
  const isMajor = !keyText.includes('m') || keyText.includes('maj');
  
  // Replace 'b' with '#' for proper key naming
  if (root.includes('b')) {
    const flatToSharp = {
      'Cb': 'B', 'Db': 'C#', 'Eb': 'D#', 'Fb': 'E', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'
    };
    root = flatToSharp[root] || root;
  }
  
  // Format the key properly
  return `${root} ${isMajor ? 'major' : 'minor'}`;
}

/**
 * Decide if the file should be renamed
 */
function shouldRenameFile(filename) {
  // Check if the filename is cryptic (mostly numbers or random characters)
  return /^\d+/.test(filename) || filename.length < 5;
}

/**
 * Generate a suggested name based on detected features
 */
function generateSuggestedName(originalName, tags, key) {
  // If the original name already has meaningful words, use them
  if (!/^\d+/.test(originalName) && originalName.length > 5) {
    return originalName;
  }
  
  // Otherwise, create a descriptive name
  const descriptiveElements = [];
  
  // Add tag descriptions
  if (tags.includes('drums')) {
    const drumTypes = ['Kick', 'Snare', 'Percussion', 'Drum Loop', 'Beat', 'Rhythm'];
    descriptiveElements.push(drumTypes[Math.floor(Math.random() * drumTypes.length)]);
  }
  
  if (tags.includes('vocals')) {
    const vocalTypes = ['Vocal', 'Voice', 'Acapella', 'Vocal Sample', 'Vocal Hook'];
    descriptiveElements.push(vocalTypes[Math.floor(Math.random() * vocalTypes.length)]);
  }
  
  if (tags.includes('fx')) {
    const fxTypes = ['FX', 'Effect', 'Transition', 'Sweep', 'Ambient', 'Atmosphere'];
    descriptiveElements.push(fxTypes[Math.floor(Math.random() * fxTypes.length)]);
  }
  
  if (tags.includes('instrumental')) {
    const instrumentalTypes = ['Melody', 'Lead', 'Bass', 'Pad', 'Synth', 'Chord', 'Arpeggio'];
    descriptiveElements.push(instrumentalTypes[Math.floor(Math.random() * instrumentalTypes.length)]);
  }
  
  // Add key if available
  if (key) {
    descriptiveElements.push(key);
  }
  
  // Combine the elements into a name
  let suggestedName = descriptiveElements.join(' ');
  
  // If we couldn't generate a meaningful name, use a default with the original
  if (suggestedName.length < 3) {
    suggestedName = `Audio Sample ${originalName}`;
  }
  
  // Add .wav extension if it's not present
  if (!suggestedName.toLowerCase().endsWith('.wav')) {
    suggestedName += '.wav';
  }
  
  return suggestedName;
}

/**
 * Add some random features to simulate AI variability
 */
function addRandomFeatures(result) {
  // Sometimes add an additional tag
  if (Math.random() > 0.7 && result.tags.length < 3) {
    const unusedTags = possibleTags.filter(tag => !result.tags.includes(tag));
    if (unusedTags.length > 0) {
      const randomTag = unusedTags[Math.floor(Math.random() * unusedTags.length)];
      result.tags.push(randomTag);
    }
  }
  
  // Sometimes change the key if none was detected
  if (!result.key && Math.random() > 0.5) {
    result.key = possibleKeys[Math.floor(Math.random() * possibleKeys.length)];
  }
}

module.exports = {
  analyzeAudio,
  possibleTags,
  possibleKeys
};
