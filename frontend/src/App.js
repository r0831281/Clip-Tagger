import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import styled from 'styled-components';
import './App.css';

// Component imports
import Header from './components/Header';
import ClipUploader from './components/ClipUploader';
import ClipLibrary from './components/ClipLibrary';

const AppContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

function App() {
  return (
    <Router>
      <AppContainer>
        <Header />
        <Routes>
          <Route path="/" element={<ClipUploader />} />
          <Route path="/library" element={<ClipLibrary />} />
        </Routes>
      </AppContainer>
    </Router>
  );
}

export default App;
