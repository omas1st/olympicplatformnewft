import React, { useState, useEffect, useCallback } from 'react';
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
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prevSlide) => 
      prevSlide === carouselImages.length - 1 ? 0 : prevSlide + 1
    );
  }, [carouselImages.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prevSlide) => 
      prevSlide === 0 ? carouselImages.length - 1 : prevSlide - 1
    );
  }, [carouselImages.length]);

  const goToSlide = useCallback((index) => {
    setCurrentSlide(index);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    fetchWinningNumbers();
    fetchCarouselImages();
    
    return () => clearInterval(timer);
  }, []);

  // Auto-advance carousel every 5 seconds
  useEffect(() => {
    if (carouselImages.length > 1) {
      const interval = setInterval(() => {
        nextSlide();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [carouselImages.length, nextSlide]);

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
      setCurrentSlide(0); // Reset to first slide when new images load
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
  const facebookGroupImg = process.env.PUBLIC_URL + '/images/img5.png';
  const whatsappGroupImg = process.env.PUBLIC_URL + '/images/img6.png';

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
          
        </section>

        {/* Carousel Section */}
        <section className="carousel-section">
          <h2 className="carousel-title">Platform Highlights</h2>
          <div className="carousel-container">
            <div className="carousel">
              {carouselImages.length > 0 ? (
                <>
                  <div 
                    className="carousel-track"
                    style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                  >
                    {carouselImages.map((image, index) => (
                      <div key={image._id} className="carousel-slide">
                        <img 
                          src={image.imageUrl} 
                          alt={`Platform highlight ${index + 1}`} 
                          className="carousel-image"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/800x400?text=Image+Not+Available';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  
                  {/* Navigation buttons */}
                  {carouselImages.length > 1 && (
                    <>
                      <button 
                        className="carousel-btn carousel-btn-prev" 
                        onClick={prevSlide}
                        aria-label="Previous slide"
                      >
                        &#10094;
                      </button>
                      <button 
                        className="carousel-btn carousel-btn-next" 
                        onClick={nextSlide}
                        aria-label="Next slide"
                      >
                        &#10095;
                      </button>
                    </>
                  )}
                  
                  {/* Dots indicator */}
                  {carouselImages.length > 1 && (
                    <div className="carousel-dots">
                      {carouselImages.map((_, index) => (
                        <button
                          key={index}
                          className={`carousel-dot ${index === currentSlide ? 'active' : ''}`}
                          onClick={() => goToSlide(index)}
                          aria-label={`Go to slide ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="carousel-placeholder">
                  <p>No carousel images available</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Platform ID Card Section */}
        <section className="id-card-section">
          <img 
            src={idCardImg} 
            alt="Platform ID" 
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

        {/* Facebook Group Section */}
        <section className="id-card-section">
          <img 
            src={facebookGroupImg} 
            alt="Platform Facebook Group" 
            className="id-card-image"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <div className="id-card-content">
            <p className="id-card-description">
              This is the platform facebook group profile picture. do well to join the platform facebook group to see and know about the platform updates.
            </p>
          </div>
        </section>

        {/* WhatsApp Group Section */}
        <section className="id-card-section">
          <img 
            src={whatsappGroupImg} 
            alt="Platform WhatsApp Booming Group" 
            className="id-card-image"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <div className="id-card-content">
            <p className="id-card-description">
              This is the platform whatsapp booming group profile. kindly chat up the agent now +14059260437 to get full information on how to get added to the platform group.
            </p>
          </div>
        </section>

        {/* Draw Schedule Section */}
        <section className="draw-schedule-section">
          <h2 className="section-title">Draw Schedule</h2>
          <div className="draw-schedule-content">
            <div className="draw-schedule-column">
              <h3>UK 49's LUNCHTIME DRAW</h3>
              <p>Closing : 14:30pm</p>
              <p>Draw: 15:00pm</p>
              
              <h3>UK 49's TEATIME DRAW</h3>
              <p>Closing: 19:30pm</p>
              <p>Draw: 20:00pm</p>
              
              <h3>SA POWERBALL DRAW</h3>
              <p>Every Tuesday</p>
              <p>closing: 20:58pm</p>
              <p>Every Friday</p>
              <p>closing: 20:58pm</p>
            </div>
            
            <div className="draw-schedule-column">
              <h3>GOSLOTTO 4/20 DAILY</h3>
              <p>@10:00 Draw</p>
              <p>@22:00 Draw</p>
              
              <h3>GOSLOTTO 5/36 DAILY</h3>
              <p>@12:00 Draw</p>
              <p>@15:00 Draw</p>
              <p>@18:00 Draw</p>
              <p>@21:00 Draw</p>
              <p>@23:59 Draw</p>
              
              <h3>GOSLOTTO 6/45 DAILY</h3>
              <p>@11:00 Draw</p>
              <p>@23:00 Draw</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HomePage;