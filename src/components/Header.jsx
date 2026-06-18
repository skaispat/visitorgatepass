import React from 'react';
import { Building2 } from 'lucide-react';

const Header = () => {
  return (
    <header className="header">
      <div className="container header-content">
        <div className="header-brand">
          <div className="header-logo" style={{ background: 'none' }}>
            <img src="/logo2.jpg" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div>
            <h1 className="header-title">Visitor Gate Pass</h1>
            {/* <p className="header-subtitle">SKAISpat</p> */}
          </div>
        </div>
        {/* <p className="header-description">
          Manage visitor entries, approvals, and gate pass closures efficiently.
        </p> */}
      </div>
    </header>
  );
};

export default Header;
