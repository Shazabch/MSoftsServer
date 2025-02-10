const express = require("express");
const passport = require("passport");
const LinkedInStrategy = require("passport-linkedin-oauth2").Strategy;
const dotenv = require("dotenv");
const session = require("express-session");

dotenv.config(); // Ensure environment variables are loaded

const router = express.Router();

// Initialize session middleware
router.use(session({
  secret: 'your-session-secret', // Use a strong secret in production
  resave: false,
  saveUninitialized: true,
}));

// LinkedIn OAuth 2.0 Setup
passport.use(
  new LinkedInStrategy(
    {
      clientID: process.env.LINKEDIN_CLIENT_ID, // Load from env
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET, // Load from env
      callbackURL: process.env.LINKEDIN_CALLBACK_URL, // Load from env
      scope: ['openid', 'r_liteprofile', 'r_emailaddress'],
      state: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails ? profile.emails[0]?.value : "N/A"; // Safe fallback for email
        const userData = {
          linkedinId: profile.id,
          firstName: profile.name?.givenName || "N/A",
          lastName: profile.name?.familyName || "N/A",
          email: email,
          accessToken,
        };
        return done(null, userData);
      } catch (error) {
        console.error("Error during authentication:", error);
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// LinkedIn Authentication Route
router.get("/linkedin", (req, res) => {
  const clientID = process.env.LINKEDIN_CLIENT_ID;
  const redirectURI = encodeURIComponent(process.env.LINKEDIN_CALLBACK_URL);

  // Generate a state for security
  const state = Math.random().toString(36).substring(2);
  req.session.state = state;  // Store state in session

  const linkedinAuthURL = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientID}&redirect_uri=${redirectURI}&scope=r_liteprofile%20r_emailaddress&state=${state}`;

  console.log("🔹 Redirecting to LinkedIn:", linkedinAuthURL);
  res.redirect(linkedinAuthURL);
});

// LinkedIn Callback Route
router.get('/api/linkedin/callback', (req, res, next) => {
  // Check if the state matches
  if (req.query.state !== req.session.state) {
    return res.status(400).send('State mismatch. Potential CSRF attack.');
  }

  passport.authenticate('linkedin', {
    failureRedirect: '/login',
    session: true,
  })(req, res, next);
}, (req, res) => {
  res.redirect('http://localhost:5173/'); // Redirect to the frontend after successful login
});

// Endpoint for accessing user profile (example)
router.get("/profile", (req, res) => {
  if (!req.user) return res.status(401).send("You are not logged in!");
  res.json(req.user);
});

module.exports = router;
