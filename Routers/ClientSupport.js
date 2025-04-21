const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
require('dotenv').config();
const SupportTicket = require('../Models/ClientSupportTicket'); 
const Notification = require('../Models/ClientNotifications')

const ADMIN_EMAIL = process.env.RECIPIENT_EMAIL || 'ahmadraza7867800@gmail.com';
const transporter = nodemailer.createTransport({
 service: 'gmail',
 auth: {
   user: process.env.EMAIL_USER, 
   pass: process.env.EMAIL_PASS  
 }
});
const router = express.Router();
const sanitizeHtml = (str) => {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};
router.post('/send', async (req, res) => {
  try {
    
    const { name, email, category, subject, message } = req.body;
    if (!name || !email || !category || !subject || !message) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }
    const sanitizedName = sanitizeHtml(name);
    const sanitizedCategory = sanitizeHtml(category);
    const sanitizedSubject = sanitizeHtml(subject);
    const sanitizedMessage = sanitizeHtml(message);
    
    const adminMailOptions = {
     from: {
       name: "Majestic Softs Support",
       address: process.env.EMAIL_USER,
     },
     to: ADMIN_EMAIL,
     replyTo: email,
     subject: `Support Ticket: ${sanitizedSubject} [${sanitizedCategory}]`,
     html: `
   <!DOCTYPE html>
   <html lang="en">
   <head>
     <meta charset="UTF-8">
     <meta name="viewport" content="width=device-width, initial-scale=1.0">
     <title>New Support Ticket</title>
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
                 <h1 style="color: #6E42CD; font-size: 28px; font-weight: 600; margin: 0 0 20px; text-align: center;">New Support Ticket 🔔</h1>
                 
                 <p style="font-size: 16px; line-height: 1.5; margin: 0 0 20px;">A new support ticket has been submitted that requires your attention.</p>
                 
                 <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8f9fa; border-radius: 8px; margin-bottom: 20px;">
                   <tr>
                     <td style="padding: 20px;">
                       <h2 style="color: #6E42CD; font-size: 20px; font-weight: 600; margin: 0 0 15px;">Ticket Details</h2>
                       <p style="font-size: 16px; line-height: 1.5; margin: 0;">
                         <strong>Name:</strong> ${sanitizedName}<br>
                         <strong>Email:</strong> ${email}<br>
                         <strong>Category:</strong> ${sanitizedCategory}<br>
                         <strong>Subject:</strong> ${sanitizedSubject}
                       </p>
                     </td>
                   </tr>
                 </table>
                 
                 <div style="background-color: #f4f7fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                   <h3 style="color: #6E42CD; font-size: 18px; font-weight: 600; margin: 0 0 10px;">Message:</h3>
                   <div style="background-color: #ffffff; padding: 15px; border-radius: 5px; border-left: 4px solid #6E42CD;">
                     ${sanitizedMessage.replace(/\n/g, '<br>')}
                   </div>
                 </div>
                 

               </td>
             </tr>
             
             <!-- Footer -->
             <tr>
               <td style="background-color: #f4f7fa; padding: 30px; border-radius: 0 0 8px 8px;">
                 <p style="font-size: 14px; color: #666666; text-align: center; margin: 0;">
                   This is an automated notification from<br>
                   <strong style="color: #6E42CD;">Majestic Softs Support System</strong>
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
   };
    try {
      const adminEmailInfo = await transporter.sendMail(adminMailOptions);
      console.log('Admin email sent successfully:', adminEmailInfo.messageId);
    } catch (emailError) {
      console.error('Error sending admin email:', emailError);
    }

    const confirmationMailOptions = {
     from: {
       name: "Majestic Softs Support",
       address: process.env.EMAIL_USER,
     },
     to: email,
     subject: `Your Support Ticket: ${sanitizedSubject}`,
     html: `
   <!DOCTYPE html>
   <html lang="en">
   <head>
     <meta charset="UTF-8">
     <meta name="viewport" content="width=device-width, initial-scale=1.0">
     <title>Support Ticket Confirmation</title>
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
                 <h1 style="color: #6E42CD; font-size: 28px; font-weight: 600; margin: 0 0 20px; text-align: center;">Support Ticket Received ✅</h1>
                 
                 <p style="font-size: 16px; line-height: 1.5; margin: 0 0 20px;">Thank you for contacting Majestic Softs Support. We've received your ticket and will get back to you as soon as possible.</p>
                 
                 <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8f9fa; border-radius: 8px; margin-bottom: 20px;">
                   <tr>
                     <td style="padding: 20px;">
                       <h2 style="color: #6E42CD; font-size: 20px; font-weight: 600; margin: 0 0 15px;">Your Ticket Details</h2>
                       <p style="font-size: 16px; line-height: 1.5; margin: 0;">
                         <strong>Name:</strong> ${sanitizedName}<br>
                         <strong>Category:</strong> ${sanitizedCategory}<br>
                         <strong>Subject:</strong> ${sanitizedSubject}
                       </p>
                     </td>
                   </tr>
                 </table>
                 
                 <div style="border-left: 4px solid #6E42CD; padding-left: 20px; margin-bottom: 20px;">
                   <h3 style="color: #6E42CD; font-size: 18px; font-weight: 600; margin: 0 0 10px;">Your Message:</h3>
                   <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
                     ${sanitizedMessage.replace(/\n/g, '<br>')}
                   </div>
                 </div>
                 
                 <div style="border-left: 4px solid #ffa500; padding-left: 20px; margin-bottom: 20px;">
                   <h3 style="color: #ffa500; font-size: 18px; font-weight: 600; margin: 0 0 10px;">What's Next?</h3>
                   <p style="font-size: 14px; line-height: 1.5; margin: 0;">
                     Our support team is reviewing your request. We typically respond within 24-48 hours. For urgent matters.
                   </p>
                 </div>
                 
                 
               </td>
             </tr>
             
             <!-- Footer -->
             <tr>
               <td style="background-color: #f4f7fa; padding: 30px; border-radius: 0 0 8px 8px;">
                 <p style="font-size: 14px; color: #666666; text-align: center; margin: 0;">
                   Thank you for choosing Majestic Softs!<br>
                   <strong style="color: #6E42CD;">The Majestic Softs Support Team</strong>
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
   };
    try {
      const userEmailInfo = await transporter.sendMail(confirmationMailOptions);
      console.log('User confirmation email sent successfully:', userEmailInfo.messageId);
    } catch (emailError) {
      console.error('Error sending user confirmation email:', emailError);
      // Continue with the process even if user email fails
    }

    // Save the ticket to the database
    const newTicket = new SupportTicket({
      name: sanitizedName,
      email,
      category: sanitizedCategory,
      subject: sanitizedSubject,
      message: sanitizedMessage
    });

    await newTicket.save();
    const userNotification = new Notification({
     userEmail: email, // Using email as userId
     title: 'Ticket Submitted',
     message: `Your support ticket "${sanitizedSubject}" has been submitted successfully.`,
     type: 'success',
     read: false
   });
   
   await userNotification.save();
   
   // Add notification ID to the response
   res.status(200).json({
     success: true,
     message: 'Support ticket submitted successfully',
     ticketId: newTicket._id,
     notificationId: userNotification._id
   });
  } catch (error) {
    // Log detailed error but return a generic message to the user
    console.error('Error processing support ticket:', error);
    res.status(500).json({ success: false, message: 'Failed to send support ticket. Please try again later.' });
  }
});
router.get('/show', async (req, res) => {
 try {
   // Get pagination parameters from query string
   const page = parseInt(req.query.page) || 1; // Current page (default: 1)
   const limit = parseInt(req.query.limit) || 10; // Items per page (default: 10)
   
   // Calculate skip value for pagination
   const skip = (page - 1) * limit;
   
   // Get filter parameters (optional)
   const statusFilter = req.query.status;
   const categoryFilter = req.query.category;
   const searchTerm = req.query.search;
   
   // Build filter object
   let filterQuery = {};
   
   if (statusFilter && statusFilter !== 'all') {
     filterQuery.status = statusFilter;
   }
   
   if (categoryFilter && categoryFilter !== 'all') {
     filterQuery.category = categoryFilter;
   }
   
   if (searchTerm) {
     filterQuery.$or = [
       { subject: { $regex: searchTerm, $options: 'i' } },
       { name: { $regex: searchTerm, $options: 'i' } },
       { email: { $regex: searchTerm, $options: 'i' } },
       { message: { $regex: searchTerm, $options: 'i' } }
     ];
   }
   
   // Get total count of tickets matching filter
   const total = await SupportTicket.countDocuments(filterQuery);
   
   // Fetch paginated tickets
   const tickets = await SupportTicket.find(filterQuery)
     .sort({ createdAt: -1 })
     .skip(skip)
     .limit(limit);
   
   // Calculate total pages
   const totalPages = Math.ceil(total / limit);
   
   // Return paginated response
   res.status(200).json({
     success: true,
     count: total,
     totalPages,
     currentPage: page,
     hasNextPage: page < totalPages,
     hasPrevPage: page > 1,
     data: tickets
   });
   
 } catch (error) {
   console.error('Error fetching support tickets:', error);
   res.status(500).json({
     success: false,
     message: 'Failed to retrieve support tickets. Please try again later.'
   });
 }
});
router.get('/show/:id', async (req, res) => {
 try {
   const ticket = await SupportTicket.findById(req.params.id);
   
   if (!ticket) {
     return res.status(404).json({
       success: false,
       message: 'Support ticket not found'
     });
   }

   res.status(200).json({
     success: true,
     data: ticket
   });
 } catch (error) {
   console.error('Error fetching support ticket:', error);
   
   // Check if error is due to invalid ID format
   if (error.name === 'CastError') {
     return res.status(400).json({
       success: false,
       message: 'Invalid ticket ID format'
     });
   }
   
   res.status(500).json({
     success: false,
     message: 'Failed to retrieve the support ticket. Please try again later.'
   });
 }
});
router.post('/:id/reply', async (req, res) => {
 try {
   const ticketId = req.params.id;
   const { message } = req.body;
   
   if (!message || !message.trim()) {
     return res.status(400).json({ 
       success: false, 
       message: 'Reply message is required' 
     });
   }

   // Find the ticket
   const ticket = await SupportTicket.findById(ticketId);
   
   if (!ticket) {
     return res.status(404).json({
       success: false,
       message: 'Support ticket not found'
     });
   }

   // Sanitize the message
   const sanitizedMessage = sanitizeHtml(message);
   
   // Update ticket status
   ticket.status = 'Replied';
   await ticket.save();

   // Send email to the user
   const replyMailOptions = {
     from: {
       name: "Majestic Softs Support",
       address: process.env.EMAIL_USER,
     },
     to: ticket.email,
     subject: `RE: Your Support Ticket: ${ticket.subject}`,
     html: `
   <!DOCTYPE html>
   <html lang="en">
   <head>
     <meta charset="UTF-8">
     <meta name="viewport" content="width=device-width, initial-scale=1.0">
     <title>Support Ticket Reply</title>
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
                 <h1 style="color: #6E42CD; font-size: 28px; font-weight: 600; margin: 0 0 20px; text-align: center;">We've Replied to Your Support Ticket</h1>
                 
                 <p style="font-size: 16px; line-height: 1.5; margin: 0 0 20px;">We have an update regarding your support ticket about "${ticket.subject}":</p>
                 
                 <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8f9fa; border-radius: 8px; margin-bottom: 20px;">
                   <tr>
                     <td style="padding: 20px;">
                       <h2 style="color: #6E42CD; font-size: 20px; font-weight: 600; margin: 0 0 15px;">Ticket Information</h2>
                       <p style="font-size: 16px; line-height: 1.5; margin: 0;">
                         <strong>Subject:</strong> ${ticket.subject}<br>
                         <strong>Category:</strong> ${ticket.category}<br>
                         <strong>Status:</strong> Replied
                       </p>
                     </td>
                   </tr>
                 </table>
                 
                 <div style="background-color: #f4f7fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                   <h3 style="color: #6E42CD; font-size: 18px; font-weight: 600; margin: 0 0 10px;">Your Original Message:</h3>
                   <div style="background-color: #ffffff; padding: 15px; border-radius: 5px; border-left: 4px solid #6E42CD;">
                     ${ticket.message.replace(/\n/g, '<br>')}
                   </div>
                 </div>
                 
                 <div style="background-color: #f0ebff; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                   <h3 style="color: #6E42CD; font-size: 18px; font-weight: 600; margin: 0 0 10px;">Our Reply:</h3>
                   <div style="background-color: #ffffff; padding: 15px; border-radius: 5px; border-left: 4px solid #6E42CD;">
                     ${sanitizedMessage.replace(/\n/g, '<br>')}
                   </div>
                 </div>
                 
                 <p style="font-size: 16px; line-height: 1.5; margin: 20px 0;">
                   If you have any further questions or need additional assistance, please feel free to reply to this email or submit a new support ticket.
                 </p>
               </td>
             </tr>
             
             <!-- Footer -->
             <tr>
               <td style="background-color: #f4f7fa; padding: 30px; border-radius: 0 0 8px 8px;">
                 <p style="font-size: 14px; color: #666666; text-align: center; margin: 0;">
                   Thank you for choosing Majestic Softs!<br>
                   <strong style="color: #6E42CD;">The Majestic Softs Support Team</strong>
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
   };

   // Create user notification
   const userNotification = new Notification({
    userEmail: ticket.email,
     title: 'Ticket Reply',
     message: `We've replied to your support ticket "${ticket.subject}".`,
     type: 'info',
     read: false
   });
   
   await userNotification.save();
   
   // Send email
   try {
     const emailInfo = await transporter.sendMail(replyMailOptions);
     console.log('Reply email sent successfully:', emailInfo.messageId);
   } catch (emailError) {
     console.error('Error sending reply email:', emailError);
     // We'll continue even if email fails
   }

   // Send response only ONCE
   res.status(200).json({
     success: true,
     message: 'Reply sent successfully',
     data: {
       ticketId: ticket._id,
       status: ticket.status,
       notificationId: userNotification._id
     }
   });
 } catch (error) {
   console.error('Error processing reply:', error);
   
   // Check if error is due to invalid ID format
   if (error.name === 'CastError') {
     return res.status(400).json({
       success: false,
       message: 'Invalid ticket ID format'
     });
   }
   
   res.status(500).json({
     success: false,
     message: 'Failed to send reply. Please try again later.'
   });
 }
});
module.exports = router;