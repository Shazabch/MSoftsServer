const express = require("express");
const nodemailer = require("nodemailer");
const router = express.Router();
const ContactInquiries = require("../Models/ContactFormModel"); // Updated model name
const dotenv = require('dotenv');
dotenv.config();

// Create the transporter using Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address
    pass: process.env.EMAIL_PASS, // App password (not your regular password)
  },
});

// Endpoint to handle contact form submissions
router.post("/", async (req, res) => {
  const { name, email, phone, message, inquiryType } = req.body;

  // Validate required fields
  if (!name || !email || !phone || !message || !inquiryType) {
    return res.status(400).json({ error: "All fields are required." });
  }

  // Mail options - Sending email to the company
  const mailOptionsToCompany = {
    from: `"${name}" <${email}>`,
    to: process.env.RECIPIENT_EMAIL, // Company's recipient email
    subject: `📬 New ${inquiryType} Inquiry from ${name}`,
    text: `
      Hi there,

      You've received a new contact form submission from:

      🌟 Name: ${name}
      📧 Email: ${email}
      📞 Phone: ${phone}
      📝 Inquiry Type: ${inquiryType}

      Message:
      ${message}

      ————
      This message was sent via your contact form.
    `,
    html: `
      <html>
        <body style="font-family: Arial, sans-serif; background-color: #f4f4f9; padding: 20px;">
          <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; padding: 35px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #5c6bc0; text-align: center; font-size: 24px; margin-bottom: 20px;">💌 New Contact Form Submission</h2>
            <p>A new submission has arrived through your website's contact form. Below are the details:</p>
            <table style="width: 100%; margin-top: 20px;">
              <tr><td><strong>Name:</strong></td><td>${name}</td></tr>
              <tr><td><strong>Email:</strong></td><td>${email}</td></tr>
              <tr><td><strong>Phone:</strong></td><td>${phone}</td></tr>
              <tr><td><strong>Inquiry Type:</strong></td><td>${inquiryType}</td></tr>
              <tr><td><strong>Message:</strong></td><td>${message}</td></tr>
            </table>
          </div>
        </body>
      </html>
    `,
  };

  // Mail options - Sending confirmation email to the user
  const mailOptionsToUser = {
    from: `"Majestic Dev Team" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your Message Has Been Received!",
    html: `
      <html>
        <body style="font-family: Arial, sans-serif; background-color: #f4f4f9; padding: 30px;">
          <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #4CAF50; text-align: center; font-size: 28px;">💌 Your Message Has Been Delivered!</h2>
            <p>Dear ${name},</p>
            <p>Thank you for reaching out to us! We have successfully received your message and will get back to you shortly.</p>
            <p style="margin-top: 20px;">Here are the details you submitted:</p>
            <ul>
              <li><strong>Name:</strong> ${name}</li>
              <li><strong>Email:</strong> ${email}</li>
              <li><strong>Phone:</strong> ${phone}</li>
              <li><strong>Inquiry Type:</strong> ${inquiryType}</li>
              <li><strong>Message:</strong> ${message}</li>
            </ul>
            <p style="margin-top: 20px;">Best regards,<br>Majestic Dev Team</p>
          </div>
        </body>
      </html>
    `,
  };

  try {
    // Send email to the company
    await transporter.sendMail(mailOptionsToCompany);

    // Send confirmation email to the user
    await transporter.sendMail(mailOptionsToUser);

    // Save the data to the database
    const newInquiry = new ContactInquiries({ name, email, phone, message, inquiryType });
    await newInquiry.save();

    res.status(200).json({ message: "Your message has been sent and saved successfully!" });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: "Failed to send message. Please try again later." });
  }
});
// Get all messages with pagination
router.get('/show', async (req, res) => {
  const { page = 1, limit = 5 } = req.query;  // Default page 1 and limit 5
  
  try {
    const messages = await ContactInquiries.find()
      .sort({ createdAt: -1 })  // Sort by `createdAt` in descending order (newest first)
      .skip((page - 1) * limit)  // Skip the appropriate number of messages
      .limit(Number(limit));    // Limit the results based on the `limit` parameter

    const totalMessages = await ContactInquiries.countDocuments();  // Total number of messages

    res.json({
      messages,
      totalPages: Math.ceil(totalMessages / limit),  // Calculate total pages
      currentPage: Number(page),
    });
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Endpoint to get the total number of contact mails
router.get('/contact-mails/count', async (req, res) => {
  try {
    const totalMessages = await ContactInquiries.countDocuments(); // Count all messages
    res.status(200).json({ count: totalMessages });
  } catch (err) {
    console.error("Error counting contact mails:", err);
    res.status(500).json({ error: 'Failed to count contact mails' });
  }
});


// Add new message
router.post('/new', async (req, res) => {
  const { name, email, message } = req.body;
  
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const newMessage = new Message({ name, email, message });
    await newMessage.save();
    res.status(201).json({ message: 'Message sent successfully!' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});
module.exports = router;
