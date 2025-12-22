// src/components/admin/AdminEditLotto.js
import React, { useEffect, useState } from 'react';
import api from '../../config/api';

const SECTIONS = [
  { key: 'lunchtime', title: '🍽️ Lunchtime Winning Numbers', isSeparate: true },
  { key: 'teatime', title: '☕ Teatime Winning Numbers', isSeparate: true },
  { key: 'goslotto536', title: '🇷🇺 Russia Goslotto 5/36 (08:00 Draw)' },
  { key: 'goslotto749', title: '🇷🇺 Russia Goslotto 7/49 (19:30 Draw)' },
  { key: 'powerball', title: '🎱 Powerball Winning Numbers' }
];

const emptyQuad = () => ['00', '00', '00', '00'];

export default function AdminEditLotto() {
  const [winningNumbers, setWinningNumbers] = useState({
    lunchtime: emptyQuad(),
    teatime: emptyQuad(),
    goslotto536: emptyQuad(),
    goslotto749: emptyQuad(),
    powerball: emptyQuad()
  });
  const [originalNumbers, setOriginalNumbers] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingSection, setSavingSection] = useState(null);
  const [moving, setMoving] = useState(false);

  useEffect(() => {
    fetchWinningNumbers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const normalizeArr = (arr) => {
    if (!Array.isArray(arr)) return emptyQuad();
    const sliced = arr.slice(0, 4);
    while (sliced.length < 4) sliced.push('00');
    return sliced.map(n => {
      if (n === '' || n === null || typeof n === 'undefined') return '00';
      const s = String(n).padStart(2, '0').slice(-2);
      return s;
    });
  };

  const fetchWinningNumbers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/winning-numbers');
      const data = res.data || {};
      const fetched = {
        lunchtime: normalizeArr(data.lunchtime),
        teatime: normalizeArr(data.teatime),
        goslotto536: normalizeArr(data.goslotto536),
        goslotto749: normalizeArr(data.goslotto749),
        powerball: normalizeArr(data.powerball)
      };
      setWinningNumbers(fetched);
      setOriginalNumbers(fetched);
    } catch (err) {
      console.error('Error fetching winning numbers:', err);
      alert('Failed to fetch winning numbers: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // update following the HomeBallsEditor editing pattern
  const updateNumber = (section, idx, rawValue) => {
    const numeric = String(rawValue).replace(/[^0-9]/g, '').slice(0, 2);
    setWinningNumbers(prev => {
      const clone = { ...prev };
      clone[section] = [...(clone[section] || emptyQuad())];
      clone[section][idx] = numeric === '' ? '' : numeric;
      return clone;
    });
  };

  const handleBlurPad = (section, idx) => {
    setWinningNumbers(prev => {
      const clone = { ...prev };
      clone[section] = [...(clone[section] || emptyQuad())];
      let val = String(clone[section][idx] ?? '').replace(/[^0-9]/g, '');
      if (!val) val = '00';
      else if (val.length === 1) val = val.padStart(2, '0');
      else val = val.slice(-2);
      clone[section][idx] = val;
      return clone;
    });
  };

  const handleKeyDown = (e, section, idx) => {
    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      setWinningNumbers(prev => {
        const clone = { ...prev };
        clone[section] = [...(clone[section] || emptyQuad())];
        clone[section][idx] = '';
        return clone;
      });
    }
  };

  const validateAllNumbers = (numbersObj) => {
    return Object.values(numbersObj).every(section =>
      Array.isArray(section) &&
      section.length === 4 &&
      section.every(n => typeof n === 'string' && n.length === 2 && !isNaN(parseInt(n)))
    );
  };

  const preparePayload = (state) => {
    const payload = {};
    Object.keys(state).forEach(section => {
      payload[section] = (state[section] || emptyQuad()).map(n => {
        if (!n || String(n).trim() === '') return '00';
        return String(n).padStart(2, '0').slice(-2);
      });
    });
    return payload;
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = preparePayload(winningNumbers);

      if (!validateAllNumbers(payload)) {
        alert('Please ensure all numbers are valid 2-digit numbers (00-99).');
        return;
      }

      await api.post('/admin/winning-numbers', payload);
      alert('Numbers saved successfully');
      setOriginalNumbers(payload);
      setWinningNumbers(payload);
    } catch (err) {
      console.error('Error saving numbers:', err);
      alert('Failed to save numbers: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSection = async (sectionKey) => {
    if (!originalNumbers) {
      return handleSave();
    }

    try {
      setSavingSection(sectionKey);
      const payload = { ...originalNumbers };
      payload[sectionKey] = (winningNumbers[sectionKey] || emptyQuad()).map(n => {
        if (!n || String(n).trim() === '') return '00';
        return String(n).padStart(2, '0').slice(-2);
      });

      await api.post('/admin/winning-numbers', payload);
      alert(`Section "${sectionKey}" updated successfully`);
      setOriginalNumbers(payload);
      setWinningNumbers(payload);
    } catch (err) {
      console.error('Error saving section:', err);
      alert('Failed to save section: ' + (err.response?.data?.message || err.message));
    } finally {
      setSavingSection(null);
    }
  };

  const handleMove = async () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultDate = prompt('Enter date for past records (YYYY-MM-DD):', today);
    if (!defaultDate) return;

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
      const response = await api.get('/admin/winning-numbers');
      const currentData = response.data || winningNumbers;

      await api.post('/admin/move-winning-numbers', {
        date: defaultDate,
        lotteryType: 'Daily Draw',
        lunchtime: currentData.lunchtime || winningNumbers.lunchtime,
        teatime: currentData.teatime || winningNumbers.teatime,
        goslotto536: currentData.goslotto536 || winningNumbers.goslotto536,
        goslotto749: currentData.goslotto749 || winningNumbers.goslotto749,
        powerball: currentData.powerball || winningNumbers.powerball
      });

      alert('Numbers moved to past records successfully');

      const reset = {
        lunchtime: emptyQuad(),
        teatime: emptyQuad(),
        goslotto536: emptyQuad(),
        goslotto749: emptyQuad(),
        powerball: emptyQuad()
      };

      await api.post('/admin/winning-numbers', reset);
      setWinningNumbers(reset);
      setOriginalNumbers(reset);
    } catch (err) {
      console.error('Error moving numbers:', err);
      alert('Failed to move numbers: ' + (err.response?.data?.message || err.message));
    } finally {
      setMoving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset all numbers to 00?')) return;
    const reset = {
      lunchtime: emptyQuad(),
      teatime: emptyQuad(),
      goslotto536: emptyQuad(),
      goslotto749: emptyQuad(),
      powerball: emptyQuad()
    };
    setWinningNumbers(reset);
    try {
      await api.post('/admin/winning-numbers', reset);
      setOriginalNumbers(reset);
      alert('All numbers have been reset to 00 and saved');
    } catch (err) {
      console.error('Error saving reset numbers:', err);
      alert('Numbers reset locally but failed to save: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <h2>Edit Lotto Numbers</h2>
        <div>Loading winning numbers...</div>
      </div>
    );
  }

  return (
    <div className="home-balls-editor" style={{ padding: 20 }}>
      {/* component-level CSS injected here */}
      <style>{`
        .home-balls-editor { max-width: 1200px; margin: 2rem auto; padding: 0 1rem; font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; }
        .home-balls-editor h2 { color: #333; margin-bottom: 1rem; font-size: 1.6rem; text-align: center; }
        section.editor-section { margin-bottom: 2rem; padding: 1.2rem; background-color: #f8f9fa; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.03); }
        section.editor-section h4 { color: #444; margin: 0 0 0.75rem 0; font-size: 1.1rem; text-align: center; }
        section.editor-section h5 { color: #666; margin: 0.8rem 0; font-size: 1rem; text-align: center; }
        .balls-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 1.2rem; justify-content: center; align-items: center; margin-bottom: 1rem; }
        .editor-ball { display: flex; flex-direction: column; align-items: center; gap: 0.6rem; }
        /* Lotto ball - blue theme with white numbers when filled */
        .lotto-ball { width: 70px; height: 70px; border-radius: 50%; display:flex; align-items:center; justify-content:center; font-size: 1.4rem; font-weight: 800; border: 3px solid #2b7fc6; box-shadow: 0 2px 6px rgba(0,0,0,0.06); transition: transform .15s ease, background-color .15s ease, color .15s ease; }
        .lotto-ball.empty { background-color: #f8f9fa; color: #999; border-color: #cfe8ff; }
        /* filled ball: solid blue background + white number */
        .lotto-ball.filled { background-color: #2b7fc6; color: #ffffff; border-color: #245f94; }
        .editor-ball input { width: 70px; padding: 0.4rem; text-align: center; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem; transition: all 0.15s ease; }
        .editor-ball input:focus { outline: none; border-color: #2b7fc6; box-shadow: 0 0 0 4px rgba(43,127,198,0.06); }
        .action-row { display:flex; justify-content:center; gap:10px; margin-top:12px; }
        .btn { color: white; border: none; padding: 10px 18px; border-radius: 6px; cursor: pointer; font-weight: 700; }
        .btn.save { background-color: #27ae60; }
        .btn.move { background-color: #3498db; }
        .btn.reset { background-color: #e74c3c; }
        .section-btn { background-color: #3498db; min-width: 140px; }
        .section-btn.disabled { background-color: #95a5a6; cursor: default; }
        @media (max-width: 768px) {
          .balls-grid { grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: 0.8rem; }
          .lotto-ball, .editor-ball input { width: 60px; height: 60px; font-size: 1.1rem; }
          .editor-ball input { width: 60px; }
        }
      `}</style>

      <h2>Edit Lotto Numbers</h2>

      <div style={{
        marginBottom: 20,
        padding: 15,
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: 5,
        color: '#856404'
      }}>
        💡 <strong>Move to Past Records:</strong><br />
        • Current numbers will be saved to past records with the selected date<br />
        • Current numbers will be reset to "00" after moving<br />
        • Past records automatically disappear after 3 days<br />
      </div>

      {SECTIONS.map(sec => {
        const arr = winningNumbers[sec.key] || emptyQuad();
        return (
          <section key={sec.key} className="editor-section" data-type={sec.key}>
            <h4>{sec.title}</h4>

            <div className="balls-grid" style={{ justifyContent: 'center' }}>
              {arr.slice(0, 3).map((n, i) => {
                const display = (n === '' || typeof n === 'undefined') ? '00' : n;
                const filled = display !== '00';
                return (
                  <div key={i} className="editor-ball">
                    <div className={`lotto-ball ${filled ? 'filled' : 'empty'}`}>{display}</div>
                    <input
                      maxLength={2}
                      value={n}
                      onChange={e => updateNumber(sec.key, i, e.target.value)}
                      onBlur={() => handleBlurPad(sec.key, i)}
                      onKeyDown={e => handleKeyDown(e, sec.key, i)}
                      placeholder="00"
                      inputMode="numeric"
                    />
                  </div>
                );
              })}

              {sec.isSeparate ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: 28, margin: '0 18px', color: '#2b7fc6' }}>+</div>
                  <div className="editor-ball">
                    <div className={`lotto-ball ${arr[3] && arr[3] !== '00' ? 'filled' : 'empty'}`}>{arr[3] || '00'}</div>
                    <input
                      maxLength={2}
                      value={arr[3]}
                      onChange={e => updateNumber(sec.key, 3, e.target.value)}
                      onBlur={() => handleBlurPad(sec.key, 3)}
                      onKeyDown={e => handleKeyDown(e, sec.key, 3)}
                      placeholder="00"
                      inputMode="numeric"
                    />
                  </div>
                </>
              ) : (
                arr[3] !== undefined && (
                  <div className="editor-ball">
                    <div className={`lotto-ball ${arr[3] && arr[3] !== '00' ? 'filled' : 'empty'}`}>{arr[3] || '00'}</div>
                    <input
                      maxLength={2}
                      value={arr[3]}
                      onChange={e => updateNumber(sec.key, 3, e.target.value)}
                      onBlur={() => handleBlurPad(sec.key, 3)}
                      onKeyDown={e => handleKeyDown(e, sec.key, 3)}
                      placeholder="00"
                      inputMode="numeric"
                    />
                  </div>
                )
              )}
            </div>

            <div className="action-row">
              <button
                onClick={() => handleSaveSection(sec.key)}
                disabled={savingSection === sec.key}
                className={`btn section-btn ${savingSection === sec.key ? 'disabled' : ''}`}
                style={{ color: 'white' }}
              >
                {savingSection === sec.key ? 'Saving...' : `Update ${sec.title.split(' ')[0]}`}
              </button>
            </div>

            <div style={{ textAlign: 'center', color: '#7f8c8d', fontSize: 13, marginTop: 8 }}>
              Click any ball and type 2 numbers (e.g., 12). Press Delete/Backspace to clear and type new ones.
            </div>
          </section>
        );
      })}

      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn save"
          style={{ marginRight: 12 }}
        >
          {saving ? 'Saving...' : '💾 Save Numbers'}
        </button>

        <button
          onClick={handleMove}
          disabled={moving}
          className="btn move"
          style={{ marginRight: 12 }}
        >
          {moving ? 'Moving...' : '📤 Move to Past Records'}
        </button>

        <button
          onClick={handleReset}
          className="btn reset"
        >
          🗑️ Reset All to 00
        </button>
      </div>
    </div>
  );
}
