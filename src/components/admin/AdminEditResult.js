// src/components/admin/AdminEditResult.js
import React, { useState, useEffect } from 'react';
import api from '../../config/api';

const AdminEditResult = () => {
  const [results, setResults] = useState({
    lunchtime: ['', '', '', '', '', '', ''],
    teatime: ['', '', '', '', '', '', ''],
    goslotto536: ['', '', '', '', '', ''],
    goslotto749: ['', '', '', '', '', ''],
    powerball: ['', '', '', '', '', '']
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/results');
      const data = response.data;
      
      console.log('Fetched admin results:', data); // Debug log
      
      setResults({
        lunchtime: data.lunchtime?.slice(0, 7) || ['', '', '', '', '', '', ''],
        teatime: data.teatime?.slice(0, 7) || ['', '', '', '', '', '', ''],
        goslotto536: data.goslotto536?.slice(0, 6) || ['', '', '', '', '', ''],
        goslotto749: data.goslotto749?.slice(0, 6) || ['', '', '', '', '', ''],
        powerball: data.powerball?.slice(0, 6) || ['', '', '', '', '', '']
      });
    } catch (error) {
      console.error('Error fetching results:', error);
      alert('Failed to fetch results: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleNumberChange = (section, index, value) => {
    const numericValue = value.replace(/[^0-9]/g, '').slice(0, 2);
    
    const updatedNumbers = [...results[section]];
    updatedNumbers[index] = numericValue;
    
    setResults({
      ...results,
      [section]: updatedNumbers
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const allSections = Object.values(results);
      const isEmpty = allSections.some(section => 
        section.some(num => !num || num === '')
      );
      
      if (isEmpty) {
        alert('Please fill in all results before saving');
        return;
      }

      // Format numbers to ensure 2 digits
      const formattedData = {
        lunchtime: results.lunchtime.map(num => num.padStart(2, '0')),
        teatime: results.teatime.map(num => num.padStart(2, '0')),
        goslotto536: results.goslotto536.map(num => num.padStart(2, '0')),
        goslotto749: results.goslotto749.map(num => num.padStart(2, '0')),
        powerball: results.powerball.map(num => num.padStart(2, '0'))
      };

      console.log('Saving results:', formattedData); // Debug log
      
      await api.post('/admin/results', formattedData);
      alert('Results saved successfully!');
      
      // Refresh data after saving
      fetchResults();
    } catch (error) {
      console.error('Error saving results:', error);
      alert('Failed to save results: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset ALL results to "00"? This action cannot be undone.')) {
      return;
    }

    try {
      setResetting(true);
      
      // Create reset data with all "00" values
      const resetData = {
        lunchtime: ['00', '00', '00', '00', '00', '00', '00'],
        teatime: ['00', '00', '00', '00', '00', '00', '00'],
        goslotto536: ['00', '00', '00', '00', '00', '00'],
        goslotto749: ['00', '00', '00', '00', '00', '00'],
        powerball: ['00', '00', '00', '00', '00', '00']
      };

      console.log('Resetting results to:', resetData); // Debug log
      
      // Send reset data to backend
      await api.post('/admin/results', resetData);
      alert('All results have been reset to "00" and saved successfully!');
      
      // Update local state to show "00"
      setResults({
        lunchtime: ['00', '00', '00', '00', '00', '00', '00'],
        teatime: ['00', '00', '00', '00', '00', '00', '00'],
        goslotto536: ['00', '00', '00', '00', '00', '00'],
        goslotto749: ['00', '00', '00', '00', '00', '00'],
        powerball: ['00', '00', '00', '00', '00', '00']
      });
      
    } catch (error) {
      console.error('Error resetting results:', error);
      alert('Failed to reset results: ' + (error.response?.data?.message || error.message));
    } finally {
      setResetting(false);
    }
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all results to empty? This will only clear the form, not save to database.')) {
      setResults({
        lunchtime: ['', '', '', '', '', '', ''],
        teatime: ['', '', '', '', '', '', ''],
        goslotto536: ['', '', '', '', '', ''],
        goslotto749: ['', '', '', '', '', ''],
        powerball: ['', '', '', '', '', '']
      });
    }
  };

  const ResultSection = ({ title, section, ballCount }) => (
    <div style={{ 
      marginBottom: '30px', 
      padding: '25px', 
      border: '2px solid #bdc3c7',
      borderRadius: '10px',
      backgroundColor: 'white'
    }}>
      <h3 style={{ color: '#2c3e50', marginBottom: '20px' }}>{title}</h3>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '20px 0', flexWrap: 'wrap' }}>
        {results[section].map((num, index) => (
          <input
            key={index}
            type="text"
            value={num}
            onChange={(e) => handleNumberChange(section, index, e.target.value)}
            onBlur={(e) => {
              const value = e.target.value;
              if (value && !value.includes('00')) {
                const padded = value.padStart(2, '0');
                handleNumberChange(section, index, padded);
              }
            }}
            placeholder="00"
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              textAlign: 'center',
              fontSize: '1.2rem',
              margin: '8px',
              border: '3px solid #9b59b6',
              backgroundColor: num === '00' ? '#e8f4fd' : '#f8f9fa',
              fontWeight: 'bold',
              color: num === '00' ? '#666' : '#000'
            }}
            maxLength={2}
            inputMode="numeric"
          />
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Edit Results</h2>
        <div>Loading results...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Edit Results</h2>

      <div style={{ 
        marginBottom: '20px', 
        padding: '15px',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '5px',
        color: '#856404'
      }}>
        💡 <strong>Reset Function:</strong><br/>
        • <strong>Reset All to "00"</strong> - Resets all results to "00" and saves to database<br/>
        • <strong>Clear Form</strong> - Only clears the form fields locally without saving<br/>
      </div>

      <ResultSection title="🍽️ Lunchtime Results" section="lunchtime" ballCount={7} />
      <ResultSection title="☕ Teatime Results" section="teatime" ballCount={7} />
      <ResultSection title="🇷🇺 07:45 Goslotto 5/36 Draw Results" section="goslotto536" ballCount={6} />
      <ResultSection title="🇷🇺 07:45 Goslotto 7/49 Draw Results" section="goslotto749" ballCount={6} />
      <ResultSection title="🎱 Powerball Draw Results" section="powerball" ballCount={6} />

      <div style={{ 
        marginTop: '30px', 
        padding: '20px',
        backgroundColor: '#ecf0f1',
        borderRadius: '10px',
        textAlign: 'center'
      }}>
        <button style={{...actionButtonStyle, backgroundColor: '#27ae60'}} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : '💾 Save Results'}
        </button>
        <button 
          style={{...actionButtonStyle, backgroundColor: '#f39c12'}} 
          onClick={handleReset} 
          disabled={resetting}
        >
          {resetting ? 'Resetting...' : '🔄 Reset All to "00"'}
        </button>
        <button style={{...actionButtonStyle, backgroundColor: '#e74c3c'}} onClick={handleClear}>
          🗑️ Clear Form
        </button>
        <button style={{...actionButtonStyle, backgroundColor: '#3498db'}} onClick={fetchResults}>
          🔄 Refresh Data
        </button>
      </div>
      
      <div style={{ 
        marginTop: '20px', 
        padding: '10px',
        textAlign: 'center',
        color: '#7f8c8d',
        fontSize: '0.9rem'
      }}>
        <strong>Note:</strong> "Reset All to '00'" will save the reset state to database and update the public results page.
      </div>
    </div>
  );
};

const actionButtonStyle = {
  color: 'white',
  border: 'none',
  padding: '12px 24px',
  margin: '0 10px',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '1rem',
  fontWeight: 'bold',
  minWidth: '180px',
  transition: 'all 0.3s ease',
  marginBottom: '10px'
};

export default AdminEditResult;