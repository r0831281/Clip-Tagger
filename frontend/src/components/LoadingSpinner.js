import React from 'react';
import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const SpinnerContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
`;

const Spinner = styled.div`
  width: ${props => props.size || '40px'};
  height: ${props => props.size || '40px'};
  border: 4px solid #f3f3f3;
  border-top: 4px solid ${props => props.color || '#0066cc'};
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const Label = styled.div`
  color: ${props => props.color || '#666'};
  font-size: ${props => props.fontSize || '14px'};
`;

const LoadingSpinner = ({ 
  size = '40px', 
  color = '#0066cc', 
  label = 'Loading...', 
  labelColor = '#666', 
  labelSize = '14px' 
}) => {
  return (
    <SpinnerContainer>
      <Spinner size={size} color={color} />
      {label && <Label color={labelColor} fontSize={labelSize}>{label}</Label>}
    </SpinnerContainer>
  );
};

export default LoadingSpinner;
