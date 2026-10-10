// src/analytics.js
import ReactGA from 'react-ga4';

const MEASUREMENT_ID = process.env.REACT_APP_GA_ID;

if (!MEASUREMENT_ID) {
  console.warn(
    '[Analytics] REACT_APP_GA_ID is missing. Add it to your .env file and restart the dev server.'
  );
} else {
  ReactGA.initialize(MEASUREMENT_ID);
}

/**
 * Fires a pageview when the route changes. Call inside a component using useLocation().
 */
export const trackPageView = (path) => {
  if (!MEASUREMENT_ID) return;
  ReactGA.send({
    hitType: 'pageview',
    page: path,
  });
};

/**
 * Fire a custom event from anywhere in the app.
 * Example: trackEvent('User', 'Clicked Upgrade', 'VIP Upgrade Flow')
 */
export const trackEvent = (category, action, label) => {
  if (!MEASUREMENT_ID) return;
  ReactGA.event({
    category,
    action,
    label,
  });
};

export default ReactGA;