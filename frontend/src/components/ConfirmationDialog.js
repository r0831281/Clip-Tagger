import React from 'react';
import styled from 'styled-components';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
`;

const ModalWrapper = styled.div`
  background-color: white;
  padding: 25px;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  animation: modalFadeIn 0.2s ease-out;
  
  @keyframes modalFadeIn {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const ModalHeader = styled.div`
  margin-bottom: 15px;
`;

const ModalTitle = styled.h3`
  margin: 0;
  color: ${props => props.isWarning ? '#c62828' : '#333'};
`;

const ModalBody = styled.div`
  margin-bottom: 20px;
  color: #666;
  line-height: 1.5;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;

const Button = styled.button`
  padding: 8px 16px;
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

const CancelButton = styled(Button)`
  background-color: #f1f1f1;
  color: #333;
  
  &:hover {
    background-color: #e1e1e1;
  }
`;

const ConfirmButton = styled(Button)`
  background-color: ${props => props.isWarning ? '#d32f2f' : '#0066cc'};
  color: white;
  
  &:hover {
    background-color: ${props => props.isWarning ? '#b71c1c' : '#0055aa'};
  }
`;

const ConfirmationDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm Action', 
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isWarning = false
}) => {
  if (!isOpen) return null;
  
  return (
    <ModalOverlay onClick={onClose}>
      <ModalWrapper onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle isWarning={isWarning}>{title}</ModalTitle>
        </ModalHeader>
        <ModalBody>
          {message}
        </ModalBody>
        <ModalFooter>
          <CancelButton onClick={onClose}>
            {cancelText}
          </CancelButton>
          <ConfirmButton 
            isWarning={isWarning}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </ConfirmButton>
        </ModalFooter>
      </ModalWrapper>
    </ModalOverlay>
  );
};

export default ConfirmationDialog;
