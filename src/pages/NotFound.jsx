import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="placeholder-page">
      <FileQuestion size={64} className="placeholder-icon" />
      <h2 className="placeholder-title">404 - Page Not Found</h2>
      <p style={{ color: 'var(--text-secondary)' }}>
        The page you are looking for does not exist or has been moved.
      </p>
      <Link to="/" className="placeholder-btn">
        <ArrowLeft size={20} />
        Back to Home
      </Link>
    </div>
  );
};

export default NotFound;
