const express = require("express");
const nodemailer = require("nodemailer");
const router = express.Router();
const ContactInquiries = require("../Models/ContactFormModel"); // Updated model name
const Clients = require("../Models/Clients"); // Updated model name
const bcrypt = require('bcryptjs');
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
router.patch("/update-status/:id", async (req, res) => {
  const { id } = req.params
  const { status } = req.body

  if (!["Active", "Non-active"].includes(status)) {
    return res.status(400).json({ error: "Invalid status value" })
  }

  try {
    const message = await ContactInquiries.findById(id)
    if (!message) {
      return res.status(404).json({ error: "Message not found" })
    }

    // Update message status
    message.status = status
    await message.save()

    if (status === "Active") {
      try {
        // Generate random password
        const password = Math.random().toString(36).slice(-8)
        const hashedPassword = await bcrypt.hash(password, 10)

        // Create or update client
        const client = await Clients.findOneAndUpdate(
          { email: message.email },
          {
            email: message.email,
            password: hashedPassword,
            name: message.name,
            status: status,
          },
          { upsert: true, new: true },
        )

        // Send credentials email
    // Update the image section in the email template
const mailOptions = {
  from: {
    name: "Majestic Softs Team",
    address: process.env.EMAIL_USER,
  },
  to: message.email,
  subject: "🎉 Welcome to Majestic Softs - Your Account Details",
  html: `
  <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Majestic Softs</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap');
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Poppins', Arial, sans-serif; background-color: #f4f7fa; color: #333333;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="min-width: 100%;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header with fixed logo -->
          <tr>
            <td align="center" style="padding: 0; border-radius: 8px 8px 0 0;">
              <div style="width: 250px; height: 120px; background-image: url('https://majesticsofts.com/assets/MS2-DIynU2HX.png'); background-size: contain; background-position: center; background-repeat: no-repeat;"></div>
            </td>
          </tr>
          
          <!-- Main content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h1 style="color: #6E42CD; font-size: 28px; font-weight: 600; margin: 0 0 20px; text-align: center;">Welcome to Majestic Softs! 🚀</h1>
              
              <p style="font-size: 16px; line-height: 1.5; margin: 0 0 20px;">We're thrilled to have you on board. Your account has been successfully created, and you're all set to explore our platform.</p>
              
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8f9fa; border-radius: 8px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 20px;">
                    <h2 style="color: #6E42CD; font-size: 20px; font-weight: 600; margin: 0 0 15px;">Your Account Details</h2>
                    <p style="font-size: 16px; line-height: 1.5; margin: 0;">
                      <strong>Email:</strong> ${message.email}<br>
                      <strong>Password:</strong> <span style="background-color: #e8f4fd; padding: 3px 8px; border-radius: 4px; font-family: monospace;">${password}</span><br>
                      <strong>Login URL:</strong> <a href="http://localhost:5173/clientslogin" style="color: #6E42CD; text-decoration: none;">Click here to log in</a>
                    </p>
                  </td>
                </tr>
              </table>
              
              <div style="border-left: 4px solid #ffa500; padding-left: 20px; margin-bottom: 20px;">
                <h3 style="color: #ffa500; font-size: 18px; font-weight: 600; margin: 0 0 10px;">Important Security Notice</h3>
                <p style="font-size: 14px; line-height: 1.5; margin: 0;">
                  For your security, we strongly recommend changing your password after your first login.
                </p>
              </div>
              
              <p style="font-size: 16px; line-height: 1.5; margin: 0 0 20px;">If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
              
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="http://localhost:5173/clientslogin" style="display: inline-block; background-color: #6E42CD; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 12px 30px; border-radius: 5px;">Get Started</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f4f7fa; padding: 30px; border-radius: 0 0 8px 8px;">
              <p style="font-size: 14px; color: #666666; text-align: center; margin: 0;">
                Best regards,<br>
                <strong style="color: #6E42CD;">The Majestic Softs Team</strong>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>


  `,
}
        const info = await transporter.sendMail(mailOptions)

        res.json({
          success: true,
          message: "Status updated and credentials sent successfully",
          data: message,
          credentials: {
            email: message.email,
            password: password,
          },
        })
      } catch (emailError) {
        console.error("Error sending email:", emailError)
        // Still update status but inform about email failure
        res.status(200).json({
          success: true,
          message: "Status updated but failed to send credentials email",
          data: message,
          emailError: emailError.message,
        })
      }
    } else {
      // Update client status to Non-active
      await Clients.findOneAndUpdate({ email: message.email }, { status: status })

      res.json({
        success: true,
        message: "Status updated successfully",
        data: message,
      })
    }
  } catch (error) {
    console.error("Error updating status:", error)
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      details: error.message,
    })
  }
})
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
    to: "info@majesticsofts.com", // Company's recipient email
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
router.get("/show", async (req, res) => {
  const { page = 1, limit = 15, showArchived = "false", showOnlyActive = "false" } = req.query
  const skip = (page - 1) * limit


  try {
    const query = {}
    if (showArchived === "true") {
      query.archived = true
    } else if (showOnlyActive === "true") {
      query.status = "Active"
    } else {
      query.archived = { $ne: true }
    }


    const [totalMessages, activeMessages, archivedMessages, messages, totalFilteredMessages] = await Promise.all([
      ContactInquiries.countDocuments(),
      ContactInquiries.countDocuments({ status: "Active", archived: { $ne: true } }),
      ContactInquiries.countDocuments({ archived: true }),
      ContactInquiries.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      ContactInquiries.countDocuments(query),
    ])

   

    const totalPages = Math.ceil(totalFilteredMessages / limit)

    const response = {
      messages,
      currentPage: Number(page),
      totalPages,
      totalMessages,
      activeMessages,
      archivedMessages,
    }

    console.log("Response:", JSON.stringify(response, null, 2))

    res.json(response)
  } catch (error) {
    console.error("Error fetching messages:", error)
    res.status(500).json({ error: "Internal Server Error", details: error.message })
  }
})


