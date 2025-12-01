import React from 'react';

const VIPMembership = () => {
  const redirectToLogin = () => {
    window.location.href = 'https://olympicuk49.vercel.app/login';
  };

  return (
    <div className="container">
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '20px' }}>VIP Membership</h1>
        
        <div style={{ 
          maxWidth: '600px', 
          margin: '0 auto', 
          backgroundColor: 'white', 
          padding: '40px',
          borderRadius: '10px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ marginBottom: '20px', color: '#2c3e50' }}>
            Complete Your Registration
          </h2>
          
          <p style={{ marginBottom: '30px', fontSize: '1.1rem', lineHeight: '1.6' }}>
            Thank you for your payment! To complete your VIP membership registration 
            and start receiving winning numbers, please login to the VIP portal using 
            the button below.
          </p>

          <button 
            className="cta-button"
            onClick={redirectToLogin}
            style={{ fontSize: '1.2rem', padding: '15px 30px' }}
          >
            Login to VIP Page
          </button>

          <p style={{ marginTop: '20px', color: '#7f8c8d' }}>
            If you encounter any issues, please contact our support team on WhatsApp.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VIPMembership;