// src/components/admin/AdminEditLotto.js
import React, { useState, useEffect } from 'react';
import api from '../../config/api';

const AdminEditLotto = () => {
  const [winningNumbers, setWinningNumbers] = useState({
    lunchtime: ['00', '00', '00', '00'],
    teatime: ['00', '00', '00', '00'],
    goslotto536: ['00', '00', '00', '00'],
    goslotto749: ['00', '00', '00', '00'],
    powerball: ['00', '00', '00', '00']
  });
  const [originalNumbers, setOriginalNumbers] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingSection, setSavingSection] = useState(null);
  const [moving, setMoving] = useState(false);

  useEffect(() => {
    fetchWinningNumbers();
  }, []);

  const fetchWinningNumbers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/winning-numbers');
      const data = response.data || {};

      const normalizeArr = (arr) => {
        if (!Array.isArray(arr)) return ['00', '00', '00', '00'];
        const sliced = arr.slice(0, 4);
        while (sliced.length < 4) sliced.push('00');
        return sliced.map(n => {
          if (!n && n !== '') return '00';
          const s = String(n).padStart(2, '0').slice(-2);
          return s;
        });
      };

      const fetched = {
        lunchtime: normalizeArr(data.lunchtime),
        teatime: normalizeArr(data.teatime),
        goslotto536: normalizeArr(data.goslotto536),
        goslotto749: normalizeArr(data.goslotto749),
        powerball: normalizeArr(data.powerball)
      };

      setWinningNumbers(fetched);
      setOriginalNumbers(fetched);
    } catch (error) {
      console.error('Error fetching winning numbers:', error);
      alert('Failed to fetch winning numbers: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleNumberChange = (section, index, value) => {
    let numericValue = value.replace(/[^0-9]/g, '').slice(0, 2);
    const updatedNumbers = [...winningNumbers[section]];
    updatedNumbers[index] = numericValue === '' ? '' : numericValue;
    
    setWinningNumbers({
      ...winningNumbers,
      [section]: updatedNumbers
    });
  };

  const handleNumberBlur = (section, index, value) => {
    let numericValue = String(value || '').replace(/[^0-9]/g, '');

    if (!numericValue || numericValue === '') {
      numericValue = '00';
    } else if (numericValue.length === 1) {
      numericValue = numericValue.padStart(2, '0');
    } else if (numericValue.length > 2) {
      numericValue = numericValue.slice(0, 2);
    }

    const updatedNumbers = [...winningNumbers[section]];
    updatedNumbers[index] = numericValue;
    
    setWinningNumbers({
      ...winningNumbers,
      [section]: updatedNumbers
    });
  };

  const handleKeyDown = (e, section, index) => {
    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      const updatedNumbers = [...winningNumbers[section]];
      updatedNumbers[index] = '';
      setWinningNumbers({
        ...winningNumbers,
        [section]: updatedNumbers
      });
    }
  };

  const handleFocus = (e) => {
    e.target.select();
  };

  const validateAllNumbers = (numbersObj) => {
    const allSections = Object.values(numbersObj);
    const hasInvalidNumbers = allSections.some(section =>
      section.some(num => !num || num.length !== 2 || isNaN(parseInt(num)))
    );
    return !hasInvalidNumbers;
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {};
      Object.keys(winningNumbers).forEach(section => {
        payload[section] = winningNumbers[section].map(n => {
          if (!n || String(n).trim() === '') return '00';
          const s = String(n).padStart(2, '0').slice(-2);
          return s;
        });
      });

      if (!validateAllNumbers(payload)) {
        alert('Please make sure all numbers are valid 2-digit numbers (00-99)');
        return;
      }

      await api.post('/admin/winning-numbers', payload);
      alert('Numbers saved successfully');
      setOriginalNumbers(payload);
      setWinningNumbers(payload);
    } catch (error) {
      console.error('Error saving numbers:', error);
      alert('Failed to save numbers: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSection = async (section) => {
    if (!originalNumbers) {
      return handleSave();
    }

    try {
      setSavingSection(section);
      const payload = { ...originalNumbers };
      payload[section] = winningNumbers[section].map(n => {
        if (!n || String(n).trim() === '') return '00';
        return String(n).padStart(2, '0').slice(-2);
      });

      await api.post('/admin/winning-numbers', payload);
      alert(`Section "${section}" updated successfully`);
      setOriginalNumbers(payload);
      setWinningNumbers(payload);
    } catch (error) {
      console.error('Error saving section:', error);
      alert('Failed to save section: ' + (error.response?.data?.message || error.message));
    } finally {
      setSavingSection(null);
    }
  };

  const handleMove = async () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultDate = prompt('Enter date for past records (YYYY-MM-DD):', today);
    
    if (!defaultDate) return;
    
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(defaultDate)) {
      alert('Please enter a valid date in YYYY-MM-DD format');
      return;
    }

    if (!window.confirm('Are you sure you want to move current numbers to past records? This will reset current numbers to "00".')) {
      return;
    }

    try {
      setMoving(true);
      
      // First, get the current winning numbers to ensure we have the latest
      const response = await api.get('/admin/winning-numbers');
      const currentData = response.data || {};
      
      // Create the past winning record
      const moveResponse = await api.post('/admin/move-winning-numbers', { 
        date: defaultDate,
        lotteryType: 'Daily Draw',
        lunchtime: currentData.lunchtime || winningNumbers.lunchtime,
        teatime: currentData.teatime || winningNumbers.teatime,
        goslotto536: currentData.goslotto536 || winningNumbers.goslotto536,
        goslotto749: currentData.goslotto749 || winningNumbers.goslotto749,
        powerball: currentData.powerball || winningNumbers.powerball
      });
      
      alert(moveResponse.data?.message || 'Numbers moved to past records successfully');
      
      // Reset current numbers after moving
      const resetNumbers = {
        lunchtime: ['00', '00', '00', '00'],
        teatime: ['00', '00', '00', '00'],
        goslotto536: ['00', '00', '00', '00'],
        goslotto749: ['00', '00', '00', '00'],
        powerball: ['00', '00', '00', '00']
      };
      
      // Save reset numbers
      await api.post('/admin/winning-numbers', resetNumbers);
      
      // Update local state
      setWinningNumbers(resetNumbers);
      setOriginalNumbers(resetNumbers);
      
    } catch (error) {
      console.error('Error moving numbers:', error);
      alert('Failed to move numbers: ' + (error.response?.data?.message || error.message));
    } finally {
      setMoving(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset all numbers to 00?')) {
      const resetNumbers = {
        lunchtime: ['00', '00', '00', '00'],
        teatime: ['00', '00', '00', '00'],
        goslotto536: ['00', '00', '00', '00'],
        goslotto749: ['00', '00', '00', '00'],
        powerball: ['00', '00', '00', '00']
      };
      
      setWinningNumbers(resetNumbers);
      
      try {
        await api.post('/admin/winning-numbers', resetNumbers);
        setOriginalNumbers(resetNumbers);
        alert('All numbers have been reset to 00 and saved');
      } catch (error) {
        console.error('Error saving reset numbers:', error);
        alert('Numbers reset locally but failed to save: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const LottoBallInput = ({ section, index, value }) => {
    const displayValue = value === '00' ? '00' : (value === '' ? '' : value);

    return (
      <input
        type="text"
        value={displayValue}
        onChange={(e) => handleNumberChange(section, index, e.target.value)}
        onBlur={(e) => handleNumberBlur(section, index, e.target.value)}
        onKeyDown={(e) => handleKeyDown(e, section, index)}
        onFocus={handleFocus}
        placeholder="00"
        style={{
          width: '70px',
          height: '70px',
          borderRadius: '50%',
          textAlign: 'center',
          fontSize: '1.4rem',
          margin: '0 8px',
          border: '3px solid #3498db',
          backgroundColor: value === '00' ? '#f8f9fa' : '#e8f4fd',
          fontWeight: 'bold',
          color: value === '00' ? '#999' : '#2c3e50',
          transition: 'all 0.3s ease',
          cursor: 'text'
        }}
        maxLength={2}
        inputMode="numeric"
      />
    );
  };

  const LottoSection = ({ title, section, isSeparate = false }) => (
    <div style={{ 
      marginBottom: '30px', 
      padding: '25px', 
      border: '2px solid #bdc3c7',
      borderRadius: '10px',
      backgroundColor: 'white'
    }}>
      <h3 style={{ color: '#2c3e50', marginBottom: '20px' }}>{title}</h3>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '20px 0' }}>
        {winningNumbers[section].slice(0, 3).map((num, index) => (
          <LottoBallInput key={index} section={section} index={index} value={num} />
        ))}
        {isSeparate && (
          <>
            <div style={{ margin: '0 25px', fontSize: '2rem', color: '#e74c3c', fontWeight: 'bold' }}>+</div>
            <LottoBallInput section={section} index={3} value={winningNumbers[section][3]} />
          </>
        )}
        {!isSeparate && winningNumbers[section][3] !== undefined && (
          <LottoBallInput section={section} index={3} value={winningNumbers[section][3]} />
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '10px' }}>
        <button
          onClick={() => handleSaveSection(section)}
          disabled={savingSection === section}
          style={{
            ...actionButtonStyle,
            minWidth: '140px',
            backgroundColor: savingSection === section ? '#95a5a6' : '#3498db'
          }}
        >
          {savingSection === section ? 'Saving...' : `Update ${title.split(' ')[0]}`}
        </button>
      </div>

      <div style={{ textAlign: 'center', color: '#7f8c8d', fontSize: '0.9rem' }}>
        Click any circle and type 2 numbers (e.g., 12). Press Delete/Backspace to clear both numbers and type new ones.
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Edit Lotto Numbers</h2>
        <div>Loading winning numbers...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Edit Lotto Numbers</h2>

      <div style={{ 
        marginBottom: '20px', 
        padding: '15px',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '5px',
        color: '#856404'
      }}>
        💡 <strong>Move to Past Records:</strong><br/>
        • Current numbers will be saved to past records with the selected date<br/>
        • Current numbers will be reset to "00" after moving<br/>
        • Past records automatically disappear after 3 days<br/>
      </div>

      <LottoSection title="🍽️ Lunchtime Winning Numbers" section="lunchtime" isSeparate={true} />
      <LottoSection title="☕ Teatime Winning Numbers" section="teatime" isSeparate={true} />
      <LottoSection title="🇷🇺 Russia Goslotto 5/36 (08:00 Draw)" section="goslotto536" />
      <LottoSection title="🇷🇺 Russia Goslotto 7/49 (19:30 Draw)" section="goslotto749" />
      <LottoSection title="🎱 Powerball Winning Numbers" section="powerball" />

      <div style={{ 
        marginTop: '30px', 
        padding: '20px',
        backgroundColor: '#ecf0f1',
        borderRadius: '10px',
        textAlign: 'center'
      }}>
        <button 
          style={{...actionButtonStyle, backgroundColor: '#27ae60'}} 
          onClick={handleSave} 
          disabled={saving}
        >
          {saving ? 'Saving...' : '💾 Save Numbers'}
        </button>
        <button 
          style={{...actionButtonStyle, backgroundColor: '#3498db'}} 
          onClick={handleMove}
          disabled={moving}
        >
          {moving ? 'Moving...' : '📤 Move to Past Records'}
        </button>
        <button 
          style={{...actionButtonStyle, backgroundColor: '#e74c3c'}} 
          onClick={handleReset}
        >
          🗑️ Reset All to 00
        </button>
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
  transition: 'all 0.3s ease'
};

export default AdminEditLotto;