// New route for archiving a message
router.patch("/archive/:id", async (req, res) => {
  const { id } = req.params

  try {
    const message = await ContactInquiries.findById(id)
    if (!message) {
      return res.status(404).json({ error: "Message not found" })
    }

    message.archived = true
    await message.save()

    res.json({ success: true, message: "Message archived successfully" })
  } catch (err) {
    console.error("Error archiving message:", err)
    res.status(500).json({ error: "Failed to archive message" })
  }
})

// New route for unarchiving a message
router.patch("/unarchive/:id", async (req, res) => {
  const { id } = req.params

  try {
    const message = await ContactInquiries.findById(id)
    if (!message) {
      return res.status(404).json({ error: "Message not found" })
    }

    message.archived = false
    await message.save()

    res.json({ success: true, message: "Message unarchived successfully" })
  } catch (err) {
    console.error("Error unarchiving message:", err)
    res.status(500).json({ error: "Failed to unarchive message" })
  }
})

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


router.patch("/update-status/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["Active", "Non-active"].includes(status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  try {
    const message = await ContactInquiries.findById(id);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    message.status = status;
    await message.save();

    if (status === "Active") {
      // Generate random password
      const password = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create or update client
      await Clients.findOneAndUpdate(
        { email: message.email },
        {
          email: message.email,
          password: hashedPassword,
          name: message.name,
          status: status
        },
        { upsert: true, new: true }
      );

      // Send credentials email
      const mailOptions = {
        from: `"Majestic Dev Team" <${process.env.EMAIL_USER}>`,
        to: message.email,
        subject: "🎉 Welcome to Majestic Dev - Your Account Details",
        html: `
          <html>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f9;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 15px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); margin-top: 40px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #2c3e50; font-size: 28px; margin: 0;">Welcome to Majestic Dev! 🚀</h1>
                </div>
                
                <div style="background-color: #f8f9fa; border-radius: 10px; padding: 25px; margin: 20px 0;">
                  <h2 style="color: #3498db; font-size: 20px; margin-top: 0;">Your Account Details</h2>
                  <p style="margin: 10px 0; color: #2c3e50; line-height: 1.6;">
                    <strong>Email:</strong> ${message.email}<br>
                    <strong>Password:</strong> <span style="background-color: #e8f4fd; padding: 3px 8px; border-radius: 4px;">${password}</span>
                  </p>
                </div>

                <div style="border-left: 4px solid #3498db; padding-left: 20px; margin: 25px 0;">
                  <h3 style="color: #2c3e50; font-size: 18px; margin: 0 0 10px 0;">Important Security Notice</h3>
                  <p style="color: #666; line-height: 1.6; margin: 0;">
                    For your security, we strongly recommend changing your password after your first login.
                  </p>
                </div>

                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                  <p style="color: #666; line-height: 1.6; margin: 0;">
                    If you have any questions or need assistance, please don't hesitate to contact our support team.
                  </p>
                </div>

                <div style="text-align: center; margin-top: 30px;">
                  <p style="color: #999; font-size: 14px;">
                    Best regards,<br>
                    <strong style="color: #2c3e50;">The Majestic Dev Team</strong>
                  </p>
                </div>
              </div>
            </body>
          </html>
        `
      };

      await transporter.sendMail(mailOptions);
      res.json({ 
        message: "Status updated and credentials sent successfully", 
        data: message 
      });
    } else {
      // Update client status to Non-active
      await Clients.findOneAndUpdate(
        { email: message.email },
        { status: status }
      );
      
      res.json({ 
        message: "Status updated successfully", 
        data: message 
      });
    }
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
