// src/pages/PastWinning.js (or wherever your PastWinning component is)
import React, { useState, useEffect } from 'react';
import api from '../config/api'; // Import your api configuration
import moment from 'moment';

const PastWinning = () => {
  const [pastNumbers, setPastNumbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPastNumbers();
  }, []);

  const fetchPastNumbers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // IMPORTANT: Change from '/api/past-winning' to '/past-winning'
      // Because your api instance likely has base URL of '/api'
      const response = await api.get('/past-winning');
      const data = response.data;
      
      console.log('Fetched past winning numbers:', data); // Debug log
      
      setPastNumbers(data || []);
    } catch (error) {
      console.error('Error fetching past winning numbers:', error);
      setError('Failed to load past winning numbers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const LottoBalls = ({ numbers, isSeparate = false }) => (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      flexWrap: 'wrap', 
      gap: '15px',
      margin: '20px 0'
    }}>
      {numbers && numbers.slice(0, 3).map((num, index) => (
        <div 
          key={index} 
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#3498db',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
        >
          {num || '00'}
        </div>
      ))}
      {isSeparate && numbers && numbers[3] && (
        <>
          <div style={{ 
            margin: '0 15px',
            display: 'flex',
            alignItems: 'center',
            fontSize: '1.5rem',
            color: '#e74c3c',
            fontWeight: 'bold'
          }}>
            +
          </div>
          <div 
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: '#e74c3c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
          >
            {numbers[3] || '00'}
          </div>
        </>
      )}
    </div>
  );

  if (loading) {
    return (
      <div style={{ 
        padding: '40px 20px', 
        textAlign: 'center',
        minHeight: '50vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <h1 style={{ marginBottom: '30px' }}>Past Winning Numbers</h1>
        <div style={{ fontSize: '1.2rem', color: '#7f8c8d' }}>
          Loading past winning numbers...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '40px 20px', 
        textAlign: 'center',
        minHeight: '50vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <h1 style={{ marginBottom: '30px' }}>Past Winning Numbers</h1>
        <div style={{ 
          fontSize: '1.2rem', 
          color: '#e74c3c',
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '10px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
        <button 
          onClick={fetchPastNumbers}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '40px 20px',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <h1 style={{ 
        textAlign: 'center', 
        marginBottom: '40px',
        color: '#2c3e50',
        fontSize: '2.5rem'
      }}>
        📅 Past Winning Numbers
      </h1>

      <div style={{ 
        marginBottom: '20px', 
        padding: '15px',
        backgroundColor: '#d4edda',
        border: '1px solid #c3e6cb',
        borderRadius: '5px',
        color: '#155724',
        textAlign: 'center'
      }}>
        <strong>Note:</strong> Past records are automatically deleted after 3 days. Only the last 3 days of winning numbers are shown.
      </div>

      {pastNumbers.length === 0 ? (
        <div style={{ 
          padding: '40px 20px', 
          textAlign: 'center',
          backgroundColor: '#f8f9fa',
          borderRadius: '10px',
          marginTop: '20px'
        }}>
          <h3 style={{ color: '#7f8c8d', marginBottom: '15px' }}>
            No past winning numbers available.
          </h3>
          <p style={{ color: '#95a5a6' }}>
            Past winning numbers will appear here after they are moved from the current winning numbers.
            Records are automatically removed after 3 days.
          </p>
        </div>
      ) : (
        pastNumbers.map((item, index) => (
          <div 
            key={index} 
            style={{ 
              marginBottom: '30px', 
              padding: '25px',
              backgroundColor: 'white',
              borderRadius: '10px',
              boxShadow: '0 2px 15px rgba(0,0,0,0.1)',
              border: '1px solid #e9ecef'
            }}
          >
            <h3 style={{ 
              textAlign: 'center', 
              marginBottom: '25px',
              color: '#2c3e50',
              borderBottom: '2px solid #3498db',
              paddingBottom: '10px'
            }}>
              {item.lotteryType || 'Daily Draw'} - {moment(item.date).format('MMMM Do, YYYY')}
            </h3>
            
            {item.lunchtime && item.lunchtime.length > 0 && (
              <div style={{ marginBottom: '25px' }}>
                <h4 style={{ 
                  color: '#2c3e50', 
                  marginBottom: '15px',
                  textAlign: 'center'
                }}>
                  🍽️ Lunchtime
                </h4>
                <LottoBalls numbers={item.lunchtime} isSeparate={true} />
              </div>
            )}

            {item.teatime && item.teatime.length > 0 && (
              <div style={{ marginBottom: '25px' }}>
                <h4 style={{ 
                  color: '#2c3e50', 
                  marginBottom: '15px',
                  textAlign: 'center'
                }}>
                  ☕ Teatime
                </h4>
                <LottoBalls numbers={item.teatime} isSeparate={true} />
              </div>
            )}

            {item.goslotto536 && item.goslotto536.length > 0 && (
              <div style={{ marginBottom: '25px' }}>
                <h4 style={{ 
                  color: '#2c3e50', 
                  marginBottom: '15px',
                  textAlign: 'center'
                }}>
                  🇷🇺 Russia Goslotto 5/36
                </h4>
                <LottoBalls numbers={item.goslotto536} />
              </div>
            )}

            {item.goslotto749 && item.goslotto749.length > 0 && (
              <div style={{ marginBottom: '25px' }}>
                <h4 style={{ 
                  color: '#2c3e50', 
                  marginBottom: '15px',
                  textAlign: 'center'
                }}>
                  🇷🇺 Russia Goslotto 7/49
                </h4>
                <LottoBalls numbers={item.goslotto749} />
              </div>
            )}

            {item.powerball && item.powerball.length > 0 && (
              <div style={{ marginBottom: '25px' }}>
                <h4 style={{ 
                  color: '#2c3e50', 
                  marginBottom: '15px',
                  textAlign: 'center'
                }}>
                  🎱 Powerball
                </h4>
                <LottoBalls numbers={item.powerball} />
              </div>
            )}

            <div style={{ 
              textAlign: 'center', 
              marginTop: '20px',
              paddingTop: '15px',
              borderTop: '1px dashed #dee2e6',
              color: '#6c757d',
              fontSize: '0.9rem'
            }}>
              Record created: {moment(item.createdAt).format('MMMM Do, YYYY h:mm A')}
            </div>
          </div>
        ))
      )}

      <div style={{ 
        textAlign: 'center', 
        marginTop: '40px',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '10px',
        color: '#7f8c8d'
      }}>
        <button 
          onClick={fetchPastNumbers}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          Refresh Past Numbers
        </button>
      </div>
    </div>
  );
};

export default PastWinning;