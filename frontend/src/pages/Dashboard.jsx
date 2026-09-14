import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import FileUpload from '../components/FileUpload';
import ToastContainer, { useToast } from '../components/Toast';
import api from '../api/axios';
import { FileText, Download, Calendar, HardDrive, Trash2, Share2 } from 'lucide-react';

// ── Skeleton placeholder shown while files are loading ───────────
const SkeletonGrid = () => (
  <div className="files-grid">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="skeleton-card">
        <div className="skeleton skeleton-icon" />
        <div className="skeleton-body">
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-meta" />
          <div className="skeleton skeleton-meta" style={{ width: '30%' }} />
        </div>
      </div>
    ))}
  </div>
);

const Dashboard = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toasts, showToast, removeToast } = useToast();

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const response = await api.get('/files');
      setFiles(response.data.files);
    } catch (err) {
      console.error('Failed to fetch files', err);
      showToast('error', 'Could not load your files. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = (newFile) => {
    setFiles((prev) => [newFile, ...prev]);
    showToast('success', `"${newFile.original_name}" uploaded successfully!`);
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = async (id, name) => {
    try {
      const response = await api.get(`/files/${id}/download`);
      window.open(response.data.url, '_blank');
      showToast('success', `Downloading "${name}"…`);
    } catch (err) {
      console.error('Failed to download file', err);
      showToast('error', 'Download failed. Please try again.');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/files/${id}`);
      setFiles((prev) => prev.filter((f) => f.id !== id));
      showToast('success', `"${name}" deleted.`);
    } catch (err) {
      console.error('Failed to delete file', err);
      showToast('error', 'Delete failed. Please try again.');
    }
  };

  const handleShare = async (file) => {
    try {
      const response = await api.patch(`/files/${file.id}/share`);
      const isShared = response.data.is_shared;
      setFiles((prev) =>
        prev.map((f) => (f.id === file.id ? { ...f, is_shared: isShared } : f))
      );

      if (isShared) {
        const shareLink = `${window.location.origin}/share/${file.id}`;
        try {
          await navigator.clipboard.writeText(shareLink);
          showToast('info', 'Share link copied to clipboard!');
        } catch {
          // Clipboard API may be blocked in some browsers
          showToast('info', `Share link: ${shareLink}`);
        }
      } else {
        showToast('info', `"${file.original_name}" is no longer shared.`);
      }
    } catch (err) {
      console.error('Failed to share file', err);
      showToast('error', 'Could not update share status. Please try again.');
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
            <SkeletonGrid />
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
                      <span className="meta-item">
                        <HardDrive size={14} /> {formatSize(file.file_size)}
                      </span>
                      <span className="meta-item">
                        <Calendar size={14} /> {new Date(file.uploaded_at).toLocaleDateString()}
                      </span>
                      {file.is_shared && (
                        <span className="meta-item" style={{ color: '#3b82f6', fontWeight: 600 }}>
                          Shared
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="file-actions">
                    <button
                      className="icon-btn"
                      title="Download"
                      onClick={() => handleDownload(file.id, file.original_name)}
                    >
                      <Download size={18} />
                    </button>
                    <button
                      className="icon-btn"
                      title={file.is_shared ? 'Unshare' : 'Share'}
                      onClick={() => handleShare(file)}
                    >
                      <Share2 size={18} color={file.is_shared ? '#3b82f6' : 'currentColor'} />
                    </button>
                    <button
                      className="icon-btn delete-btn"
                      title="Delete"
                      onClick={() => handleDelete(file.id, file.original_name)}
                    >
                      <Trash2 size={18} color="#ef4444" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Global toast notifications — rendered at the bottom of the page */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default Dashboard;
