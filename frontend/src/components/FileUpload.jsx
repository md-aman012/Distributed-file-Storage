import React, { useState, useRef } from 'react';
import { UploadCloud, X, File } from 'lucide-react';
import api from '../api/axios';

const FileUpload = ({ onUploadSuccess }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setError('');
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setProgress(0);
    setError('');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        // Track upload progress via Axios callback
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(pct);
          }
        },
      });

      setSelectedFile(null);
      setProgress(0);
      if (onUploadSuccess) onUploadSuccess(response.data.file);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="upload-container glass-card">
      <h3>Upload a File</h3>

      {error && <div className="error-message">{error}</div>}

      {!selectedFile ? (
        <div
          className={`drop-zone ${dragActive ? 'active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current.click()}
        >
          <UploadCloud size={48} className="upload-icon" />
          <p>Drag and drop a file here, or click to select</p>
          <input
            ref={inputRef}
            type="file"
            className="hidden-input"
            onChange={handleChange}
          />
        </div>
      ) : (
        <div className="selected-file-preview">
          <File size={32} />
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <span className="file-name">{selectedFile.name}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
              {formatSize(selectedFile.size)}
            </span>
          </div>
          <button className="remove-btn" onClick={() => setSelectedFile(null)} disabled={uploading}>
            <X size={20} />
          </button>
        </div>
      )}

      {/* Progress bar — only visible while uploading */}
      {uploading && (
        <div className="upload-progress-wrapper">
          <div className="upload-progress-label">
            <span>Uploading…</span>
            <span>{progress}%</span>
          </div>
          <div className="upload-progress-track">
            <div className="upload-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {selectedFile && (
        <button
          className="primary-btn upload-submit-btn"
          onClick={handleUpload}
          disabled={uploading}
        >
          {uploading ? 'Uploading…' : 'Confirm Upload'}
        </button>
      )}
    </div>
  );
};

export default FileUpload;
