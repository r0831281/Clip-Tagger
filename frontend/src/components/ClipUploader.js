import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { uploadClips } from '../services/api';
import LoadingSpinner from './LoadingSpinner';

const UploaderContainer = styled.div`
  background-color: #f9f9f9;
  border-radius: 10px;
  padding: 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  margin: 0 auto;
`;

const Title = styled.h2`
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
  text-align: center;
`;

const UploadForm = styled.form`
  display: flex;
  flex-direction: column;
`;

const DropZone = styled.div`
  border: 2px dashed #ccc;
  border-radius: 6px;
  padding: 60px 20px;
  text-align: center;
  margin-bottom: 20px;
  cursor: pointer;
  transition: border-color 0.2s ease;
  background-color: ${props => props.isDragActive ? '#e6f7ff' : 'white'};
  border-color: ${props => props.isDragActive ? '#0066cc' : '#ccc'};

  &:hover {
    border-color: #0066cc;
  }
`;

const FileInput = styled.input`
  display: none;
`;

const UploadButton = styled.button`
  background-color: #0066cc;
  color: white;
  font-weight: 600;
  border: none;
  border-radius: 4px;
  padding: 12px 20px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  margin-top: 10px;

  &:hover {
    background-color: #0055aa;
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const StatusMessage = styled.div`
  margin-top: 20px;
  padding: 15px;
  border-radius: 4px;
  text-align: center;
  background-color: ${props => props.isError ? '#ffebee' : '#e8f5e9'};
  color: ${props => props.isError ? '#c62828' : '#2e7d32'};
  display: ${props => props.message ? 'block' : 'none'};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  animation: fadeIn 0.3s ease-in-out;
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const SelectedFilesList = styled.div`
  margin: 10px 0;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
`;

const SelectedFile = styled.div`
  padding: 10px;
  background-color: #e3f2fd;
  border-bottom: 1px solid #bbdefb;
  display: flex;
  justify-content: space-between;
  align-items: center;

  &:last-child {
    border-bottom: none;
  }
`;

const FileName = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
`;

const FileSize = styled.span`
  margin: 0 10px;
  color: #555;
  font-size: 0.9em;
`;

const RemoveButton = styled.button`
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 0.8em;
  transition: background-color 0.2s;

  &:hover {
    background-color: #d32f2f;
  }
`;

const ProgressContainer = styled.div`
  margin-top: 15px;
  width: 100%;
  background-color: #e0e0e0;
  border-radius: 4px;
  height: 10px;
  overflow: hidden;
`;

const ProgressBar = styled.div`
  height: 100%;
  background-color: #4caf50;
  width: ${props => `${props.progress}%`};
  transition: width 0.3s ease-in-out;
`;

const EditButton = styled.button`
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  margin-left: 8px;
  cursor: pointer;
  font-size: 0.8em;
  transition: background-color 0.2s;

  &:hover {
    background-color: #1976d2;
  }
`;

const MetadataPanel = styled.div`
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 15px;
  margin-top: 10px;
  margin-bottom: 15px;
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
`;

const Select = styled.select`
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
  
  input {
    margin-right: 5px;
  }
`;

const AITag = styled.span`
  background-color: #e3f2fd;
  border: 1px solid #bbdefb;
  border-radius: 12px;
  padding: 3px 8px;
  margin-right: 5px;
  font-size: 0.8em;
  color: #1976d2;
  display: inline-block;
  margin-bottom: 5px;
`;

const AISuggestion = styled.div`
  margin-top: 10px;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
  border-left: 3px solid #2196f3;
  font-size: 0.9em;
`;

const SuggestionTitle = styled.div`
  font-weight: bold;
  margin-bottom: 5px;
  color: #1976d2;
`;

const SuggestionContent = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 5px;
`;

const ApplyButton = styled.button`
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  margin-top: 5px;
  cursor: pointer;
  font-size: 0.8em;

  &:hover {
    background-color: #1976d2;
  }
`;

