import React, { useState } from 'react';

const TutorProfile = ({ tutor, onClose }) => {
  const [showPassword, setShowPassword] = useState(false);
  
  if (!tutor) {
    return <div>No tutor data available</div>;
  }

  const sectionStyle = {
    background: '#ffffff',
    borderRadius: 12,
    padding: 28,
    marginBottom: 32,
    border: '1px solid #e5e7eb',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
  };

  const titleStyle = {
    fontWeight: 700,
    fontSize: 20,
    marginBottom: 20,
    color: '#1e40af',
    borderBottom: '2px solid #dbeafe',
    paddingBottom: 10
  };

  const fieldStyle = {
    marginBottom: 18,
    display: 'flex',
    flexDirection: 'column'
  };

  const labelStyle = {
    fontWeight: 600,
    marginBottom: 6,
    fontSize: 14,
    color: '#4b5563'
  };

  const valueStyle = {
    fontSize: 16,
    color: '#111827',
    padding: '8px 12px',
    background: '#f9fafb',
    borderRadius: 6,
    border: '1px solid #f0f0f0'
  };
  
  const tagStyle = {
    display: 'inline-block',
    padding: '4px 10px',
    margin: '2px 4px 2px 0',
    borderRadius: '16px',
    background: '#dbeafe',
    color: '#1e40af',
    fontSize: '14px'
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '30px', backgroundColor: '#f8fafc', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
        <div>
          <h2 style={{ fontSize: 32, fontWeight: 800, margin: 0, color: '#1e40af' }}>Tutor Profile</h2>
          <p style={{ color: '#64748b', marginTop: 5 }}>{tutor.name}'s complete information</p>
        </div>
        <button 
          onClick={onClose}
          style={{ 
            padding: '10px 20px', 
            background: '#3b82f6', 
            color: 'white', 
            border: 'none', 
            borderRadius: 8, 
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span style={{ fontSize: '18px' }}>←</span> Back to List
        </button>
      </div>

      {/* Personal Information */}
      <div style={sectionStyle}>
        <div style={titleStyle}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            Personal Information
          </span>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div style={fieldStyle}>
            <div style={labelStyle}>Name</div>
            <div style={valueStyle}>{tutor.name || 'Not provided'}</div>
          </div>
          
          <div style={fieldStyle}>
            <div style={labelStyle}>Email</div>
            <div style={valueStyle}>{tutor.email || 'Not provided'}</div>
          </div>
          
          <div style={fieldStyle}>
            <div style={labelStyle}>Phone (Login Username)</div>
            <div style={valueStyle}>{tutor.phone || 'Not provided'}</div>
          </div>
          
          {/* Login password field removed as requested */}
          
          <div style={fieldStyle}>
            <div style={labelStyle}>Qualifications</div>
            <div style={valueStyle}>{tutor.qualifications || 'Not provided'}</div>
          </div>
        </div>
      </div>

      {/* Center & Subjects */}
      <div style={sectionStyle}>
        <div style={titleStyle}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            Center & Subjects
          </span>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div style={fieldStyle}>
            <div style={labelStyle}>Assigned Center</div>
            <div style={valueStyle}>
              {tutor.assignedCenter ? (
                typeof tutor.assignedCenter === 'object' ? (
                  <span style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    color: '#047857'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    {tutor.assignedCenter.name}
                  </span>
                ) : 'ID: ' + tutor.assignedCenter
              ) : 'Not assigned'}
            </div>
          </div>
          
          <div style={fieldStyle}>
            <div style={labelStyle}>Subjects</div>
            <div style={{ ...valueStyle, display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {Array.isArray(tutor.subjects) && tutor.subjects.length > 0 
                ? tutor.subjects.map((subject, index) => (
                  <span key={index} style={tagStyle}>{subject}</span>
                ))
                : <span style={{ color: '#6b7280', fontStyle: 'italic' }}>No subjects assigned</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Session Information */}
      <div style={sectionStyle}>
        <div style={titleStyle}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            Session Information
          </span>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div style={fieldStyle}>
            <div style={labelStyle}>Session Type</div>
            <div style={valueStyle}>
              {tutor.sessionType ? (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: tutor.sessionType === 'arabic' ? '#0369a1' : '#9333ea'
                }}>
                  {tutor.sessionType === 'arabic' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"></path></svg>
                  )}
                  {tutor.sessionType === 'arabic' ? 'Arabic' : 'Tuition'}
                </span>
              ) : <span style={{ color: '#6b7280', fontStyle: 'italic' }}>Not specified</span>}
            </div>
          </div>
          
          <div style={fieldStyle}>
            <div style={labelStyle}>Session Timing</div>
            <div style={valueStyle}>
              {tutor.sessionTiming ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a9 9 0 1 0 0 18 9 9 0 0 0 0-18z"></path><polyline points="12 6 12 12 16 14"></polyline></svg>
                  {tutor.sessionTiming === 'after_fajr' ? 'Post Fajr' : 
                   tutor.sessionTiming === 'after_zohar' ? 'Post Zohar' : 
                   tutor.sessionTiming === 'after_asar' ? 'Post Asar' : 
                   tutor.sessionTiming === 'after_maghrib' ? 'Post Maghrib' : 
                   tutor.sessionTiming === 'after_isha' ? 'Post Isha' : 
                   tutor.sessionTiming}
                </span>
              ) : <span style={{ color: '#6b7280', fontStyle: 'italic' }}>Not specified</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Hadiya */}
      <div style={sectionStyle}>
        <div style={titleStyle}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            Hadiya
          </span>
        </div>
        
        <div style={fieldStyle}>
          <div style={labelStyle}>Assigned Hadiya Amount</div>
          <div style={valueStyle}>
            {tutor.assignedHadiyaAmount ? (
              <span style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px', 
                color: '#047857', 
                fontWeight: 600 
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                ₹{tutor.assignedHadiyaAmount}
              </span>
            ) : (
              <span style={{ color: '#6b7280', fontStyle: 'italic' }}>Not assigned</span>
            )}
          </div>
        </div>
      </div>

      {/* Documents & Identification */}
      <div style={sectionStyle}>
        <div style={titleStyle}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            Identification
          </span>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div style={fieldStyle}>
            <div style={labelStyle}>Aadhar Number</div>
            <div style={{ 
              ...valueStyle, 
              letterSpacing: '1px',
              fontFamily: 'monospace',
              fontSize: '15px'
            }}>
              {tutor.aadharNumber ? (
                <span>
                  {/* Format Aadhar number as XXXX XXXX XXXX */}
                  {tutor.aadharNumber.replace(/[^0-9]/g, '').match(/.{1,4}/g)?.join(' ') || tutor.aadharNumber}
                </span>
              ) : (
                <span style={{ color: '#6b7280', fontStyle: 'italic' }}>Not provided</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bank Details */}
      <div style={sectionStyle}>
        <div style={titleStyle}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            Bank Details
          </span>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div style={fieldStyle}>
            <div style={labelStyle}>Bank Name</div>
            <div style={valueStyle}>
              <span style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                {tutor.bankName || <span style={{ color: '#6b7280', fontStyle: 'italic' }}>Not provided</span>}
              </span>
            </div>
          </div>
          
          <div style={fieldStyle}>
            <div style={labelStyle}>Bank Branch</div>
            <div style={valueStyle}>{tutor.bankBranch || <span style={{ color: '#6b7280', fontStyle: 'italic' }}>Not provided</span>}</div>
          </div>
          
          <div style={fieldStyle}>
            <div style={labelStyle}>Account Number</div>
            <div style={{ 
              ...valueStyle, 
              fontFamily: 'monospace', 
              letterSpacing: '0.5px',
              fontSize: '15px'
            }}>
              {tutor.accountNumber || <span style={{ color: '#6b7280', fontStyle: 'italic' }}>Not provided</span>}
            </div>
          </div>
          
          <div style={fieldStyle}>
            <div style={labelStyle}>IFSC Code</div>
            <div style={{ 
              ...valueStyle, 
              fontFamily: 'monospace', 
              letterSpacing: '1px',
              fontSize: '15px',
              textTransform: 'uppercase'
            }}>
              {tutor.ifscCode || <span style={{ color: '#6b7280', fontStyle: 'italic' }}>Not provided</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorProfile;
