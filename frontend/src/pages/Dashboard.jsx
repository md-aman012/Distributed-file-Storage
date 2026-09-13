import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import FileUpload from '../components/FileUpload';
import api from '../api/axios';
import { FileText, Download, Calendar, HardDrive, Trash2, Share2 } from 'lucide-react';

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

  const handleDownload = async (id) => {
    try {
      const response = await api.get(`/files/${id}/download`);
      window.open(response.data.url, '_blank');
    } catch (err) {
      console.error("Failed to download file", err);
      alert("Failed to download file");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;
    try {
      await api.delete(`/files/${id}`);
      setFiles(files.filter(f => f.id !== id));
    } catch (err) {
      console.error("Failed to delete file", err);
      alert("Failed to delete file");
    }
  };

  const handleShare = async (file) => {
    try {
      const response = await api.patch(`/files/${file.id}/share`);
      const isShared = response.data.is_shared;
      setFiles(files.map(f => f.id === file.id ? { ...f, is_shared: isShared } : f));
      
      if (isShared) {
        const shareLink = `${window.location.origin}/share/${file.id}`;
        await navigator.clipboard.writeText(shareLink);
        alert(`Link copied to clipboard!\n${shareLink}`);
      } else {
        alert("File sharing disabled.");
      }
    } catch (err) {
      console.error("Failed to share file", err);
      alert("Failed to share file status");
    }
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
                      {file.is_shared && <span className="meta-item" style={{color: '#3b82f6', fontWeight: 'bold'}}>Shared</span>}
                    </div>
                  </div>
                  <div className="file-actions">
                    <button className="icon-btn" title="Download" onClick={() => handleDownload(file.id)}>
                      <Download size={18} />
                    </button>
                    <button className="icon-btn" title={file.is_shared ? "Unshare" : "Share"} onClick={() => handleShare(file)}>
                      <Share2 size={18} color={file.is_shared ? '#3b82f6' : 'currentColor'} />
                    </button>
                    <button className="icon-btn delete-btn" title="Delete" onClick={() => handleDelete(file.id)}>
                      <Trash2 size={18} color="#ef4444" />
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
