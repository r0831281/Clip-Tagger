import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { getClips, updateClip, deleteClip } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import ConfirmationDialog from './ConfirmationDialog';

const LibraryContainer = styled.div`
  padding: 20px;
`;

const Title = styled.h2`
  color: #333;
  margin-bottom: 30px;
`;

const Controls = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
`;

const FilterGroup = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
`;

const FilterLabel = styled.label`
  font-weight: 500;
  color: #555;
`;

const Select = styled.select`
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #ddd;
  background-color: white;
  min-width: 120px;
`;

const ClipsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
`;

const ClipCard = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }
`;

const ClipInfo = styled.div`
  padding: 15px;
`;

const ClipName = styled.h3`
  margin-top: 0;
  margin-bottom: 10px;
  color: #333;
  font-size: 18px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ClipMeta = styled.div`
  margin: 10px 0;
  font-size: 14px;
  color: #666;
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 10px;
`;

const Tag = styled.span`
  background-color: #e3f2fd;
  color: #0d47a1;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
`;

const Key = styled.span`
  background-color: #e8f5e9;
  color: #2e7d32;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
`;

const AudioPlayer = styled.audio`
  width: 100%;
  margin-top: 15px;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 15px;
`;

const Button = styled.button`
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const EditButton = styled(Button)`
  background-color: #e3f2fd;
  color: #0d47a1;
  
  &:hover {
    background-color: #bbdefb;
  }
`;

const DeleteButton = styled(Button)`
  background-color: #ffebee;
  color: #c62828;
  
  &:hover {
    background-color: #ffcdd2;
  }
`;

const NoClipsMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #666;
  background-color: #f9f9f9;
  border-radius: 8px;
  grid-column: 1 / -1;
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
`;

const ModalTitle = styled.h3`
  margin-top: 0;
  color: #333;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const Label = styled.label`
  font-weight: 500;
  color: #555;
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
`;

const ModalButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

const SaveButton = styled(Button)`
  background-color: #0066cc;
  color: white;
  
  &:hover {
    background-color: #0055aa;
  }
`;

const CancelButton = styled(Button)`
  background-color: #f1f1f1;
  color: #333;
    &:hover {
    background-color: #e1e1e1;
  }
