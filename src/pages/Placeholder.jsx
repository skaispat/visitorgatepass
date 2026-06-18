import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Construction } from 'lucide-react';

const Placeholder = ({ title }) => {
  return (
    <div className="placeholder-page">
      <Construction size={64} className="placeholder-icon" />
      <h2 className="placeholder-title">{title}</h2>
      <p style={{ color: 'var(--text-secondary)' }}>
        This module is currently under development.
      </p>
      <Link to="/" className="placeholder-btn">
        <ArrowLeft size={20} />
        Back to Home
      </Link>
    </div>
  );
};

export default Placeholder;
