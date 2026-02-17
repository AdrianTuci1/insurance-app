import { useState, useRef, useEffect } from 'react';
import { FileText, Upload, X, Check, File, Trash2, RefreshCw } from 'lucide-react';
import './PDFMergeZone.css';

const PDFMergeZone = ({ initialDocuments = [], onUpdate, showResync = true }) => {
    const [files, setFiles] = useState([]); // This is for NEW uploads
    const [existingDocs, setExistingDocs] = useState(initialDocuments);
    const [isDragging, setIsDragging] = useState(false);
    const [isMerging, setIsMerging] = useState(false);
    const [resyncing, setResyncing] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        setExistingDocs(initialDocuments);
    }, [initialDocuments]);

    const onDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = () => {
        setIsDragging(false);
    };

    const onDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFiles = Array.from(e.dataTransfer.files).filter(file => file.type === 'application/pdf');
        setFiles(prev => [...prev, ...droppedFiles]);
    };

    const onFileSelect = (e) => {
        const selectedFiles = Array.from(e.target.files).filter(file => file.type === 'application/pdf');
        setFiles(prev => [...prev, ...selectedFiles]);
    };

    const removeExistingDoc = (docName) => {
        const updatedDocs = existingDocs.filter(doc => doc.name !== docName);
        setExistingDocs(updatedDocs);
        if (onUpdate) onUpdate(updatedDocs);
    };

    const handleResync = () => {
        setResyncing(true);
        // Simulate extraction resync
        setTimeout(() => {
            setResyncing(false);
            alert('Data resynced from documents successfully!');
        }, 1500);
    };

    const handleUploadComplete = () => {
        setIsMerging(true);
        // Simulate processing new uploads
        setTimeout(() => {
            const newDocs = files.map(f => ({ name: f.name }));
            const updatedDocs = [...existingDocs, ...newDocs];
            setExistingDocs(updatedDocs);
            setFiles([]);
            setIsMerging(false);
            if (onUpdate) onUpdate(updatedDocs);
        }, 1500);
    };

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="merge-zone-modal-content">
            {/* Upload Area */}
            <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`drop-zone ${isDragging ? 'active' : ''}`}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={onFileSelect}
                    multiple
                    accept="application/pdf"
                    className="hidden"
                    style={{ display: 'none' }}
                />
                <Upload className="upload-icon" />
                <p className="drop-text">Click to upload or drag and drop</p>
                <p className="drop-subtext">PDF files only (automatic extraction)</p>
            </div>

            {/* Current Documents List */}
            <div className="manage-docs-list" style={{ marginTop: '1.5rem' }}>
                <h4 className="file-list-title">Current Documents ({existingDocs.length})</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {existingDocs.map((doc, index) => (
                        <div key={index} className="file-item">
                            <div className="file-info">
                                <File size={16} style={{ color: 'var(--text-light)' }} />
                                <span className="file-name">{doc.name}</span>
                            </div>
                            <button
                                onClick={() => removeExistingDoc(doc.name)}
                                className="btn-remove"
                                title="Remove document"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                    {files.map((file, index) => (
                        <div key={`new-${index}`} className="file-item new-file-item">
                            <div className="file-info">
                                <File size={16} style={{ color: 'var(--primary-color)' }} />
                                <span className="file-name" style={{ color: 'var(--primary-color)' }}>{file.name} (uploading...)</span>
                            </div>
                            <button
                                onClick={() => removeFile(index)}
                                className="btn-remove"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* New Files Action */}
            {files.length > 0 && (
                <button
                    onClick={handleUploadComplete}
                    disabled={isMerging}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '0.75rem', marginTop: '1rem', borderRadius: '12px' }}
                >
                    {isMerging ? 'Processing...' : `Add ${files.length} New Document${files.length > 1 ? 's' : ''}`}
                </button>
            )}

            {/* Global Resync Action at bottom - Only if showResync is true */}
            {showResync && (
                <div className="resync-container" style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                    <button
                        onClick={handleResync}
                        disabled={resyncing}
                        className="btn card-hover"
                        style={{
                            width: '100%',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            background: 'var(--bg-body)',
                            border: '1px solid var(--border-color)',
                            padding: '0.75rem',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: 'var(--primary-color)',
                            borderRadius: '12px'
                        }}
                    >
                        <RefreshCw size={16} className={resyncing ? 'animate-spin' : ''} />
                        {resyncing ? 'Syncing...' : 'Resync Extraction Data'}
                    </button>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', textAlign: 'center', marginTop: '0.75rem' }}>
                        Updates extracted fields from all source documents.
                    </p>
                </div>
            )}
        </div>
    );
};

export default PDFMergeZone;