`;

// Helper function to get filename without extension
const getFileNameWithoutExtension = (filename) => {
  return filename.replace(/\.[^/.]+$/, "");
};

// Helper function to check if a filename has been renamed from original
const hasBeenRenamed = (originalFilename, fileId) => {
  return originalFilename !== `${fileId}.wav`;
};

const ClipLibrary = () => {
  const [clips, setClips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTag, setFilterTag] = useState('all');
  const [filterKey, setFilterKey] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClip, setEditingClip] = useState(null);
  const [editFormData, setEditFormData] = useState({
    tags: [],
    key: '',
    name: ''
  });
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  
  // New state for confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    isWarning: false
  });

  const fetchClips = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getClips();
      setClips(data);
    } catch (error) {
      console.error('Error fetching clips:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClips();
  }, [fetchClips]);
  
  const handleEditClick = (clip) => {
    setEditingClip(clip);
    setEditFormData({
      tags: [...clip.tags],
      key: clip.key,
      name: clip.originalName
    });
    setShowEditModal(true);
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setEditingClip(null);
    setUpdateError(null);
  };

  const handleCheckboxChange = (tag) => {
    setEditFormData(prev => {
      if (prev.tags.includes(tag)) {
        return {
          ...prev,
          tags: prev.tags.filter(t => t !== tag)
        };
      } else {
        return {
          ...prev,
          tags: [...prev.tags, tag]
        };
      }
    });
  };
  
  const handleKeyChange = (e) => {
    setEditFormData(prev => ({
      ...prev,
      key: e.target.value
    }));
  };

  const handleNameChange = (e) => {
    setEditFormData(prev => ({
      ...prev,
      name: e.target.value
    }));
  };
  
  const handleSaveChanges = async (e) => {
    e.preventDefault();
    
    if (!editingClip) return;
    
    // Validate file name
    let fileName = editFormData.name.trim();
    if (!fileName) {
      alert("File name cannot be empty");
      return;
    }
    
    // Ensure file name ends with .wav
    if (!fileName.toLowerCase().endsWith('.wav')) {
      fileName += '.wav';
      setEditFormData(prev => ({
        ...prev,
        name: fileName
      }));
    }
    
    // Additional file name validation
    if (/[<>:"\\|?*]/.test(fileName)) {
      setUpdateError("File name contains invalid characters (&lt; &gt; : \" / \\ | ? *)");
      return;
    }
    
    try {
      setUpdateLoading(true);
      setUpdateError(null);
      
      const updatedClip = await updateClip(editingClip.id, {
        tags: editFormData.tags,
        key: editFormData.key,
        name: fileName
      });
      
      setClips(prev => prev.map(clip => 
        clip.id === updatedClip.id ? updatedClip : clip
      ));
      
      handleCloseModal();
    } catch (error) {
      console.error('Error updating clip:', error);
      setUpdateError(error.message || 'Failed to update clip');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDeleteClick = (clip) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Clip',
      message: `Are you sure you want to delete "${clip.originalName}"? This cannot be undone.`,
      isWarning: true,
      onConfirm: async () => {
        try {
          await deleteClip(clip.id);
          setClips(prev => prev.filter(c => c.id !== clip.id));
        } catch (error) {
          console.error('Error deleting clip:', error);
          alert(`Error deleting clip: ${error.message || 'Unknown error'}`);
        }
      }
    });
  };

  const getFilteredAndSortedClips = () => {
    return clips
      .filter(clip => {
        const matchesTag = filterTag === 'all' || clip.tags.includes(filterTag);
        const matchesKey = filterKey === 'all' || clip.key === filterKey;
        return matchesTag && matchesKey;
      })
      .sort((a, b) => {
        if (sortBy === 'date') {
          return new Date(b.uploadDate) - new Date(a.uploadDate);
        } else if (sortBy === 'name') {
          return a.originalName.localeCompare(b.originalName);
        } else if (sortBy === 'key') {
          return a.key.localeCompare(b.key);
        }
        return 0;
      });
  };

  const getUniqueTags = () => {
    const tags = new Set();
    clips.forEach(clip => {
      clip.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  };

  const getUniqueKeys = () => {
    const keys = new Set();
    clips.forEach(clip => {
      keys.add(clip.key);
    });
    return Array.from(keys);
  };

  const filteredClips = getFilteredAndSortedClips();
  const availableTags = getUniqueTags();
  const availableKeys = getUniqueKeys();
  const allTags = ['drums', 'instrumental', 'vocals', 'fx'];

  return (
    <LibraryContainer>
      <Title>Clip Library</Title>
      
      <Controls>
        <FilterGroup>
          <FilterLabel>Filter by Tag:</FilterLabel>
          <Select 
            value={filterTag} 
            onChange={(e) => setFilterTag(e.target.value)}
          >
            <option value="all">All Tags</option>
            {availableTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </Select>
          
          <FilterLabel>Filter by Key:</FilterLabel>
          <Select 
            value={filterKey} 
            onChange={(e) => setFilterKey(e.target.value)}
          >
            <option value="all">All Keys</option>
            {availableKeys.map(key => (
              <option key={key} value={key}>{key}</option>
            ))}
          </Select>
        </FilterGroup>
        
        <FilterGroup>
          <FilterLabel>Sort by:</FilterLabel>
          <Select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date">Date (newest first)</option>
            <option value="name">Name (A-Z)</option>
            <option value="key">Key</option>
          </Select>
        </FilterGroup>
      </Controls>
      
      <ClipsGrid>
        {loading ? (
          <NoClipsMessage>
            <LoadingSpinner 
              size="50px" 
              label="Loading clips..." 
              labelSize="16px" 
            />
          </NoClipsMessage>
        ) : filteredClips.length === 0 ? (
          <NoClipsMessage>
            {clips.length === 0 
              ? "No clips found. Upload some clips to get started!" 
              : "No clips match your current filters."}
          </NoClipsMessage>
        ) : (
          filteredClips.map(clip => (
            <ClipCard key={clip.id}>
              <ClipInfo>
                <ClipName title={clip.originalName}>
                  {clip.originalName}
                  {hasBeenRenamed(clip.originalName, clip.id) && 
                    <span style={{ 
                      fontSize: '12px', 
                      color: '#666', 
                      marginLeft: '5px',
                      fontStyle: 'italic'
                    }}>
                      (renamed)
                    </span>
                  }
                </ClipName>
                
                <ClipMeta>
                  <div>Uploaded: {new Date(clip.uploadDate).toLocaleDateString()}</div>
                  <div>
                    Key: <Key>{clip.key}</Key>
                  </div>
                </ClipMeta>
                
                <TagsContainer>
                  {clip.tags.map(tag => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </TagsContainer>
                
                <AudioPlayer 
                  controls 
                  src={`http://localhost:5000/uploads/${clip.filename}`} 
                />
                
                <ButtonGroup>
                  <EditButton onClick={() => handleEditClick(clip)}>
                    Edit
                  </EditButton>
                  <DeleteButton onClick={() => handleDeleteClick(clip)}>
                    Delete
                  </DeleteButton>
                </ButtonGroup>
              </ClipInfo>
            </ClipCard>
          ))
        )}
      </ClipsGrid>
      
      {showEditModal && (
        <Modal>
          <ModalContent>
            <ModalTitle>Edit Clip</ModalTitle>
            <Form onSubmit={handleSaveChanges}>
              <FormGroup>
                <Label>File Name:</Label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ width: '100%', position: 'relative' }}>
                    <input 
                      type="text" 
                      value={editFormData.name} 
                      onChange={handleNameChange}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '4px',
                        border: editFormData.name.trim() === '' || /[<>:"\\|?*]/.test(editFormData.name)
                          ? '1px solid #c62828'
                          : '1px solid #ddd',
                        fontSize: '16px'
                      }}
                    />
                    {editFormData.name && !editFormData.name.toLowerCase().endsWith('.wav') && (
                      <div style={{ 
                        position: 'absolute', 
                        right: '10px', 
                        top: '50%', 
                        transform: 'translateY(-50%)',
                        color: '#0d47a1',
                        fontSize: '12px',
                        backgroundColor: '#e3f2fd',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>
                        + .wav will be added
                      </div>
                    )}
                    {editFormData.name && /[<>:"\\|?*]/.test(editFormData.name) && (
                      <div style={{ 
                        marginTop: '5px',
                        color: '#c62828',
                        fontSize: '12px'
                      }}>
                        File name contains invalid characters (&lt; &gt; : &quot; / \ | ? *)
                      </div>
                    )}
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      // Generate name based on tags and key
                      const tagPart = editFormData.tags.length > 0 
                        ? editFormData.tags.join('-') 
                        : 'clip';
                      const keyPart = editFormData.key 
                        ? `-${editFormData.key.replace(/\s+/g, '-')}` 
                        : '';
                      const newName = `${tagPart}${keyPart}.wav`;
                      setEditFormData(prev => ({ ...prev, name: newName }));
                    }}
                    style={{
                      padding: '10px 15px',
                      backgroundColor: '#e3f2fd',
                      color: '#0d47a1',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: '500',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Auto-Name
                  </button>
                </div>
              </FormGroup>
              
              <FormGroup>
                <Label>Tags:</Label>
                <CheckboxGroup>
                  {allTags.map(tag => (
                    <CheckboxLabel key={tag}>
                      <input 
                        type="checkbox" 
                        checked={editFormData.tags.includes(tag)} 
                        onChange={() => handleCheckboxChange(tag)}
                      />
                      {tag}
                    </CheckboxLabel>
                  ))}
                </CheckboxGroup>
              </FormGroup>
              
              <FormGroup>
                <Label>Key:</Label>
                <Select value={editFormData.key} onChange={handleKeyChange}>
                  <option value="">Select a key</option>
                  <option value="C major">C major</option>
                  <option value="C minor">C minor</option>
                  <option value="C# major">C# major</option>
                  <option value="C# minor">C# minor</option>
                  <option value="D major">D major</option>
                  <option value="D minor">D minor</option>
                  <option value="D# major">D# major</option>
                  <option value="D# minor">D# minor</option>
                  <option value="E major">E major</option>
                  <option value="E minor">E minor</option>
                  <option value="F major">F major</option>
                  <option value="F minor">F minor</option>
                  <option value="F# major">F# major</option>
                  <option value="F# minor">F# minor</option>
                  <option value="G major">G major</option>
                  <option value="G minor">G minor</option>
                  <option value="G# major">G# major</option>
                  <option value="G# minor">G# minor</option>
                  <option value="A major">A major</option>
                  <option value="A minor">A minor</option>
                  <option value="A# major">A# major</option>
                  <option value="A# minor">A# minor</option>
                  <option value="B major">B major</option>
                  <option value="B minor">B minor</option>
                </Select>
              </FormGroup>
              
              <ModalButtons>
                <CancelButton type="button" onClick={handleCloseModal} disabled={updateLoading}>
                  Cancel
                </CancelButton>
                <SaveButton type="submit" disabled={updateLoading}>
                  {updateLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                      <div 
                        style={{ 
                          width: '15px', 
                          height: '15px', 
                          border: '2px solid rgba(255,255,255,0.3)', 
                          borderTop: '2px solid white', 
                          borderRadius: '50%', 
                          animation: 'spinBtn 0.8s linear infinite' 
                        }} 
                      />
                      <style>{`
                        @keyframes spinBtn {
                          0% { transform: rotate(0deg); }
                          100% { transform: rotate(360deg); }
                        }
                      `}</style>
                      <span>Saving...</span>
                    </div>
                  ) : 'Save Changes'}
                </SaveButton>
              </ModalButtons>
              
              {updateError && (
                <div style={{ 
                  color: '#c62828', 
                  marginTop: '10px',
                  padding: '8px 12px',
                  backgroundColor: '#ffebee',
                  borderRadius: '4px'
                }}>
                  {updateError}
                </div>
              )}
            </Form>
          </ModalContent>
        </Modal>
      )}
      
      {/* Confirmation Dialog */}
      <ConfirmationDialog 
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog({...confirmDialog, isOpen: false})}
        isWarning={confirmDialog.isWarning}
      />
    </LibraryContainer>
  );
};

export default ClipLibrary;
