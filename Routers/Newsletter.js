const express = require("express");
const router = express.Router();
const Subscriber = require("../Models/NewsletterModel");

// Existing POST route for subscribing
router.post("/subscribe", async (req, res) => {
  const { email } = req.body;

  // Validate email
  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "A valid email address is required." });
  }

  try {
    // Check if the email already exists
    const existingSubscriber = await Subscriber.findOne({ email });
    if (existingSubscriber) {
      return res.status(409).json({ error: "Email is already subscribed." });
    }

    // Save the new subscriber to the database
    const newSubscriber = new Subscriber({ email });
    await newSubscriber.save();

    return res.status(201).json({ message: "Successfully subscribed!" });
  } catch (error) {
    console.error("Error subscribing email:", error);
    return res.status(500).json({ error: "An error occurred. Please try again later." });
  }
});

// GET route for fetching emails with pagination
router.get("/show", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const totalSubscribers = await Subscriber.countDocuments();
    const subscribers = await Subscriber.find()
      .skip(skip)
      .limit(limit)
      .select('email subscribedAt -_id');

    res.json({
      subscribers,
      currentPage: page,
      totalPages: Math.ceil(totalSubscribers / limit),
      totalSubscribers,
    });
  } catch (error) {
    console.error("Error fetching subscribers:", error);
    res.status(500).json({ error: "An error occurred while fetching subscribers." });
  }
});



module.exports = router;

