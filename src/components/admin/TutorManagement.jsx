import React, { useState, useEffect } from 'react';
import AddTutorForm from './tutors/AddTutorForm';
import UpdateTutorForm from './tutors/UpdateTutorForm';
import TutorProfile from './tutors/TutorProfile';
import TutorList from './tutors/TutorList';
import Popover from '../common/Popover';

const TutorManagement = () => {
  const [mode, setMode] = useState('list'); // 'list' | 'add' | 'update' | 'profile'
  const [selectedTutor, setSelectedTutor] = useState(null);

  // State for form data, errors, etc.
  const [formData, setFormData] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Used to trigger list refresh
  
  // Popover states
  const [showErrorPopover, setShowErrorPopover] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showLoginPopover, setShowLoginPopover] = useState(false);

  // Handlers for switching modes
  const handleAdd = () => {
    setFormData({});
    setMode('add');
  };

  // Handle Add Tutor API
  const handleAddTutor = async (formData) => {
    setIsSubmitting(true);
    try {
      // Get admin JWT
      const userStr = localStorage.getItem('userData');
      let token = null;
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          token = userObj.token;
        } catch (e) {
          token = null;
        }
      }
      if (!token) {
        setErrorMessage('You are not logged in as admin. Please log in.');
        setShowLoginPopover(true);
        setIsSubmitting(false);
        return;
      }
      // Prepare FormData for file uploads
      const fd = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'documents' && typeof value === 'object' && value !== null) {
          // Nested documents
          Object.entries(value).forEach(([docKey, docValue]) => {
            if (docKey === 'bankAccount' && typeof docValue === 'object' && docValue !== null) {
              Object.entries(docValue).forEach(([bankKey, bankValue]) => {
                if (bankValue instanceof File) {
                  fd.append(`documents.bankAccount.${bankKey}`, bankValue);
                } else if (bankValue) {
                  fd.append(`documents.bankAccount.${bankKey}`, bankValue);
                }
              });
            } else if (Array.isArray(docValue)) {
              docValue.forEach((file, idx) => {
                if (file instanceof File) {
                  fd.append(`documents.${docKey}`, file);
                }
              });
            } else if (docValue instanceof File) {
              fd.append(`documents.${docKey}`, docValue);
            } else if (docValue) {
              fd.append(`documents.${docKey}`, docValue);
            }
          });
        } else if (Array.isArray(value)) {
          value.forEach((v) => fd.append(key, v));
        } else if (value !== undefined && value !== null) {
          fd.append(key, value);
        }
      });
      // POST to backend
      const response = await fetch('/api/tutors', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: fd
      });
      const data = await response.json();
      if (!response.ok) {
        // Log full error response for debug
        console.error('[AddTutor] Backend error:', data, JSON.stringify(data.errors, null, 2));
        let errorMsg = 'Failed to add tutor';
        if (data && Array.isArray(data.errors) && data.errors.length > 0) {
          errorMsg = data.errors.map(e => e.msg || JSON.stringify(e)).join('\n');
        } else if (data && data.message) {
          errorMsg = data.message;
        }
        setErrorMessage(errorMsg);
        setShowErrorPopover(true);
        setIsSubmitting(false);
        return;
      }
      // Don't show an alert here - the AddTutorForm will show its own success popover
      // The form component will handle this with its own popover
      setIsSubmitting(false);
      // Don't immediately reset - let the form show its success message first
      // The form's success popover onClose handler will reset the form
    } catch (err) {
      setErrorMessage(err.message || 'Failed to add tutor');
      setShowErrorPopover(true);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle Update Tutor API
  const handleUpdateTutor = async (updatedData) => {
    if (!selectedTutor || !selectedTutor._id) {
      setErrorMessage('No tutor selected for update');
      setShowErrorPopover(true);
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Get admin JWT
      const userStr = localStorage.getItem('userData');
      let token = null;
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          token = userObj.token;
        } catch (e) {
          token = null;
        }
      }
      if (!token) {
        setErrorMessage('You are not logged in as admin. Please log in.');
        setShowLoginPopover(true);
        setIsSubmitting(false);
        return;
      }
      
      // Prepare FormData for file uploads
      const fd = new FormData();
      Object.entries(updatedData).forEach(([key, value]) => {
        if (key === 'documents' && typeof value === 'object' && value !== null) {
          // Nested documents
          Object.entries(value).forEach(([docKey, docValue]) => {
            if (docKey === 'bankAccount' && typeof docValue === 'object' && docValue !== null) {
              Object.entries(docValue).forEach(([bankKey, bankValue]) => {
                if (bankValue instanceof File) {
                  fd.append(`documents.bankAccount.${bankKey}`, bankValue);
                } else if (bankValue) {
                  fd.append(`documents.bankAccount.${bankKey}`, bankValue);
                }
              });
            } else if (Array.isArray(docValue)) {
              docValue.forEach((file, idx) => {
                if (file instanceof File) {
                  fd.append(`documents.${docKey}`, file);
                }
              });
            } else if (docValue instanceof File) {
              fd.append(`documents.${docKey}`, docValue);
            } else if (docValue) {
              fd.append(`documents.${docKey}`, docValue);
            }
          });
        } else if (Array.isArray(value)) {
          value.forEach((v) => fd.append(key, v));
        } else if (value !== undefined && value !== null) {
          fd.append(key, value);
        }
      });
      
      // PUT to backend
      const response = await fetch(`/api/tutors/${selectedTutor._id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: fd
      });
      
      const data = await response.json();
      if (!response.ok) {
        console.error('[UpdateTutor] Backend error:', data);
        let errorMsg = 'Failed to update tutor';
        if (data && Array.isArray(data.errors) && data.errors.length > 0) {
          errorMsg = data.errors.map(e => e.msg || JSON.stringify(e)).join('\n');
        } else if (data && data.message) {
          errorMsg = data.message;
        }
        setErrorMessage(errorMsg);
        setShowErrorPopover(true);
        setIsSubmitting(false);
        return;
      }
      
      // This is a critical fix - we need to set these values but NOT redirect immediately
      // Let the form show its own success message first
      setIsSubmitting(false);
      
      // This is needed for the popover in UpdateTutorForm to work correctly
      // Don't navigate away immediately - let the form handle it
      // We'll still update these values so they're ready when the form redirects
      setFormData({});
      setSelectedTutor(null);
      // Trigger refresh of tutor list for when we return to it
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update tutor');
      setShowErrorPopover(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (tutor) => {
    setSelectedTutor(tutor);
    setFormData(tutor);
    setMode('update');
  };
  const handleProfile = (tutor) => {
    setSelectedTutor(tutor);
    setMode('profile');
  };
  const handleBackToList = () => {
    setSelectedTutor(null);
    setFormData({});
    setMode('list');
    // Trigger refresh when returning to list
    setRefreshTrigger(prev => prev + 1);
  };
  
  // Handle delete tutor (if needed at this level)
  const handleDeleteTutor = (tutorId) => {
    // The actual deletion is handled in TutorList component
    // Just refresh the list after deletion
    setRefreshTrigger(prev => prev + 1);
  };

  // Render based on mode
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {mode === 'list' && (
        <>
          <div style={{ 
            background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', 
            borderRadius: '12px', 
            padding: '32px', 
            marginBottom: '32px',
            color: 'white',
            boxShadow: '0 10px 25px rgba(59, 130, 246, 0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0' }}>Tutor Management</h1>
                <p style={{ fontSize: '16px', margin: '0', opacity: '0.9' }}>Manage all tutors, their profiles, and assignments</p>
              </div>
              <button
                style={{ 
                  padding: '12px 28px', 
                  background: 'white', 
                  color: '#1e3a8a', 
                  border: 'none', 
                  borderRadius: '8px', 
                  fontWeight: '600', 
                  fontSize: '16px', 
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onClick={handleAdd}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Add Tutor
              </button>
            </div>
          </div>
          
          <div style={{ 
            background: 'white', 
            borderRadius: '12px', 
            padding: '24px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
            marginBottom: '32px'
          }}>
            <TutorList 
              onEdit={handleEdit} 
              onDelete={handleDeleteTutor} 
              onProfile={handleProfile} 
              key={refreshTrigger} // Force re-render on refresh
            />
          </div>
        </>
      )}
      {mode === 'add' && (
        <div style={{ 
          background: 'white', 
          borderRadius: '12px', 
          padding: '24px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center' }}>
            <button 
              onClick={handleBackToList}
              style={{ 
                background: 'transparent', 
                border: 'none', 
                display: 'flex', 
                alignItems: 'center',
                fontSize: '16px',
                color: '#4b5563',
                cursor: 'pointer',
                padding: '8px 12px',
                borderRadius: '6px',
                marginRight: '16px'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Back
            </button>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>Add New Tutor</h2>
          </div>
          <AddTutorForm 
            onSubmit={handleAddTutor} 
            formData={formData} 
            setFormData={setFormData} 
            fieldErrors={fieldErrors} 
            isSubmitting={isSubmitting} 
          />
        </div>
      )}
      {mode === 'update' && (
        <div style={{ 
          background: 'white', 
          borderRadius: '12px', 
          padding: '24px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center' }}>
            <button 
              onClick={handleBackToList}
              style={{ 
                background: 'transparent', 
                border: 'none', 
                display: 'flex', 
                alignItems: 'center',
                fontSize: '16px',
                color: '#4b5563',
                cursor: 'pointer',
                padding: '8px 12px',
                borderRadius: '6px',
                marginRight: '16px'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Back
            </button>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>Edit Tutor: {selectedTutor?.name}</h2>
          </div>
          <UpdateTutorForm 
            onSubmit={handleUpdateTutor} 
            formData={formData} 
            setFormData={setFormData} 
            fieldErrors={fieldErrors} 
            isSubmitting={isSubmitting} 
            tutorId={selectedTutor?._id}
            onCancel={handleBackToList} /* Added to close form instead of navigating back */
          />
        </div>
      )}
      {mode === 'profile' && selectedTutor && (
        <div style={{ 
          background: 'white', 
          borderRadius: '12px', 
          padding: '24px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)'
        }}>
          <TutorProfile tutor={selectedTutor} onClose={handleBackToList} />
        </div>
      )}
      
      {/* Error Popover */}
      <Popover
        isOpen={showErrorPopover}
        onClose={() => setShowErrorPopover(false)}
        title="Error"
        message={errorMessage}
        type="error"
      />
      
      {/* Login Required Popover */}
      <Popover
        isOpen={showLoginPopover}
        onClose={() => setShowLoginPopover(false)}
        title="Authentication Required"
        message={errorMessage}
        type="warning"
      />
    </div>
  );
};

export default TutorManagement;
