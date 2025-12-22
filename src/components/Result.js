// src/pages/Result.js (or wherever your Result component is)
import React, { useState, useEffect } from 'react';
import api from '../config/api';

const Result = () => {
  const [results, setResults] = useState({
    lunchtime: ['00', '00', '00', '00', '00', '00', '00'],
    teatime: ['00', '00', '00', '00', '00', '00', '00'],
    goslotto536: ['00', '00', '00', '00', '00', '00'],
    goslotto749: ['00', '00', '00', '00', '00', '00'],
    powerball: ['00', '00', '00', '00', '00', '00']
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // IMPORTANT FIX: Change from '/public/results' to '/results'
      // Because in server.js, public routes are mounted at '/api', 
      // so '/api/results' is the correct endpoint
      const response = await api.get('/results');
      const data = response.data;
      
      console.log('Fetched results:', data); // Debug log
      
      // Ensure we have the correct number of values for each section
      setResults({
        lunchtime: data.lunchtime?.slice(0, 7) || ['00', '00', '00', '00', '00', '00', '00'],
        teatime: data.teatime?.slice(0, 7) || ['00', '00', '00', '00', '00', '00', '00'],
        goslotto536: data.goslotto536?.slice(0, 6) || ['00', '00', '00', '00', '00', '00'],
        goslotto749: data.goslotto749?.slice(0, 6) || ['00', '00', '00', '00', '00', '00'],
        powerball: data.powerball?.slice(0, 6) || ['00', '00', '00', '00', '00', '00']
      });
    } catch (error) {
      console.error('Error fetching results:', error);
      setError('Failed to load results. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const LottoBalls = ({ numbers, isPowerball = false, isLunchOrTea = false }) => (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      flexWrap: 'wrap', 
      gap: '15px',
      margin: '20px 0'
    }}>
      {numbers.map((num, index) => {
        // Determine background color
        let backgroundColor = '#3498db'; // Default blue
        
        if (isPowerball && index === numbers.length - 1) {
          backgroundColor = '#e74c3c'; // Red for last powerball
        } else if (isLunchOrTea && index === numbers.length - 1) {
          backgroundColor = '#e74c3c'; // Red for last lunch/tea ball (7th ball)
        }
        
        return (
          <div 
            key={index} 
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: backgroundColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
          >
            {num}
          </div>
        );
      })}
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
        <h1 style={{ marginBottom: '30px' }}>Latest Results</h1>
        <div style={{ fontSize: '1.2rem', color: '#7f8c8d' }}>
          Loading results...
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
        <h1 style={{ marginBottom: '30px' }}>Latest Results</h1>
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
          onClick={fetchResults}
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
        🎯 Latest Results
      </h1>

      <div style={{ 
        marginBottom: '40px', 
        padding: '25px',
        backgroundColor: 'white',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ 
          color: '#2c3e50', 
          marginBottom: '20px',
          textAlign: 'center',
          borderBottom: '2px solid #ecf0f1',
          paddingBottom: '10px'
        }}>
          🍽️ Lunchtime Results
        </h2>
        <LottoBalls numbers={results.lunchtime} isLunchOrTea={true} />
      </div>
      
      <div style={{ 
        marginBottom: '40px', 
        padding: '25px',
        backgroundColor: 'white',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ 
          color: '#2c3e50', 
          marginBottom: '20px',
          textAlign: 'center',
          borderBottom: '2px solid #ecf0f1',
          paddingBottom: '10px'
        }}>
          ☕ Teatime Results
        </h2>
        <LottoBalls numbers={results.teatime} isLunchOrTea={true} />
      </div>
      
      <div style={{ 
        marginBottom: '40px', 
        padding: '25px',
        backgroundColor: 'white',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ 
          color: '#2c3e50', 
          marginBottom: '20px',
          textAlign: 'center',
          borderBottom: '2px solid #ecf0f1',
          paddingBottom: '10px'
        }}>
          🇷🇺 07:45 Goslotto 5/36 Draw Results
        </h2>
        <LottoBalls numbers={results.goslotto536} />
      </div>
      
      <div style={{ 
        marginBottom: '40px', 
        padding: '25px',
        backgroundColor: 'white',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ 
          color: '#2c3e50', 
          marginBottom: '20px',
          textAlign: 'center',
          borderBottom: '2px solid #ecf0f1',
          paddingBottom: '10px'
        }}>
          🇷🇺 07:45 Goslotto 7/49 Draw Results
        </h2>
        <LottoBalls numbers={results.goslotto749} />
      </div>
      
      <div style={{ 
        marginBottom: '40px', 
        padding: '25px',
        backgroundColor: 'white',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ 
          color: '#2c3e50', 
          marginBottom: '20px',
          textAlign: 'center',
          borderBottom: '2px solid #ecf0f1',
          paddingBottom: '10px'
        }}>
          🎱 Powerball Draw Results
        </h2>
        <LottoBalls numbers={results.powerball} isPowerball={true} />
      </div>

      <div style={{ 
        textAlign: 'center', 
        marginTop: '40px',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '10px',
        color: '#7f8c8d'
      }}>
        <p>Results are updated daily. Last updated: {new Date().toLocaleDateString()}</p>
        <button 
          onClick={fetchResults}
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
          Refresh Results
        </button>
      </div>
    </div>
  );
};

export default Result;