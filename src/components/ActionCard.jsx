import React from 'react';
import { Link } from 'react-router-dom';

const ActionCard = ({ title, navigateTo, icon: Icon }) => {
  return (
    <Link to={navigateTo} className="action-card">
      {Icon && (
        <div className="action-card-icon">
          <Icon size={24} />
        </div>
      )}
      <div className="action-card-content">
        <h3 className="action-card-title">{title}</h3>
      </div>
    </Link>
  );
};

export default ActionCard;
