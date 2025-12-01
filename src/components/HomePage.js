import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import moment from 'moment';
import api from '../config/api';
import './HomePage.css';

const HomePage = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [winningNumbers, setWinningNumbers] = useState({
    lunchtime: ['00', '00', '00', '00'],
    teatime: ['00', '00', '00', '00'],
    goslotto536: ['00', '00', '00', '00'],
    goslotto749: ['00', '00', '00', '00'],
    powerball: ['00', '00', '00', '00']
  });
  const [carouselImages, setCarouselImages] = useState([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    fetchWinningNumbers();
    fetchCarouselImages();
    
    return () => clearInterval(timer);
  }, []);

  const fetchWinningNumbers = async () => {
    try {
      const response = await api.get('/winning-numbers');
      setWinningNumbers(response.data);
    } catch (error) {
      console.error('Error fetching winning numbers:', error);
    }
  };

  const fetchCarouselImages = async () => {
    try {
      const response = await api.get('/carousel');
      setCarouselImages(response.data);
    } catch (error) {
      console.error('Error fetching carousel images:', error);
    }
  };

  const LottoBalls = ({ numbers, isSeparate = false }) => (
    <div className="lotto-balls">
      {numbers.slice(0, 3).map((num, index) => (
        <div key={index} className="lotto-ball">
          {num}
        </div>
      ))}
      {isSeparate && (
        <div className="lotto-ball separate">
          {numbers[3]}
        </div>
      )}
    </div>
  );

  const StatusText = ({ numbers }) => (
    <div className="status-text">
      {numbers.every(num => num === '00') ? 'Loading...' : 'Available Now'}
    </div>
  );

  const openWhatsApp = () => {
    window.open('https://wa.me/14059260437', '_blank');
  };

  const openWhatsAppRK = () => {
    window.open('https://wa.me/447398871333', '_blank');
  };

  // public image paths
  const headerBg = process.env.PUBLIC_URL + '/images/img2.png';
  const lottoBg = process.env.PUBLIC_URL + '/images/img1.png';
  const idCardImg = process.env.PUBLIC_URL + '/images/img3.png';

  return (
    <div className="homepage">
      {/* Header Section */}
      <header
        className="header-section"
        style={{
          backgroundImage: `url(${headerBg})`
        }}
      >
        <div className="container">
          <div className="header-content">
            <h1 className="logo">Olympic Winning Platform</h1>
            <div className="nav-buttons">
              <Link to="/login" className="nav-btn">Login</Link>
              <Link to="/register" className="nav-btn">Register</Link>
              <Link to="/tips" className="nav-btn">Tips on how to play</Link>
              <button className="nav-btn" onClick={openWhatsApp}>Contact</button>
              <Link to="/past-winning" className="nav-btn">Past Winning Numbers</Link>
              <Link to="/results" className="nav-btn">Results</Link>
              <Link to="/about" className="nav-btn">About</Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container">
        {/* Date and Time Section */}
        <section className="datetime-section">
          <h2 className="date-display">{moment(currentTime).format('dddd, MMMM Do YYYY')}</h2>
          <h3 className="time-display">{moment(currentTime).format('h:mm:ss A')}</h3>
        </section>

        {/* Lunchtime Winning Numbers */}
        <section
          className="lotto-section lunchtime-section"
          style={{ backgroundImage: `url(${lottoBg})` }}
        >
          <h2 className="section-title">Lunchtime Winning Numbers</h2>
          <LottoBalls numbers={winningNumbers.lunchtime} isSeparate={true} />
          <StatusText numbers={winningNumbers.lunchtime} />
        </section>

        {/* Teatime Winning Numbers */}
        <section
          className="lotto-section teatime-section"
          style={{ backgroundImage: `url(${lottoBg})` }}
        >
          <h2 className="section-title">Teatime Winning Numbers</h2>
          <LottoBalls numbers={winningNumbers.teatime} isSeparate={true} />
          <StatusText numbers={winningNumbers.teatime} />
        </section>

        {/* Get Started Button */}
        <section className="cta-section">
          <Link to="/login" className="cta-button main-cta">
            Get Started to Receiving Winning Numbers
          </Link>
        </section>

        {/* Russia Goslotto Sections */}
        <section
          className="lotto-section goslotto-section"
          style={{ backgroundImage: `url(${lottoBg})` }}
        >
          <h2 className="section-title">RUSSIA GOSLOTTO 5/36 WINNING NUMBER</h2>
          <p className="draw-time">For 08:00 Draw</p>
          <LottoBalls numbers={winningNumbers.goslotto536} />
          <StatusText numbers={winningNumbers.goslotto536} />
        </section>

        <section
          className="lotto-section goslotto-section"
          style={{ backgroundImage: `url(${lottoBg})` }}
        >
          <h2 className="section-title">RUSSIA GOSLOTTO 7/49 WINNING NUMBER</h2>
          <p className="draw-time">For 19:30 Draw</p>
          <LottoBalls numbers={winningNumbers.goslotto749} />
          <StatusText numbers={winningNumbers.goslotto749} />
        </section>

        {/* Powerball Section */}
        <section
          className="lotto-section powerball-section"
          style={{ backgroundImage: `url(${lottoBg})` }}
        >
          <h2 className="section-title">Powerball Winning Numbers</h2>
          <LottoBalls numbers={winningNumbers.powerball} />
          <StatusText numbers={winningNumbers.powerball} />
        </section>

        {/* Results Section */}
        <section className="results-section">
          <h2 className="results-title">Check Complete Results</h2>
          <p className="results-description">
            Today's Results for Lunchtime and Teatime
          </p>
          <Link to="/results" className="cta-button results-button">
            View All Results
          </Link>
        </section>

        {/* Contact and Help Sections */}
        <section className="contact-section">
          <button className="cta-button whatsapp-button" onClick={openWhatsApp}>
            Contact Us on WhatsApp
          </button>
        </section>

        <section className="help-section">
          <h3>For any help or questions?</h3>
          <p className="help-contact">
            <strong>WhatsApp Message R.K Colin:</strong> 
            <span className="whatsapp-link" onClick={openWhatsAppRK}> +44 7398871333</span>
          </p>
          <p className="email-contact">
            <strong>GMAIL CONTACT:</strong> olympicwinningplatform@gmail.com
          </p>
        </section>

        {/* Carousel Section */}
        <section className="carousel-section">
  <div className="carousel">
    {carouselImages.length > 0 ? (
      carouselImages.map((image, index) => (
        <div key={image._id} className="carousel-item">
          <img 
            src={image.imageUrl} 
            alt={`Platform carousel ${index + 1}`} 
            className="carousel-image"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/800x400?text=Image+Not+Available';
            }}
          />
        </div>
      ))
    ) : (
      <div className="carousel-placeholder">
        <p>No carousel images available</p>
      </div>
    )}
  </div>
</section>

        {/* Platform ID Card Section */}
        <section className="id-card-section">
          <img 
            src={idCardImg} 
            alt="Platform ID Card" 
            className="id-card-image"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <div className="id-card-content">
            <p className="id-card-description">
              This is the Platform Membership ID Card for you to be added to the Platform Group. 
              Noted, the Platform Membership ID Card works for the Platform Group Only. 
              So, if you want to receive the accurate booming Numbers Via your Email or directly 
              to your Whatsapp number you don't have to get the Platform Membership ID Card. 
              Kindly Whatsapp the agent now +1 405 926 0437 to get full information on how to 
              apply for the Platform Membership ID to get added to the Platform Group.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HomePage;