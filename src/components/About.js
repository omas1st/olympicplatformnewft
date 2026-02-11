import React from 'react';
import './About.css';

const About = () => {
  const openWhatsApp = () => {
    window.open('https://wa.me/12297539618', '_blank');
  };

  return (
    <div className="container">
      <div style={{ padding: '40px 20px', textAlign: 'center', lineHeight: '1.6' }}>
        <h1 style={{ marginBottom: '20px' }}>WELCOME TO:</h1>
        <h2 style={{ marginBottom: '30px', color: '#2c3e50' }}>OLYMPIC WINNING PLATFORM</h2>

        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'left' }}>
          <p style={{ marginBottom: '20px' }}>
            OLYMPIC WINNING PLATFORM IS A PLATFORM THAT PROVIDES YOU WITH BOOMING NUMBERS FOR 
            UK49S LOTTO, POWERBALL AND RUSSIA GOS LOTTO (5/36,6/45,7/49,4/20).
          </p>

          <p style={{ marginBottom: '20px' }}>
            WINNING IS 100% SURE AND GUARANTEED ON OUR PLATFORM.
          </p>

          <p style={{ marginBottom: '20px' }}>
            OUR PLATFORM GOAL IS TO HELP PEOPLE BUILD WEALTH AND TO CHANGE OUR MEMBERS FINANCIAL STATUS.
          </p>

          <p style={{ marginBottom: '30px' }}>
            OLYMPIC WINNING PLATFORM IS A PLATFORM THAT PROVIDES PEOPLE BOOMING NUMBER FOR UK49'S 
            LOTTERY LOTTO, SA POWERBALL AND RUSSIAN GOSLOTTO (5/36 8:00Draw, 7/49 22:30Draw).
          </p>

          <p style={{ marginBottom: '30px' }}>
            GMAIL CONTACT: olympicwinningplatform@gmail.com
          </p>

          <button className="cta-button" onClick={openWhatsApp}>
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
};

export default About;