const ClipUploader = () => {
  const [files, setFiles] = useState([]);
  const [fileMetadata, setFileMetadata] = useState([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editingFileIndex, setEditingFileIndex] = useState(null);
  const [analyzedClips, setAnalyzedClips] = useState([]);
  const fileInputRef = useRef(null);

  const allTags = ['drums', 'instrumental', 'vocals', 'fx'];
  const allKeys = [
    '', 'C major', 'C minor', 'C# major', 'C# minor', 
    'D major', 'D minor', 'D# major', 'D# minor',
    'E major', 'E minor', 'F major', 'F minor',
    'F# major', 'F# minor', 'G major', 'G minor',
    'G# major', 'G# minor', 'A major', 'A minor',
    'A# major', 'A# minor', 'B major', 'B minor'
  ];

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files);
    validateAndSetFiles(selectedFiles);
  };

  const validateAndSetFiles = (selectedFiles) => {
    setMessage('');
    
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    const validFiles = [];
    const invalidFiles = [];
    
    selectedFiles.forEach(file => {
      if (!file.name.toLowerCase().endsWith('.wav')) {
        invalidFiles.push({ file, reason: 'Not a .wav file' });
      } else if (file.size > 10 * 1024 * 1024) { // 10MB limit
        invalidFiles.push({ file, reason: 'Exceeds 10MB size limit' });
      } else {
        validFiles.push(file);
      }
    });
    
    if (invalidFiles.length > 0) {
      const invalidMessages = invalidFiles.map(invalid => 
        `"${invalid.file.name}": ${invalid.reason}`
      );
      setMessage(`Some files couldn't be added: ${invalidMessages.join(', ')}`);
      setIsError(true);
    }
    
    if (validFiles.length > 0) {
      const newFiles = [...files, ...validFiles];
      setFiles(newFiles);
      
      // Initialize metadata for new files
      const newMetadata = [...fileMetadata];
      validFiles.forEach(file => {
        newMetadata.push({ tags: [], key: '' });
      });
      setFileMetadata(newMetadata);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = () => {
    setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    validateAndSetFiles(droppedFiles);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (files.length === 0) {
      setMessage('Please select at least one file first');
      setIsError(true);
      return;
    }
    
    setIsUploading(true);
    setMessage(`Uploading ${files.length} clip${files.length > 1 ? 's' : ''}...`);
    setIsError(false);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('audioFiles', file);
      });
        const response = await uploadClips(formData, fileMetadata, (progress) => {
        setUploadProgress(progress);
      });
      
      const uploadedCount = response.clips.length;
      
      if (uploadedCount > 0) {
        setMessage(`Successfully uploaded ${uploadedCount} clip${uploadedCount > 1 ? 's' : ''}.`);
        // Store the analyzed clips
        setAnalyzedClips(response.clips);
      } else {
        setMessage('Upload completed, but no clips were processed.');
      }
      
      setIsError(false);
      setFiles([]);
      setFileMetadata([]);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      setMessage(`Error uploading files: ${error.message || 'Unknown error'}`);
      setIsError(true);
    } finally {
      setIsUploading(false);
    }
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemoveFile = (indexToRemove) => {
    setFiles(files.filter((_, index) => index !== indexToRemove));
    setFileMetadata(fileMetadata.filter((_, index) => index !== indexToRemove));
    if (editingFileIndex === indexToRemove) {
      setEditingFileIndex(null);
    } else if (editingFileIndex > indexToRemove) {
      setEditingFileIndex(editingFileIndex - 1);
    }
  };

  const handleEditMetadata = (index) => {
    setEditingFileIndex(index === editingFileIndex ? null : index);
  };

  const handleTagChange = (index, tag) => {
    const newMetadata = [...fileMetadata];
    if (newMetadata[index].tags.includes(tag)) {
      newMetadata[index].tags = newMetadata[index].tags.filter(t => t !== tag);
    } else {
      newMetadata[index].tags = [...newMetadata[index].tags, tag];
    }
    setFileMetadata(newMetadata);
  };

  const handleKeyChange = (index, key) => {
    const newMetadata = [...fileMetadata];
    newMetadata[index].key = key;
    setFileMetadata(newMetadata);
  };

  // Function to apply AI tags to a file
  const applyAITags = (index, aiTags) => {
    const newMetadata = [...fileMetadata];
    newMetadata[index].tags = [...aiTags];
    setFileMetadata(newMetadata);
  };

  // Function to apply AI key to a file
  const applyAIKey = (index, aiKey) => {
    const newMetadata = [...fileMetadata];
    newMetadata[index].key = aiKey;
    setFileMetadata(newMetadata);
  };

  // Function to handle when we receive AI analysis results
  useEffect(() => {
    if (analyzedClips.length > 0) {
      // Automatically update the metadata with AI suggestions
      const newMetadata = [...fileMetadata];
      analyzedClips.forEach(clip => {
        if (clip.detectedTags && clip.detectedTags.length > 0) {
          // Find the index of this file in our current array
          const fileIndex = files.findIndex(file => file.name === clip.originalName);
          if (fileIndex !== -1 && newMetadata[fileIndex]) {
            newMetadata[fileIndex].aiSuggestedTags = clip.detectedTags;
            newMetadata[fileIndex].aiSuggestedKey = clip.detectedKey;
          }
        }
      });
      setFileMetadata(newMetadata);
      setAnalyzedClips([]); // Clear after processing
    }
  }, [analyzedClips, files, fileMetadata]);

  return (
    <UploaderContainer>
      <Title>Upload Audio Clips</Title>
      <UploadForm onSubmit={handleUpload}>
        <DropZone 
          isDragActive={isDragActive}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleBrowseClick}
        >
          {files.length > 0 ? (
            <p>Selected: {files.length} file{files.length > 1 ? 's' : ''}</p>
          ) : (
            <>
              <p>Drag & Drop your .wav files here</p>
              <p>or</p>
              <p>Click to browse files</p>
            </>
          )}
          <FileInput 
            ref={fileInputRef}
            id="file-input"
            type="file" 
            accept=".wav" 
            onChange={handleFileChange} 
            multiple
          />
        </DropZone>
        
        {files.length > 0 && (
          <SelectedFilesList>
            {files.map((file, index) => (
              <SelectedFile key={`${file.name}-${index}`}>
                <FileName>{file.name}</FileName>
                <FileSize>{(file.size / (1024 * 1024)).toFixed(2)} MB</FileSize>
                <EditButton 
                  type="button" 
                  onClick={() => handleEditMetadata(index)}
                  disabled={isUploading}
                >
                  {editingFileIndex === index ? 'Done' : 'Edit Tags'}
                </EditButton>
                <RemoveButton 
                  type="button" 
                  onClick={() => handleRemoveFile(index)}
                  disabled={isUploading}
                >
                  Remove
                </RemoveButton>
              </SelectedFile>
            ))}
          </SelectedFilesList>
        )}
        
        {editingFileIndex !== null && fileMetadata[editingFileIndex] && (
          <MetadataPanel>
            <h4>Edit {files[editingFileIndex]?.name}</h4>
            
            <FormGroup>
              <Label>Tags:</Label>
              <CheckboxGroup>
                {allTags.map(tag => (
                  <CheckboxLabel key={tag}>
                    <input 
                      type="checkbox" 
                      checked={fileMetadata[editingFileIndex].tags.includes(tag)} 
                      onChange={() => handleTagChange(editingFileIndex, tag)}
                      disabled={isUploading}
                    />
                    {tag}
                  </CheckboxLabel>
                ))}
              </CheckboxGroup>
            </FormGroup>
            
            <FormGroup>
              <Label>Key:</Label>
              <Select 
                value={fileMetadata[editingFileIndex].key} 
                onChange={(e) => handleKeyChange(editingFileIndex, e.target.value)}
                disabled={isUploading}
              >
                {allKeys.map(key => (
                  <option key={key} value={key}>{key || 'Select a key'}</option>
                ))}
              </Select>
            </FormGroup>
          </MetadataPanel>
        )}
          
        {isUploading && (
          <ProgressContainer>
            <ProgressBar progress={uploadProgress} />
          </ProgressContainer>
        )}
          
        <UploadButton 
          type="submit" 
          disabled={files.length === 0 || isUploading}
        >
          {isUploading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <LoadingSpinner size="15px" />
              <span>Uploading...</span>
            </div>
          ) : `Upload ${files.length > 0 ? `(${files.length} file${files.length > 1 ? 's' : ''})` : ''}`}
        </UploadButton>
        
        <StatusMessage message={message} isError={isError}>
          {message}
        </StatusMessage>
      </UploadForm>
    </UploaderContainer>
  );
};

export default ClipUploader;
