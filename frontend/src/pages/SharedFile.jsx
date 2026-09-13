import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import { FileText, Download, HardDrive, AlertTriangle } from "lucide-react";

const SharedFile = () => {
  const { id } = useParams();
  const [fileData, setFileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSharedFile = async () => {
      try {
        const response = await api.get(`/files/shared/${id}`);
        setFileData(response.data);
      } catch (err) {
        console.error("Error fetching shared file:", err);
        setError("File not found or no longer shared.");
      } finally {
        setLoading(false);
      }
    };
    fetchSharedFile();
  }, [id]);

  const formatSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleDownload = () => {
    if (fileData?.downloadUrl) {
      window.open(fileData.downloadUrl, "_blank");
    }
  };

  return (
    <div className="dashboard-layout">
      <header className="navbar">
        <div className="nav-brand">
          <FileText size={24} color="#3b82f6" />
          <h2>Distributed File Storage</h2>
        </div>
      </header>

      <main
        className="dashboard-content"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
        }}
      >
        {loading ? (
          <div className="loading-spinner">Loading shared file...</div>
        ) : error ? (
          <div className="empty-state">
            <AlertTriangle size={48} color="#ef4444" />
            <p style={{ color: "#ef4444", marginTop: "1rem" }}>{error}</p>
          </div>
        ) : (
          <div
            className="file-card glass-card"
            style={{
              width: "400px",
              maxWidth: "100%",
              padding: "2rem",
              boxSizing: "border-box",

              // Force vertical layout
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            {/* File Icon */}
            <div
              className="file-icon-wrapper"
              style={{
                width: "80px",
                height: "80px",
                marginBottom: "1.5rem",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FileText size={48} className="file-icon" />
            </div>

            {/* File Name */}
            <h3
              className="file-title"
              title={fileData.file.original_name}
              style={{
                width: "100%",
                margin: "0 0 0.75rem",
                fontSize: "1.2rem",
                fontWeight: 600,
                lineHeight: "1.4",
                textAlign: "center",

                // Prevent weird character-by-character wrapping
                wordBreak: "normal",
                overflowWrap: "anywhere",

                // Maximum 2 lines
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: 2,
                overflow: "hidden",
              }}
            >
              {fileData.file.original_name}
            </h3>

            {/* File Size */}
            <div
              className="file-meta"
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: "2rem",
              }}
            >
              <span
                className="meta-item"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                }}
              >
                <HardDrive size={16} />
                {formatSize(fileData.file.file_size)}
              </span>
            </div>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",

                width: "100%",
                padding: "0.75rem",

                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "8px",

                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "1rem",
                transition: "background-color 0.2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "#2563eb";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "#3b82f6";
              }}
            >
              <Download size={20} />
              Download File
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default SharedFile;
