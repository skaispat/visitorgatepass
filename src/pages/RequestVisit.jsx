import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Check, UploadCloud, SwitchCamera } from 'lucide-react';
import Webcam from 'react-webcam';
import { supabase } from '../supabaseClient';

const RequestVisit = () => {
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(true);
  const [photoSrc, setPhotoSrc] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const [formData, setFormData] = useState({
    visitor_name: '',
    mobile_number: '',
    visitor_address: '',
    purpose_of_visit: '',
    person_to_meet: ''
  });

  const [employees, setEmployees] = useState([]);
  const [empSearchTerm, setEmpSearchTerm] = useState('');
  const [showEmpDropdown, setShowEmpDropdown] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      const { data, error } = await supabase.from('users').select('emp_id, full_name, department').eq('is_active', true);
      if (!error && data) {
        setEmployees(data);
      }
    };
    fetchEmployees();
  }, []);

  const filteredEmployees = employees.filter(emp =>
    emp.full_name?.toLowerCase().includes(empSearchTerm.toLowerCase()) ||
    emp.department?.toLowerCase().includes(empSearchTerm.toLowerCase())
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setPhotoSrc(imageSrc);
    setIsCapturing(false);
  }, [webcamRef]);

  const retakePhoto = () => {
    setPhotoSrc(null);
    setIsCapturing(true);
  };

  const dataURLtoBlob = (dataurl) => {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!photoSrc) {
      setError('Please capture a visitor photo.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Upload photo to Supabase Storage
      const fileName = `visitor_${Date.now()}.jpg`;
      const fileBlob = dataURLtoBlob(photoSrc);

      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('images')
        .upload(fileName, fileBlob, {
          contentType: 'image/jpeg'
        });

      if (uploadError) {
        // Fallback: If bucket doesn't exist, we might just store base64 or fail gracefully
        // We will throw error to let user know they need to create the bucket
        throw new Error(`Storage Error: ${uploadError.message}. Make sure 'images' bucket exists and is public.`);
      }

      // Get public URL
      const { data: publicUrlData } = supabase
        .storage
        .from('images')
        .getPublicUrl(fileName);

      const photoUrl = publicUrlData.publicUrl;

      // 2. Insert record into database
      // Assuming table name is 'visitors' or 'visitor_gate_passes'
      // We will use 'visitors' as a general name. Adjust if needed.
      // Calculate IST time (UTC + 5:30)
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istDate = new Date(now.getTime() + istOffset);
      const inTimeIST = istDate.toISOString().slice(0, 19).replace('T', ' ');

      const { error: dbError } = await supabase
        .from('visitors')
        .insert([{
          visitor_name: formData.visitor_name,
          mobile_number: formData.mobile_number,
          visitor_address: formData.visitor_address,
          purpose_of_visit: formData.purpose_of_visit,
          person_to_meet: formData.person_to_meet, // Must be a valid emp_id from users table
          visitor_photo: photoUrl,
          in_time: inTimeIST,
          out_time: null,
          status: true
        }]);

      if (dbError) throw dbError;

      // Success! Show popup instead of alert
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        navigate('/');
      }, 3000);

    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred while submitting the form.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1.5rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
        <Link to="/" className="action-card-btn" style={{ width: 'auto', padding: '0.5rem 1rem', backgroundColor: 'var(--surface-color)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
          <ArrowLeft size={20} />
        </Link>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700' }}>New Visit</h2>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        {/* Photo Capture Section */}
        <div style={{ backgroundColor: 'var(--surface-color)', padding: '2rem', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
            <div style={{ backgroundColor: 'rgba(128, 0, 0, 0.1)', padding: '0.5rem', borderRadius: '0.5rem', color: 'var(--primary)' }}>
              <Camera size={20} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '600', margin: 0 }}>Visitor Photo</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', backgroundColor: 'var(--bg-color)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-color)' }}>

            {isCapturing && !photoSrc && (
              <div style={{ width: '100%', maxWidth: '400px', position: 'relative' }}>
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ facingMode }}
                  style={{ width: '100%', borderRadius: '0.5rem' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', marginTop: '1.5rem', width: '100%' }}>

                  {/* Invisible Spacer to keep shutter perfectly centered */}
                  <div style={{ width: '48px', flexShrink: 0 }}></div>

                  {/* Native Shutter Button (Reduced Size) */}
                  <button type="button" onClick={capture} title="Capture Photo" style={{
                    width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'transparent', border: '3px solid var(--primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, transition: 'transform 0.1s', flexShrink: 0
                  }}
                    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <div style={{ width: '46px', height: '46px', borderRadius: '50%', backgroundColor: 'var(--primary)' }}></div>
                  </button>

                  {/* Switch Camera Button (Fixed gap on right) */}
                  <button type="button" onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')} title="Switch Camera" style={{
                    width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--surface-color)', color: 'var(--text-primary)', flexShrink: 0,
                    border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: 'var(--shadow-sm)'
                  }}>
                    <SwitchCamera size={22} />
                  </button>
                </div>
              </div>
            )}

            {photoSrc && (
              <div style={{ textAlign: 'center' }}>
                <img src={photoSrc} alt="Visitor" style={{ width: '100%', maxWidth: '280px', borderRadius: '1rem', border: '4px solid white', boxShadow: 'var(--shadow-md)', marginBottom: '1.5rem' }} />
                <button type="button" onClick={retakePhoto} className="action-card-btn" style={{ backgroundColor: 'white', color: 'var(--text-primary)', border: '1px solid var(--border-color)', display: 'flex', gap: '0.5rem', margin: '0 auto', boxShadow: 'var(--shadow-sm)' }}>
                  Retake Photo
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Visitor Details Section */}
        <div style={{ backgroundColor: 'var(--surface-color)', padding: '2rem', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)' }}>
          <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '600', margin: 0 }}>Visitor Details</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label className="form-label">Visitor Name *</label>
              <input className="form-input" required type="text" name="visitor_name" value={formData.visitor_name} onChange={handleInputChange} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label className="form-label">Mobile Number *</label>
              <input className="form-input" required type="tel" name="mobile_number" value={formData.mobile_number} onChange={handleInputChange} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: '1 / -1' }}>
              <label className="form-label">Visitor Address *</label>
              <input className="form-input" required type="text" name="visitor_address" value={formData.visitor_address} onChange={handleInputChange} placeholder="Full address" />
            </div>
          </div>
        </div>

        {/* Visit Details Section */}
        <div style={{ backgroundColor: 'var(--surface-color)', padding: '2rem', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)' }}>
          <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '600', margin: 0 }}>Visit Details</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: '1 / -1' }}>
              <label className="form-label">Purpose of Visit *</label>
              <input className="form-input" required type="text" name="purpose_of_visit" value={formData.purpose_of_visit} onChange={handleInputChange} placeholder="e.g., Interview, Meeting, Delivery" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: '1 / -1', position: 'relative' }}>
              <label className="form-label">Person to Meet *</label>
              <input
                className="form-input"
                type="text"
                placeholder="Search by name or department..."
                value={empSearchTerm}
                onChange={(e) => {
                  setEmpSearchTerm(e.target.value);
                  setFormData(prev => ({ ...prev, person_to_meet: '' })); // clear selected id if typing
                  setShowEmpDropdown(true);
                }}
                onFocus={() => setShowEmpDropdown(true)}
                onBlur={() => setTimeout(() => setShowEmpDropdown(false), 200)}
                required={!formData.person_to_meet}
              />

              {showEmpDropdown && empSearchTerm.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                  backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)', marginTop: '0.25rem', boxShadow: 'var(--shadow-md)',
                  maxHeight: '200px', overflowY: 'auto'
                }}>
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map(emp => (
                      <div
                        key={emp.emp_id}
                        onClick={() => {
                          setEmpSearchTerm(emp.full_name);
                          setFormData(prev => ({ ...prev, person_to_meet: emp.emp_id }));
                          setShowEmpDropdown(false);
                        }}
                        style={{
                          padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--bg-color)',
                          display: 'flex', flexDirection: 'column', transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-color)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{emp.full_name}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{emp.department || 'No Department'}</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      No employees found.
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>

        <div style={{ marginTop: '0.5rem' }}>
          <button type="submit" disabled={loading} className="action-card-btn" style={{
            width: '100%',
            display: 'flex',
            gap: '0.5rem',
            justifyContent: 'center',
            padding: '0.875rem',
            fontSize: '1rem',
            background: 'linear-gradient(135deg, var(--primary) 0%, #b30000 100%)',
            boxShadow: '0 4px 6px -1px rgba(128, 0, 0, 0.2)'
          }}>
            {loading ? <UploadCloud size={18} /> : <Check size={18} />}
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>

      </form>

      {/* Success Modal */}
      {showSuccess && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'var(--surface-color)', padding: '2.5rem', borderRadius: '1.5rem', textAlign: 'center', maxWidth: '400px', width: '90%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid var(--border-color)' }}>
            <div style={{ width: '80px', height: '80px', backgroundColor: '#ecbaaeff', color: '#d33a0cff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto', boxShadow: '0 4px 6px -1px rgba(22, 163, 74, 0.2)' }}>
              <Check size={40} />
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Pass Generated!</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1.05rem', lineHeight: '1.5' }}>
              The visitor gate pass was created successfully.
            </p>
            {/* <button 
              onClick={() => navigate('/')} 
              className="action-card-btn" 
              style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)' }}
            >
              Return Home
            </button> */}
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestVisit;
