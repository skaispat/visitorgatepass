import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, LogOut, Search, Check, Loader } from 'lucide-react';
import { supabase } from '../supabaseClient';

const ClosePass = () => {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'closed'
  const [closingId, setClosingId] = useState(null);

  const fetchVisitors = async () => {
    setLoading(true);
    try {
      // Fetch active visitors and join with users table to get the employee's full name
      const { data, error: fetchError } = await supabase
        .from('visitors')
        .select(`
          *,
          users ( full_name )
        `)
        .eq('status', activeTab === 'active')
        .order('in_time', { ascending: false });

      if (fetchError) throw fetchError;
      setVisitors(data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch active visitors. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, [activeTab]);

  const handleClosePass = async (id) => {
    setClosingId(id);

    try {
      // Calculate IST time for out_time
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istDate = new Date(now.getTime() + istOffset);
      const outTimeIST = istDate.toISOString().slice(0, 19).replace('T', ' ');

      const { error: updateError } = await supabase
        .from('visitors')
        .update({
          out_time: outTimeIST,
          status: false // Mark as inactive/closed
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Remove from list
      setVisitors(prev => prev.filter(v => v.id !== id));

      // Show toast
      setSuccessMsg("Gate pass closed successfully!");
      setTimeout(() => setSuccessMsg(''), 3000);

    } catch (err) {
      console.error(err);
      alert("Error closing gate pass. Please try again.");
    } finally {
      setClosingId(null);
    }
  };

  const filteredVisitors = visitors.filter(v =>
    v.visitor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.mobile_number?.includes(searchQuery)
  );

  return (
    <div className="container" style={{ padding: '2rem 1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
        <Link to="/" className="action-card-btn" style={{ width: 'auto', padding: '0.5rem 1rem', backgroundColor: 'var(--surface-color)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
          <ArrowLeft size={20} />
        </Link>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700' }}>Close Visit</h2>
      </div>

      <div style={{ display: 'flex', marginBottom: '1.5rem', position: 'relative' }}>
        <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        <input
          type="text"
          className="form-input"
          placeholder="Search active visitors by name or mobile..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ paddingLeft: '3rem' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', overflowX: 'auto' }}>
        <button
          onClick={() => setActiveTab('active')}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'active' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'active' ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'active' ? '600' : '500',
            cursor: 'pointer',
            fontSize: '1.05rem',
            whiteSpace: 'nowrap'
          }}>
          Active Passes
        </button>
        <button
          onClick={() => setActiveTab('closed')}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'closed' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'closed' ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'closed' ? '600' : '500',
            cursor: 'pointer',
            fontSize: '1.05rem',
            whiteSpace: 'nowrap'
          }}>
          Closed Passes
        </button>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          Loading active visitors...
        </div>
      ) : filteredVisitors.length === 0 ? (
        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', backgroundColor: 'var(--surface-color)', borderRadius: 'var(--radius-lg)' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>No {activeTab} visitors found.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {filteredVisitors.map(visitor => (
            <div key={visitor.id} style={{
              backgroundColor: 'var(--surface-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', paddingRight: '2.5rem' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden', backgroundColor: 'var(--bg-color)', flexShrink: 0 }}>
                  {visitor.visitor_photo ? (
                    <img
                      src={visitor.visitor_photo}
                      alt={visitor.visitor_name}
                      onClick={() => setSelectedImage(visitor.visitor_photo)}
                      title="Click to view full size"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer', transition: 'transform 0.2s' }}
                      onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>No Img</div>
                  )}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: '0 0 0.25rem 0' }}>{visitor.visitor_name}</h3>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{visitor.mobile_number}</p>
                </div>
              </div>

              <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'grid', gap: '0.5rem', backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>To Meet:</span>
                  <strong style={{ textAlign: 'right' }}>{visitor.users?.full_name || visitor.person_to_meet}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Purpose:</span>
                  <strong style={{ textAlign: 'right' }}>{visitor.purpose_of_visit}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Approval Status:</span>
                  <strong style={{ textAlign: 'right', color: visitor.approval_status ? '#16a34a' : (visitor.approval_status === false ? '#dc2626' : '#d97706') }}>
                    {visitor.approval_status ? 'Approved' : (visitor.approval_status === false ? 'Rejected' : 'Pending')}
                  </strong>
                </div>
                {visitor.approved_by && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Handled By:</span>
                    <strong style={{ textAlign: 'right' }}>{visitor.approved_by}</strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>In-Time:</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary)', fontWeight: '500' }}>
                    <Clock size={14} />
                    {new Date(visitor.in_time).toLocaleString('en-IN', { hour: 'numeric', minute: 'numeric', hour12: true, month: 'short', day: 'numeric' })}
                  </span>
                </div>
                {activeTab === 'closed' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Out Time:</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary)', fontWeight: '500' }}>
                      <Clock size={14} />
                      {new Date(visitor.out_time).toLocaleString('en-IN', { hour: 'numeric', minute: 'numeric', hour12: true, month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                )}
              </div>

              {activeTab === 'active' && (
                <button
                  onClick={() => handleClosePass(visitor.id)}
                  className="close-pass-btn"
                  title="Close Gate Pass"
                  disabled={closingId === visitor.id}
                >
                  {closingId === visitor.id ? <Loader size={18} className="spin" /> : 'Close'}
                </button>
              )}

            </div>
          ))}
        </div>
      )}

      {/* Fullscreen Image Modal */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            cursor: 'zoom-out',
            padding: '2rem',
            backdropFilter: 'blur(4px)'
          }}
        >
          <img
            src={selectedImage}
            alt="Full size visitor"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              objectFit: 'contain'
            }}
          />
        </div>
      )}

      {/* Toast Notification */}
      {successMsg && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#16a34a',
          color: 'white',
          padding: '1rem 1.5rem',
          borderRadius: '0.5rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          zIndex: 9999,
          fontWeight: '500'
        }}>
          <Check size={20} />
          {successMsg}
        </div>
      )}
    </div>
  );
};

export default ClosePass;
