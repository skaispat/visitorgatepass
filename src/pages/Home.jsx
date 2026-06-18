import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, DoorClosed, Clock, Loader } from 'lucide-react';
import { supabase } from '../supabaseClient';

const Home = () => {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTodaysVisitors = async () => {
      try {
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istDate = new Date(now.getTime() + istOffset);
        const todayStr = istDate.toISOString().slice(0, 10); // YYYY-MM-DD

        const todayStart = `${todayStr} 00:00:00`;
        const tomorrow = new Date(istDate);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().slice(0, 10);
        const tomorrowStart = `${tomorrowStr} 00:00:00`;

        const { data, error } = await supabase
          .from('visitors')
          .select(`
            id, visitor_name, in_time, status, purpose_of_visit,
            users ( full_name )
          `)
          .gte('in_time', todayStart)
          .lt('in_time', tomorrowStart)
          .order('in_time', { ascending: false });

        if (error) throw error;
        setVisitors(data || []);
      } catch (error) {
        console.error('Error fetching today visitors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTodaysVisitors();
  }, []);

  return (
    <div className="home-page" style={{ padding: '2rem 1rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ backgroundColor: 'var(--surface-color)', padding: '2rem', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-color)' }}>

        {/* Centered Logo */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <img src="/logo2.jpg" alt="Logo" style={{ width: '180px', height: 'auto' }} />
        </div>

        {/* Header */}
        <h1 style={{ textAlign: 'center', fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '2rem' }}>
          Visitor Management
        </h1>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem' }}>
          <Link to="/request-visit" className="action-card-btn" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.875rem 0.5rem', background: 'linear-gradient(135deg, var(--primary) 0%, #b30000 100%)', color: 'white', textDecoration: 'none', boxShadow: 'var(--shadow-md)' }}>
            <UserPlus size={22} color="white" />
            <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>New Visit</span>
          </Link>
          <Link to="/close-pass" className="action-card-btn" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.875rem 0.5rem', background: 'linear-gradient(135deg, var(--primary) 0%, #b30000 100%)', color: 'white', textDecoration: 'none', boxShadow: 'var(--shadow-md)' }}>
            <DoorClosed size={22} color="white" />
            <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Close Visit</span>
          </Link>
        </div>

        {/* Today's Visitors Section */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-primary)' }}>Today's Visitors</h2>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <Loader size={24} className="spin" color="var(--primary)" />
            </div>
          ) : visitors.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>No visitors today yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {visitors.map(visitor => (
                <div key={visitor.id} style={{ backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>{visitor.visitor_name}</h3>
                    <span style={{
                      fontSize: '0.75rem', fontWeight: '700', padding: '0.25rem 0.6rem', borderRadius: '1rem',
                      backgroundColor: visitor.status ? '#15803d' : '#dc2626',
                      color: 'white'
                    }}>
                      {visitor.status ? 'IN' : 'OUT'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>To Meet:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{visitor.users?.full_name || 'N/A'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>In-Time:</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary)', fontWeight: '500' }}>
                        <Clock size={14} />
                        {new Date(visitor.in_time).toLocaleString('en-IN', { hour: 'numeric', minute: 'numeric', hour12: true })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
