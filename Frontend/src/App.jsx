import React from 'react';
import Navbar from './components/Navbar/Navbar.jsx';
import Dashboard from './components/Dashboard/Dashboard.jsx';
import FileUpload from './components/FileUpload/FileUpload.jsx';
import './App.css';

function App() {
  return (
    <div className="App">
      <Navbar />
      <div className="container">
        <Dashboard />
      </div>
    </div>
  );
}

export default App;