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
      to: "info@majesticsofts.com",
      subject: `New Cost Inquiry from ${email}`,
      text: `
        Dear Majestic Dev Team,
    
        A new cost inquiry has been received with the following details:
    
        Service: ${selectedservice}
        Email: ${email}
        Selected Features: ${selectedfeatures.join(", ")}
        Total Cost: $${totalcost}
        Start Date: ${startDate}
        Delivery Option: ${deliveryoption}
    
        Additional Details:
        ${details}
    
        Please review and respond to this inquiry at your earliest convenience.
    
        Best regards,
        Majestic Dev Inquiry System
      `,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Cost Inquiry</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap');
            body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
            table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
            img { -ms-interpolation-mode: bicubic; }
            img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
            table { border-collapse: collapse !important; }
            body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }
            a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
            @media screen and (max-width: 525px) {
              .wrapper { width: 100% !important; max-width: 100% !important; }
              .responsive-table { width: 100% !important; }
              .padding { padding: 10px 5% 15px 5% !important; }
              .section-padding { padding: 0 15px 50px 15px !important; }
            }
            .form-container { bacground-color: #ffffff; border-radius: 15px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); }
            .form-heading { margin: 0; color: #ffffff; padding: 20px; border-radius: 15px 15px 0 0; font-weight: 600; }
            .form-section { bacground-color: #ffffff; border-radius: 0 0 15px 15px; }
            .form-field { padding: 20px; border-bottom: 1px solid #e0e0e0; }
            .form-field:last-child { border-bottom: none; }
          </style>
        </head>
        <body style="margin: 0 !important; padding: 0 !important; bacground-color: #f4f4f4;">
          <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: 'Montserrat', Helvetica, Arial, sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
            New cost inquiry received. Click to view details.
          </div>
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td align="center" style="padding: 40px 15px 40px 15px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                  <tr>
                    <td align="center" style="padding: 0 0 20px 0; font-family: 'Montserrat', Helvetica, Arial, sans-serif;">
                      <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="50" cy="50" r="48" fill="#8a4baf"/>
                        <path d="M30 50L45 65L70 40" stroke="white" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding: 0 0 20px 0; font-family: 'Montserrat', Helvetica, Arial, sans-serif; font-size: 28px; font-weight: 700; color: #8a4baf;">
                      New Cost Inquiry
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding: 0 0 20px 0; font-family: 'Montserrat', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 25px; color: #666666;">
                      A new inquiry has been submitted through the cost inquiry form.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding: 0 15px 40px 15px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                  <tr>
                    <td align="left" style="padding: 0 0 0 0;">
                      <table cellspacing="0" cellpadding="0" border="0" width="100%" class="form-container">
                        <tr>
                          <td colspan="2" style="padding: 0;">
                            <svg width="100%" height="10" viewBox="0 0 600 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M0 10C0 4.47715 4.47715 0 10 0H590C595.523 0 600 4.47715 600 10H0Z" fill="#8a4baf"/>
                            </svg>
                          </td>
                        </tr>
                        ${[
                          { label: "Service", value: selectedservice },
                          { label: "Email", value: email },
                          { label: "Features", value: selectedfeatures.join(", ") },
                          { label: "Total Cost", value: `$${totalcost}` },
                          { label: "Start Date", value: startDate },
                          { label: "Delivery Option", value: deliveryoption },
                        ]
                          .map(
                            (item, index) => `
                          <tr>
                            <td width="30%" align="left" style="font-family: 'Montserrat', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 18px; color: #666666; padding: 20px; border-bottom: 1px solid #e0e0e0;">
                              <div class="form-field">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle; margin-right: 10px;">
                                  <circle cx="10" cy="10" r="8" stroke="#8a4baf" stroke-width="2"/>
                                  <circle cx="10" cy="10" r="3" fill="#8a4baf"/>
                                </svg>
                                ${item.label}
                              </div>
                            </td>
                            <td width="70%" align="left" style="font-family: 'Montserrat', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 18px; font-weight: 600; color: #333333; padding: 20px; border-bottom: 1px solid #e0e0e0;">
                              <div class="form-field">${item.value}</div>
                            </td>
                          </tr>
                        `,
                          )
                          .join("")}
                        <tr>
                          <td colspan="2" align="left" style="padding: 20px; font-family: 'Montserrat', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 22px; color: #666666;">
                            <h3 style="font-size: 18px; font-weight: 600; color: #333333; margin: 0 0 10px 0;">Additional Details</h3>
                            <p style="margin: 0;">${details}</p>
                          </td>
                        </tr>
                        <tr>
                          <td colspan="2" style="padding: 0;">
                            <svg width="100%" height="10" viewBox="0 0 600 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M0 0C0 5.52285 4.47715 10 10 10H590C595.523 10 600 5.52285 600 0H0Z" fill="#8a4baf"/>
                            </svg>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding: 30px 0 0 0;">
                      <table border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td align="center" style="border-radius: 50px;" bgcolor="#8a4baf">
                            <a href="https://yourwebsite.com/dashboard" target="_blank" style="font-size: 16px; font-family: 'Montserrat', Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; padding: 15px 25px; border-radius: 50px; border: 1px solid #8a4baf; display: inline-block; font-weight: 600;">
                             <svg 
  width="20" 
  height="20" 
  viewBox="0 0 20 20" 
  fill="none" 
  xmlns="http://www.w3.org/2000/svg" 
  style="vertical-align: middle; margin-right: 10px;"
>
  <path 
    d="M15 10H5M5 10L9 6M5 10L9 14" 
    stroke="white" 
    stroke-width="2" 
    stroke-linecap="round" 
    stroke-linejoin="round"
  />
</svg>

                              Return To Portfolio
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding: 0px 15px 40px 15px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
                  <tr>
                    <td align="center" style="padding: 20px 0 0 0; font-family: 'Montserrat', Helvetica, Arial, sans-serif; font-size: 13px; line-height: 20px; color: #666666;">
                      This is an automated message from the Majestic Dev Team cost inquiry system.<br>
                      © 2025 Majestic Dev Team. All rights reserved.
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
    <body style="font-family: 'Arial', sans-serif; bacground-color: #f6f9fc; margin: 0; padding: 0;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="min-width: 100%; bacground-color: #f6f9fc;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table cellpadding="0" cellspacing="0" border="0" width="600" style="bacground-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
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
                        <p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 10px 0 0;">Thank you for reaching out to us! We have successfully received your cost inquiry and will get bac to you shortly.</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="bacground-color: #f9f9f9; border-radius: 8px; padding: 20px;">
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
