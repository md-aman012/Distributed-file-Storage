import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import FileUpload from '../components/FileUpload';
import api from '../api/axios';
import { FileText, Download, Calendar, HardDrive } from 'lucide-react';

const Dashboard = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const response = await api.get('/files');
      setFiles(response.data.files);
    } catch (err) {
      console.error("Failed to fetch files", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = (newFile) => {
    setFiles([newFile, ...files]);
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="dashboard-layout">
      <Navbar />
      
      <main className="dashboard-content">
        <FileUpload onUploadSuccess={handleUploadSuccess} />
        
        <div className="files-section">
          <h2>Your Files</h2>
          
          {loading ? (
            <div className="loading-spinner">Loading files...</div>
          ) : files.length === 0 ? (
            <div className="empty-state">
              <FileText size={48} />
              <p>You haven't uploaded any files yet.</p>
            </div>
          ) : (
            <div className="files-grid">
              {files.map((file) => (
                <div key={file.id} className="file-card glass-card">
                  <div className="file-icon-wrapper">
                    <FileText size={40} className="file-icon" />
                  </div>
                  <div className="file-info">
                    <h4 className="file-title" title={file.original_name}>
                      {file.original_name}
                    </h4>
                    <div className="file-meta">
                      <span className="meta-item"><HardDrive size={14} /> {formatSize(file.file_size)}</span>
                      <span className="meta-item"><Calendar size={14} /> {new Date(file.uploaded_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="file-actions">
                    {/* Presigned URL download would go here. For now, it's just visual. */}
                    <button className="icon-btn" title="Download (Coming Soon)">
                      <Download size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
