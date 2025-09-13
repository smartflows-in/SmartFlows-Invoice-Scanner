import React, { useState, useRef, useEffect } from 'react';
import { Modal, Button, Form, Table, Alert } from 'react-bootstrap';
import Papa from 'papaparse';
import axios from 'axios';
import './FileUpload.css';
import './Chatbot.css';
import chatbot from '../../assets/chatbot.svg';
import sendmsg from '../../assets/sendmsg.svg';

const FileUpload = () => {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState({ csv: null, json: null });
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showGraphModal, setShowGraphModal] = useState(false);
  const [graphContent, setGraphContent] = useState(null);
  const [selectedColumns, setSelectedColumns] = useState({
    source_file: true,
    address: true,
    company_name: true,
    invoice_number: true,
    date_and_time: true,
    due_date: true,
    item_code: true,
    description: true,
    quantity: true,
    unit_price: true,
    total_price: true,
    page_number: true,
  });
  const [sessionId, setSessionId] = useState(null);
  const fileInputRef = useRef(null);
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef(null);

  const API_BASE_URL = 'https://smartflows-invoice-scanner-production.up.railway.app';
  // Fallback to Render if Railway fails
  // const API_BASE_URL = 'https://invoice-scanner-backend.onrender.com';

  const retryRequest = async (config, maxRetries = 5, initialDelay = 2000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Frontend attempt ${attempt} to ${config.url}`);
        const response = await axios(config);
        console.log(`Response from ${config.url}:`, {
          status: response.status,
          dataLength: response.data?.length || 'No data',
        });
        return response;
      } catch (error) {
        const isRetryable = error.code === 'ERR_NETWORK' ||
                           error.code === 'ECONNRESET' ||
                           error.code === 'ECONNABORTED' ||
                           error.code === 'ETIMEDOUT' ||
                           error.response?.status === 502 ||
                           error.response?.status === 503 ||
                           error.response?.status === 500;
        if (isRetryable && attempt < maxRetries) {
          const delay = initialDelay * Math.pow(2, attempt - 1);
          console.log(`Frontend retry attempt ${attempt} after ${delay}ms due to ${error.code || error.response?.status}`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files).filter((file) =>
      file.type === 'application/pdf' || file.type.startsWith('image/')
    );
    setFiles([...files, ...selectedFiles]);
    setResult({ csv: null, json: null });
    setError(null);
    setSessionId(null);
    setChatMessages([]);
    console.log('Files selected:', selectedFiles.map((f) => f.name));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      (file) => file.type === 'application/pdf' || file.type.startsWith('image/')
    );
    setFiles([...files, ...droppedFiles]);
    setResult({ csv: null, json: null });
    setError(null);
    setSessionId(null);
    setChatMessages([]);
    console.log('Files dropped:', droppedFiles.map((f) => f.name));
  };

  const removeFile = (index) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    console.log('File removed, remaining:', newFiles.map((f) => f.name));
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleAnalyzeClick = () => {
    if (files.length === 0 && !result.csv) {
      setError('Please select at least one file to analyze.');
      return;
    }
    setShowModal(true);
    setResult({ csv: null, json: null });
    setSessionId(null);
    setChatMessages([]);
    console.log('Analyze clicked, opening modal');
  };

  const handleColumnChange = (e) => {
    setSelectedColumns({
      ...selectedColumns,
      [e.target.name]: e.target.checked,
    });
    console.log('Column selection changed:', { [e.target.name]: e.target.checked });
  };

  const handleModalSubmit = async () => {
    setShowModal(false);
    setResult({ csv: null, json: null });
    console.log('Modal submitted, processing files:', files.map((f) => f.name));
    console.log('Selected columns:', Object.keys(selectedColumns).filter((col) => selectedColumns[col]));
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));
      formData.append('columns', JSON.stringify(Object.keys(selectedColumns).filter((col) => selectedColumns[col])));

      setIsProcessing(true);
      setError(null);
      console.log('Sending files to /api/process');

      const response = await retryRequest({
        url: `${API_BASE_URL}/api/process`,
        method: 'POST',
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const processResult = response.data;
      console.log('Process result:', processResult);

      // Validate response
      if (!processResult.data || processResult.data.trim() === '') {
        throw new Error(processResult.details || 'Empty or invalid CSV data received from backend');
      }

      setResult({ csv: processResult.data, json: processResult.json });

      if (processResult.json && Array.isArray(processResult.json) && processResult.json.length > 0) {
        const jsonBlob = new Blob([JSON.stringify(processResult.json)], { type: 'application/json' });
        const jsonFormData = new FormData();
        jsonFormData.append('files', jsonBlob, 'processed_invoices.json'); // Match API field name

        console.log('Uploading JSON to /api/chatbot-upload');
        try {
          const uploadResponse = await retryRequest({
            url: `${API_BASE_URL}/api/chatbot-upload`,
            method: 'post',
            data: jsonFormData,
          });
          console.log('Upload response:', uploadResponse.data);
          setSessionId(uploadResponse.data.session_id);
          setChatMessages([
            { sender: 'bot', text: `Session started with ID: ${uploadResponse.data.session_id}` },
          ]);
        } catch (uploadError) {
          console.error('JSON upload error:', uploadError);
          setError(`Failed to start chatbot session: ${uploadError.response?.data?.error || uploadError.message}`);
          setChatMessages([
            { sender: 'bot', text: `Failed to start chatbot session: ${uploadError.response?.data?.error || uploadError.message}` },
          ]);
        }
      } else {
        setError('No valid JSON data available for chatbot session');
        setChatMessages([{ sender: 'bot', text: 'No valid JSON data available for chatbot session' }]);
      }

      setFiles([]);
    } catch (err) {
      const errorMessage = err.response?.data?.details || err.response?.data?.error || err.message || 'Unknown error occurred';
      setError(`Failed to process files: ${errorMessage}`);
      console.error('Processing error:', {
        message: err.message,
        response: err.response ? {
          status: err.response.status,
          data: err.response.data,
        } : 'No response',
        code: err.code,
      });
      setChatMessages([{ sender: 'bot', text: `Processing error: ${errorMessage}` }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const getFileIcon = (file) => {
    if (file.type === 'application/pdf') return 'fas fa-file-pdf';
    if (file.type.startsWith('image/')) return 'fas fa-file-image';
    return 'fas fa-file';
  };

  const getFileIconColor = (file) => {
    if (file.type === 'application/pdf') return '#e53e3e';
    if (file.type.startsWith('image/')) return '#38a169';
    return '#666';
  };

  const downloadCSV = () => {
    if (!result.csv) {
      setError('No CSV data available to download.');
      return;
    }

    const parsedCSV = Papa.parse(result.csv.trim(), { header: true, skipEmptyLines: true });
    if (parsedCSV.errors.length > 0) {
      console.error('PapaParse errors during CSV download:', parsedCSV.errors);
      setError('Failed to parse CSV for download');
      return;
    }

    const displayHeaderMap = {
      source_file: 'Source File',
      address: 'Address',
      company_name: 'Company Name',
      invoice_number: 'Invoice Number',
      date_and_time: 'Date',
      due_date: 'Due Date',
      item_code: 'Item Code',
      description: 'Description',
      quantity: 'Quantity',
      unit_price: 'Unit Price',
      total_price: 'Total Price',
      page_number: 'Page No',
    };

    const filteredData = parsedCSV.data.map((row) => {
      const filteredRow = {};
      Object.keys(selectedColumns).forEach((col) => {
        if (selectedColumns[col] && row[col]) {
          filteredRow[displayHeaderMap[col] || col] = row[col];
        }
      });
      return filteredRow;
    });

    const csvOutput = Papa.unparse({
      fields: Object.keys(selectedColumns)
        .filter((col) => selectedColumns[col])
        .map((col) => displayHeaderMap[col] || col),
      data: filteredData,
    });

    const blob = new Blob([csvOutput], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'processed_invoices.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    console.log('CSV downloaded with display headers');
  };

  const downloadJSON = () => {
    if (!result.json) {
      setError('No JSON data available to download.');
      return;
    }
    const blob = new Blob([JSON.stringify(result.json, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'processed_invoices.json';
    a.click();
    window.URL.revokeObjectURL(url);
    console.log('JSON downloaded');
  };

  const toggleChatbot = () => {
    setShowChatbot(!showChatbot);
    console.log('Chatbot toggled:', !showChatbot);
  };

  const handleChatInputChange = (e) => {
    setChatInput(e.target.value);
  };

  const handleGraphClick = (content) => {
    setGraphContent(content);
    setShowGraphModal(true);
    console.log('Graph modal opened with content:', content);
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    if (!sessionId) {
      const errorMessage = { sender: 'bot', text: 'Please process an invoice first to start chatting.' };
      setChatMessages((prev) => [...prev, errorMessage]);
      console.log('Chatbot error: No session_id available');
      return;
    }

    const userMessage = { sender: 'user', text: chatInput };
    setChatMessages((prev) => [...prev, userMessage]);
    const tempInput = chatInput;
    setChatInput('');
    setIsLoading(true);

    try {
      console.log('Sending chat message:', { session_id: sessionId, question: tempInput });
      const response = await retryRequest({
        url: `${API_BASE_URL}/api/chatbot-analyze`,
        method: 'post',
        data: { session_id: sessionId, question: tempInput },
        headers: { 'Content-Type': 'application/json' },
      });

      setIsLoading(false);

      let botMessage;
      if (response.data.answer) {
        const isTableOrAscii = response.data.answer.includes('|') || response.data.answer.includes('```');
        botMessage = {
          sender: 'bot',
          text: response.data.answer,
          isTableOrAscii,
        };
      } else {
        botMessage = {
          sender: 'bot',
          text: response.data.error || 'No response from bot',
        };
      }
      setChatMessages((prev) => [...prev, botMessage]);
      console.log('Chatbot response:', botMessage.text);

      if (response.data.graph) {
        const graphMessage = {
          sender: 'bot',
          graph: response.data.graph,
        };
        setChatMessages((prev) => [...prev, graphMessage]);
        console.log('Graph received:', response.data.graph);
      }
    } catch (error) {
      setIsLoading(false);
      console.error('Chatbot error:', {
        message: error.message,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data,
        } : 'No response',
        code: error.code,
      });
      const errorMessage = {
        sender: 'bot',
        text: error.response?.data?.error || `Error: ${error.message}`,
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    }
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, isLoading]);

  const headerMap = {
    'Source File': 'source_file',
    'Company Name': 'company_name',
    'Invoice Number': 'invoice_number',
    'Date': 'date_and_time',
    'Due Date': 'due_date',
    'Item Code': 'item_code',
    'Unit Price': 'unit_price',
    'Total Price': 'total_price',
    'Page No': 'page_number',
    'Address': 'address',
    'Description': 'description',
    'Quantity': 'quantity',
  };

  const parsedCSV = result.csv
    ? Papa.parse(result.csv.trim(), { header: true, skipEmptyLines: true })
    : null;

  useEffect(() => {
    if (parsedCSV?.errors?.length > 0) {
      console.error('PapaParse errors:', parsedCSV.errors);
      setError('Failed to parse CSV data from backend');
    }
  }, [parsedCSV]);

  const normalizedData = parsedCSV?.data
    ? parsedCSV.data.map((row) => {
        const normalizedRow = {};
        Object.keys(row).forEach((key) => {
          const normalizedKey = headerMap[key] || key.toLowerCase();
          normalizedRow[normalizedKey] = row[key] || '';
        });
        return normalizedRow;
      })
    : [];
  const tableData = normalizedData;
  const tableHeaders = Object.keys(selectedColumns).filter((col) => selectedColumns[col]);

  console.log('Raw CSV:', result.csv);
  console.log('Parsed CSV:', parsedCSV);
  console.log('Normalized Data:', normalizedData);
  console.log('Table Data:', tableData);
  console.log('Table Headers:', tableHeaders);

  return (
    <div className="file-upload-container">
      <div className="upload-header">
        <h2>Upload PDF and Image Files for Analysis</h2>
        <p>Select multiple PDF or image files from your device to analyze</p>
      </div>

      <div
        className={`upload-area ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleUploadClick}
      >
        <div className="upload-content">
          <div className="upload-icon">
            <i className="fas fa-cloud-upload-alt"></i>
          </div>
          <p>Drag & Drop your PDF or image files here</p>
          <p className="upload-subtext">or click to browse files</p>
          <p className="file-types">Supported formats: PDF, JPG, PNG</p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}

      {files.length > 0 && (
        <div className="files-preview">
          <h3>Selected Files ({files.length})</h3>
          <div className="files-list">
            {files.map((file, index) => (
              <div key={index} className="file-item">
                <div className="file-info">
                  <i className={getFileIcon(file)} style={{ color: getFileIconColor(file) }}></i>
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                  <span className="file-type-badge">
                    {file.type === 'application/pdf' ? 'PDF' : 'Image'}
                  </span>
                </div>
                <button
                  className="remove-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            ))}
          </div>
          <button
            className={`btn btn-primary submit-btn ${isProcessing ? 'uploading' : ''}`}
            onClick={handleAnalyzeClick}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Processing...
              </>
            ) : result.csv ? (
              'Analyze Another File'
            ) : (
              'Analyze Files'
            )}
          </button>
        </div>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Select CSV Columns</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            {Object.keys(selectedColumns).map((col) => (
              <Form.Check
                key={col}
                type="checkbox"
                label={col.replace('_', ' ').toUpperCase()}
                name={col}
                checked={selectedColumns[col]}
                onChange={handleColumnChange}
              />
            ))}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleModalSubmit}>
            Process
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showGraphModal} onHide={() => setShowGraphModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Graph View</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {graphContent?.graph ? (
            <img src={`data:image/png;base64,${graphContent.graph}`} alt="Graph" className="graph-image" />
          ) : (
            <pre className="formatted-text">{graphContent?.text}</pre>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowGraphModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {result.csv && (
        <div className="results-section">
          <h3>Analysis Results</h3>
          <div className="result-item">
            <h4>Output</h4>
            <Button variant="primary" onClick={downloadCSV} className="mb-3 me-2">
              Download CSV
            </Button>
            <Button variant="secondary" onClick={downloadJSON} className="mb-3">
              Download JSON
            </Button>
            {tableData.length > 0 ? (
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    {tableHeaders.map((header) => (
                      <th key={header}>{header.replace('_', ' ').toUpperCase()}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row, index) => (
                    <tr key={index}>
                      {tableHeaders.map((header) => (
                        <td key={header}>{row[header] || 'N/A'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <Alert variant="warning">
                No data available to display in table. Please check the uploaded files or try again.
              </Alert>
            )}
            <pre>{result.csv?.substring(0, 500)}...</pre>
          </div>
        </div>
      )}

      <div className="chatbot-container">
        <button className="chatbot-toggle-btn" onClick={toggleChatbot}>
          <i className="fas fa-comment-alt">
            <img className="icons" src={chatbot} alt="" />
          </i>
        </button>
        {showChatbot && (
          <div className="chatbot-window">
            <div className="chatbot-header">
              <h4>
                Invoice Chatbot {sessionId && <span>(Session ID: {sessionId})</span>}
              </h4>
              <button className="chatbot-close-btn" onClick={toggleChatbot}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="chatbot-messages" ref={chatContainerRef}>
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`chatbot-message ${msg.sender}${msg.graph || (msg.isTableOrAscii && !msg.text) ? ' graph' : ''}`}
                >
                  {msg.text && !msg.isTableOrAscii && (
                    <div className="message-content">
                      <p className="message-paragraph">{msg.text}</p>
                    </div>
                  )}
                  {msg.isTableOrAscii && (
                    <pre
                      className="formatted-text clickable"
                      onClick={() => handleGraphClick({ text: msg.text })}
                    >
                      {msg.text}
                    </pre>
                  )}
                  {msg.graph && (
                    <img
                      src={`data:image/png;base64,${msg.graph}`}
                      alt="Graph"
                      className="clickable"
                      onClick={() => handleGraphClick({ graph: msg.graph })}
                    />
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="typing-indicator">
                  <div className="message-content">
                    <div className="typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <form className="chatbot-input-form" onSubmit={handleChatSubmit}>
              <input
                type="text"
                value={chatInput}
                onChange={handleChatInputChange}
                placeholder="Ask about your invoices..."
                className="chatbot-input"
                disabled={isLoading}
              />
              <button type="submit" className="chatbot-send-btn" disabled={isLoading}>
                <i className="fas fa-paper-plane">
                  <img src={sendmsg} alt="" />
                </i>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;