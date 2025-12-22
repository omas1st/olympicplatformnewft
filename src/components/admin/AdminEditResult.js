// src/components/admin/AdminEditResult.js
import React, { useEffect, useState } from 'react';
import api from '../../config/api';

const SECTIONS = [
  { key: 'lunchtime', title: '🍽️ Lunchtime Results', count: 7 },
  { key: 'teatime', title: '☕ Teatime Results', count: 7 },
  { key: 'goslotto536', title: '🇷🇺 Goslotto 5/36 Results', count: 6 },
  { key: 'goslotto749', title: '🇷🇺 Goslotto 7/49 Results', count: 6 },
  { key: 'powerball', title: '🎱 Powerball Results', count: 6 }
];

const makeEmpty = (n) => Array.from({ length: n }, () => '');

export default function AdminEditResult() {
  const [results, setResults] = useState({
    lunchtime: makeEmpty(7),
    teatime: makeEmpty(7),
    goslotto536: makeEmpty(6),
    goslotto749: makeEmpty(6),
    powerball: makeEmpty(6)
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    fetchResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const normalizeArr = (arr, len) => {
    if (!Array.isArray(arr)) return makeEmpty(len);
    const sliced = arr.slice(0, len);
    while (sliced.length < len) sliced.push('');
    return sliced.map(n => {
      if (n === null || typeof n === 'undefined') return '';
      return String(n);
    });
  };

  const fetchResults = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/results');
      const data = res.data || {};
      // normalize lengths
      const fetched = {
        lunchtime: normalizeArr(data.lunchtime, 7),
        teatime: normalizeArr(data.teatime, 7),
        goslotto536: normalizeArr(data.goslotto536, 6),
        goslotto749: normalizeArr(data.goslotto749, 6),
        powerball: normalizeArr(data.powerball, 6)
      };
      setResults(fetched);
      console.log('Fetched admin results:', fetched);
    } catch (err) {
      console.error('Error fetching results:', err);
      alert('Failed to fetch results: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Update a single input following HomeBallsEditor pattern:
  const updateNumber = (section, idx, rawValue) => {
    const numeric = String(rawValue).replace(/[^0-9]/g, '').slice(0, 2);
    setResults(prev => {
      const clone = { ...prev };
      clone[section] = [...(clone[section] || makeEmpty(SECTIONS.find(s => s.key === section).count))];
      clone[section][idx] = numeric === '' ? '' : numeric;
      return clone;
    });
  };

  // On blur, pad if there's a value, otherwise leave empty (so save validation can catch empties)
  const handleBlurPad = (section, idx) => {
    setResults(prev => {
      const clone = { ...prev };
      clone[section] = [...(clone[section] || makeEmpty(SECTIONS.find(s => s.key === section).count))];
      let v = String(clone[section][idx] ?? '').replace(/[^0-9]/g, '');
      if (!v) {
        // keep empty
        clone[section][idx] = '';
      } else {
        if (v.length === 1) v = v.padStart(2, '0');
        else v = v.slice(-2);
        clone[section][idx] = v;
      }
      return clone;
    });
  };

  const handleKeyDown = (e, section, idx) => {
    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      setResults(prev => {
        const clone = { ...prev };
        clone[section] = [...(clone[section] || makeEmpty(SECTIONS.find(s => s.key === section).count))];
        clone[section][idx] = '';
        return clone;
      });
    }
  };

  const validateAllFilled = (state) => {
    return Object.values(state).every(arr => Array.isArray(arr) && arr.every(v => v !== '' && v !== null && typeof v !== 'undefined'));
  };

  const preparePayload = (state) => {
    const payload = {};
    Object.keys(state).forEach(section => {
      payload[section] = (state[section] || []).map(n => {
        const s = String(n || '').replace(/[^0-9]/g, '');
        if (!s) return '00';
        return s.padStart(2, '0').slice(-2);
      });
    });
    return payload;
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (!validateAllFilled(results)) {
        alert('Please fill in all results before saving.');
        return;
      }

      const formatted = preparePayload(results);
      console.log('Saving results:', formatted);
      await api.post('/admin/results', formatted);
      alert('Results saved successfully!');
      fetchResults();
    } catch (err) {
      console.error('Error saving results:', err);
      alert('Failed to save results: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset ALL results to "00"? This action cannot be undone.')) return;
    try {
      setResetting(true);
      const resetData = {
        lunchtime: Array.from({ length: 7 }, () => '00'),
        teatime: Array.from({ length: 7 }, () => '00'),
        goslotto536: Array.from({ length: 6 }, () => '00'),
        goslotto749: Array.from({ length: 6 }, () => '00'),
        powerball: Array.from({ length: 6 }, () => '00')
      };
      console.log('Resetting results to:', resetData);
      await api.post('/admin/results', resetData);
      alert('All results have been reset to "00" and saved successfully!');
      setResults({
        lunchtime: resetData.lunchtime,
        teatime: resetData.teatime,
        goslotto536: resetData.goslotto536,
        goslotto749: resetData.goslotto749,
        powerball: resetData.powerball
      });
    } catch (err) {
      console.error('Error resetting results:', err);
      alert('Failed to reset results: ' + (err.response?.data?.message || err.message));
    } finally {
      setResetting(false);
    }
  };

  const handleClear = () => {
    if (!window.confirm('Are you sure you want to clear all results to empty? This will only clear the form, not save to database.')) return;
    setResults({
      lunchtime: makeEmpty(7),
      teatime: makeEmpty(7),
      goslotto536: makeEmpty(6),
      goslotto749: makeEmpty(6),
      powerball: makeEmpty(6)
    });
  };

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <h2>Edit Results</h2>
        <div>Loading results...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial' }}>
      {/* component-level CSS */}
      <style>{`
        .editor-wrapper { max-width: 1100px; margin: 1.5rem auto; }
        .note { margin-bottom: 12px; padding: 12px; background:#fff3cd; border:1px solid #ffeaa7; border-radius:6px; color:#856404; }
        .section-card { margin-bottom: 22px; padding:18px; border-radius:10px; background:#fff; border:1px solid #e0e0e0; box-shadow: 0 2px 6px rgba(0,0,0,0.02); }
        .section-title { color:#2c3e50; margin-bottom:12px; text-align:center; font-size:1.05rem; }
        .balls-grid { display:flex; flex-wrap:wrap; justify-content:center; gap:12px; align-items:center; }
        .editor-ball { display:flex; flex-direction:column; align-items:center; gap:8px; }
        .lotto-ball { width:64px; height:64px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.1rem; font-weight:800; border:3px solid #9b59b6; background:#f8f9fa; color:#666; transition: all .12s ease; }
        .lotto-ball.filled { background:#e8f4fd; color:#112; border-color:#9b59b6; }
        .editor-ball input { width:64px; height:42px; padding:6px; text-align:center; border-radius:8px; border:1px solid #ddd; font-size:1rem; }
        .editor-ball input:focus { outline: none; border-color: #9b59b6; box-shadow: 0 0 0 4px rgba(155,89,182,0.06); }
        .actions { display:flex; justify-content:center; gap:8px; margin-top:12px; flex-wrap:wrap; }
        .btn { padding:10px 18px; border-radius:8px; border:none; color:white; font-weight:700; cursor:pointer; }
        .btn.save { background:#27ae60; }
        .btn.reset { background:#f39c12; }
        .btn.clear { background:#e74c3c; }
        .btn.refresh { background:#3498db; }
        @media (max-width: 700px) {
          .lotto-ball { width:56px; height:56px; font-size:1rem; }
          .editor-ball input { width:56px; height:40px; }
        }
      `}</style>

      <div className="editor-wrapper">
        <h2 style={{ textAlign: 'center', marginBottom: 12 }}>Edit Results</h2>

        <div className="note">
          💡 <strong>Reset Function:</strong><br />
          • <strong>Reset All to "00"</strong> - Resets all results to "00" and saves to database<br />
          • <strong>Clear Form</strong> - Only clears the form fields locally without saving
        </div>

        {SECTIONS.map(sec => {
          const arr = results[sec.key] || makeEmpty(sec.count);
          return (
            <div key={sec.key} className="section-card" data-type={sec.key}>
              <div className="section-title">{sec.title}</div>

              <div className="balls-grid">
                {arr.map((val, idx) => {
                  const display = (val === '' || typeof val === 'undefined') ? '00' : (String(val).padStart(2, '0'));
                  const filled = val !== '' && val !== '00';
                  return (
                    <div key={idx} className="editor-ball">
                      <div className={`lotto-ball ${filled ? 'filled' : ''}`}>{display}</div>
                      <input
                        maxLength={2}
                        value={val}
                        onChange={e => updateNumber(sec.key, idx, e.target.value)}
                        onBlur={() => handleBlurPad(sec.key, idx)}
                        onKeyDown={e => handleKeyDown(e, sec.key, idx)}
                        placeholder="00"
                        inputMode="numeric"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="actions" style={{ marginTop: 10 }}>
          <button className="btn save" onClick={handleSave} disabled={saving} style={{ opacity: saving ? 0.8 : 1 }}>
            {saving ? 'Saving...' : '💾 Save Results'}
          </button>

          <button className="btn reset" onClick={handleReset} disabled={resetting} style={{ opacity: resetting ? 0.8 : 1 }}>
            {resetting ? 'Resetting...' : '🔄 Reset All to "00"'}
          </button>

          <button className="btn clear" onClick={handleClear}>
            🗑️ Clear Form
          </button>

          <button className="btn refresh" onClick={fetchResults}>
            🔄 Refresh Data
          </button>
        </div>

        <div style={{ marginTop: 14, textAlign: 'center', color: '#7f8c8d', fontSize: 13 }}>
          <strong>Note:</strong> "Reset All to '00'" will save the reset state to database and update the public results page.
        </div>
      </div>
    </div>
  );
}
