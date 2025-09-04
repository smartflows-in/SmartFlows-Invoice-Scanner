import React from 'react';
import FileUpload from '../FileUpload/FileUpload.jsx';
import './Dashboard.css';

const Dashboard = () => {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Advanced Invoice Analysis</h1>
        <p>Upload PDF or image invoices to extract and standardize data using AI</p>
      </div>
      <div className="dashboard-content">
        <div className="features-section">
          <h2>How It Works</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-upload"></i>
              </div>
              <h3>Upload Files</h3>
              <p>Select multiple PDF or image files or drag and drop them</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-cogs"></i>
              </div>
              <h3>AI Processing</h3>
              <p>Our AI extracts and standardizes invoice data with precision</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-file-export"></i>
              </div>
              <h3>Get Results</h3>
              <p>Download merged CSV or view detailed JSON output</p>
            </div>
          </div>
        </div>
        <FileUpload />
      </div>
    </div>
  );
};

export default Dashboard;