const express = require("express");
const router = express.Router();
const Inquiry = require("../Models/CostInquiryModel"); // Use the correct model name
const nodemailer = require("nodemailer");
const Feature = require("../Models/FeaturesModel"); // Import the Features model
// Route to get the count of cost inquiries
router.get("/cost-inquiries/count", async (req, res) => {
  try {
    const count = await Inquiry.countDocuments();
    res.status(200).json({ count });
  } catch (error) {
    console.error("Error fetching cost inquiry count:", error);
    res.status(500).json({ error: "Failed to fetch cost inquiry count" });
  }
});

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Route to save inquiry and features
// Route to save inquiry and features
router.post("/saveinquiry", async (req, res) => {
  try {
    const { selectedservice, selectedfeatures, deliveryoption, totalcost, email, startDate, details } = req.body;

    // Save the inquiry
    const newInquiry = new Inquiry({
      selectedservice,
      deliveryoption,
      totalcost,
      email,
      startDate,
      details,
    });
    const savedInquiry = await newInquiry.save();

    // Save the entire array of features as a single document
    const newFeature = new Feature({
      inquiryId: savedInquiry._id,
      features: selectedfeatures,  // Store the whole array
    });

    await newFeature.save();

    // Mail options - Sending email to the company
const mailOptionsToCompany = {
  from: `"Majestic Dev Team" <${process.env.EMAIL_USER}>`,
  to: process.env.RECIPIENT_EMAIL, // Company's recipient email
  subject: `📬 New Cost Inquiry from ${email}`,
  text: `
    Hi there,

    You've received a new cost inquiry from:

    🌟 Service: ${selectedservice}
    📧 Email: ${email}
    📝 Selected Features: ${selectedfeatures.join(", ")}
    💰 Total Cost: ${totalcost}
    📅 Start Date: ${startDate}
    📦 Delivery Option: ${deliveryoption}

    Details:
    ${details}

    ————
    This message was sent via your cost inquiry form.
  `,
  html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Cost Inquiry</title>
    </head>
    <body style="font-family: 'Arial', sans-serif; background-color: #f6f9fc; margin: 0; padding: 0;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="min-width: 100%; background-color: #f6f9fc;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <tr>
                <td style="padding: 40px;">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td align="center" style="padding-bottom: 30px;">
                        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="#4CAF50" stroke-width="2"/>
                          <path d="M16 10L11 15L8 12" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding-bottom: 30px;">
                        <h1 style="color: #333333; font-size: 24px; margin: 0;">New Cost Inquiry Received</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-bottom: 20px;">
                        <p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 0;">A new submission has arrived through your cost inquiry form. Here are the details:</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="background-color: #f9f9f9; border-radius: 8px; padding: 20px;">
                        <table cellpadding="0" cellspacing="0" border="0" width="100%">
                          <tr>
                            <td width="150" style="padding: 10px 0; color: #333333; font-weight: bold;">Service:</td>
                            <td style="padding: 10px 0; color: #666666;">${selectedservice}</td>
                          </tr>
                          <tr>
                            <td width="150" style="padding: 10px 0; color: #333333; font-weight: bold;">Email:</td>
                            <td style="padding: 10px 0; color: #666666;">${email}</td>
                          </tr>
                          <tr>
                            <td width="150" style="padding: 10px 0; color: #333333; font-weight: bold;">Selected Features:</td>
                            <td style="padding: 10px 0; color: #666666;">${selectedfeatures.join(", ")}</td>
                          </tr>
                          <tr>
                            <td width="150" style="padding: 10px 0; color: #333333; font-weight: bold;">Total Cost:</td>
                            <td style="padding: 10px 0; color: #666666;">${totalcost}</td>
                          </tr>
                          <tr>
                            <td width="150" style="padding: 10px 0; color: #333333; font-weight: bold;">Start Date:</td>
                            <td style="padding: 10px 0; color: #666666;">${startDate}</td>
                          </tr>
                          <tr>
                            <td width="150" style="padding: 10px 0; color: #333333; font-weight: bold;">Delivery Option:</td>
                            <td style="padding: 10px 0; color: #666666;">${deliveryoption}</td>
                          </tr>
                          <tr>
                            <td width="150" style="padding: 10px 0; color: #333333; font-weight: bold;">Details:</td>
                            <td style="padding: 10px 0; color: #666666;">${details}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `,
};

// Mail options - Sending confirmation email to the user
const mailOptionsToUser = {
  from: `"Majestic Dev Team" <${process.env.EMAIL_USER}>`,
  to: email,
  subject: "Your Cost Inquiry Has Been Received!",
  html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Cost Inquiry Confirmation</title>
    </head>
    <body style="font-family: 'Arial', sans-serif; background-color: #f6f9fc; margin: 0; padding: 0;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="min-width: 100%; background-color: #f6f9fc;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <tr>
                <td style="padding: 40px;">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td align="center" style="padding-bottom: 30px;">
                        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="#4CAF50" stroke-width="2"/>
                          <path d="M16 10L11 15L8 12" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding-bottom: 30px;">
                        <h1 style="color: #333333; font-size: 24px; margin: 0;">Your Cost Inquiry Has Been Received!</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-bottom: 20px;">
                        <p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 0;">Dear ${email},</p>
                        <p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 10px 0 0;">Thank you for reaching out to us! We have successfully received your cost inquiry and will get back to you shortly.</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="background-color: #f9f9f9; border-radius: 8px; padding: 20px;">
                        <table cellpadding="0" cellspacing="0" border="0" width="100%">
                          <tr>
                            <td colspan="2" style="padding-bottom: 15px;">
                              <p style="color: #333333; font-size: 18px; font-weight: bold; margin: 0;">Here are the details you submitted:</p>
                            </td>
                          </tr>
                          <tr>
                            <td width="150" style="padding: 10px 0; color: #333333; font-weight: bold;">Service:</td>
                            <td style="padding: 10px 0; color: #666666;">${selectedservice}</td>
                          </tr>
                          <tr>
                            <td width="150" style="padding: 10px 0; color: #333333; font-weight: bold;">Email:</td>
                            <td style="padding: 10px 0; color: #666666;">${email}</td>
                          </tr>
                          <tr>
                            <td width="150" style="padding: 10px 0; color: #333333; font-weight: bold;">Selected Features:</td>
                            <td style="padding: 10px 0; color: #666666;">${selectedfeatures.join(", ")}</td>
                          </tr>
                          
                          <tr>
                            <td width="150" style="padding: 10px 0; color: #333333; font-weight: bold;">Start Date:</td>
                            <td style="padding: 10px 0; color: #666666;">${startDate}</td>
                          </tr>
                          <tr>
                            <td width="150" style="padding: 10px 0; color: #333333; font-weight: bold;">Delivery Option:</td>
                            <td style="padding: 10px 0; color: #666666;">${deliveryoption}</td>
                          </tr>
                          <tr>
                            <td width="150" style="padding: 10px 0; color: #333333; font-weight: bold;">Details:</td>
                            <td style="padding: 10px 0; color: #666666;">${details}</td>
                          </tr>
                          <tr>
                            <td width="150" style="padding: 10px 0; color: #333333; font-weight: bold;">Total Cost:</td>
                            <td style="padding: 10px 0; color: #666666;">${totalcost}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-top: 30px;">
                        <p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 0;">Best regards,</p>
                        <p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 5px 0 0; font-weight: bold;">Majestic Dev Team</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `,
};



    // Send emails
    await transporter.sendMail(mailOptionsToCompany);
    await transporter.sendMail(mailOptionsToUser);

    res.status(201).json({ message: "Inquiry saved successfully and emails sent", inquiry: savedInquiry });
  } catch (error) {
    console.error("Error saving inquiry:", error);
    res.status(500).json({ message: "Failed to save inquiry and send emails", error });
  }
});

// Route to fetch inquiries with features
router.get("/showinquiry", async (req, res) => {
  try {
    // Fetch all inquiries
    const inquiries = await Inquiry.find();

    // Fetch and attach features for each inquiry
    const inquiriesWithFeatures = await Promise.all(
      inquiries.map(async (inquiry) => {
        // Find features linked to the inquiry
        const featureDoc = await Feature.findOne({ inquiryId: inquiry._id });

        // Return inquiry with attached features
        return {
          ...inquiry.toObject(),
          selectedfeatures: featureDoc ? featureDoc.features : [], // Use empty array if no features found
        };
      })
    );

    // Send response
    res.status(200).json({ inquiry: inquiriesWithFeatures });
  } catch (err) {
    console.error("Error fetching inquiries with features:", err);
    res.status(500).json({ error: "Failed to fetch inquiries" });
  }
});



module.exports = router;
