const express = require("express")
const router = express.Router()
const Invoice = require('../Models/InvoiceModel');
const InvoiceItem = require("../Models/InvoiceItems")
const Client = require('../Models/Clients'); // Adjust path as needed
const ClientProject = require('../Models/ClientProjects');
const Bank = require('../Models/Banks');
const Notification = require('../Models/ClientNotifications');

// Enhanced notification creation with better debugging
const createNotification = async (userEmail, title, message, type = 'info') => {
  console.log(`NOTIFICATION ATTEMPT: Creating notification for ${userEmail}: ${title}`);
  try {
    // Verify Notification model exists and is properly imported
    console.log("Notification model type:", typeof Notification);
    console.log("Notification model:", Object.keys(Notification).length > 0 ? "Valid" : "Invalid");
    
    const notification = new Notification({
      userEmail, 
      title,
      message,
      type,
      read: false
    });
    
    console.log("Notification object created:", notification);
    
    const saved = await notification.save();
    console.log('SUCCESS: Notification created:', saved);
    return saved;
  } catch (error) {
    console.error('ERROR: Creating notification failed:', error);
    console.log('Error details:', error.message);
    console.log('Error stack:', error.stack);
    return null;
  }
};

// POST - Create new invoice
router.post("/", async (req, res) => {
  console.log("POST /api/invoices - Creating new invoice");
  try {
    const {
      invoiceId,
      clientId,
      bankId,
      projectId,
      salesTax,
      discount,
      subtotal,
      dueDate,
      total,
      status,
      items
    } = req.body;

    console.log(`Invoice creation request for clientId: ${clientId}`);

    // ✅ Step 1: Validate Required Fields
    if (!invoiceId || !clientId || !bankId || !projectId || subtotal === undefined || total === undefined || !status) {
      console.log("Validation failed: Missing required fields");
      return res.status(400).json({ message: "Please provide all required fields." });
    }
    
    // ✅ Step 2: Check Items
    if (!items || items.length === 0) {
      console.log("Validation failed: No invoice items provided");
      return res.status(400).json({ message: "At least one invoice item is required." });
    }
    
    // ✅ Step 3: Insert Invoice Items
    console.log("Creating invoice items...");
    const createdItems = await InvoiceItem.insertMany(
      items.map(item => ({
        ...item,
        invoiceId,
      }))
    );
    console.log(`Created ${createdItems.length} invoice items`);

    const itemIds = createdItems.map(item => item._id);

    // ✅ Step 4: Create Invoice
    console.log("Creating invoice record...");
    const invoice = new Invoice({
      invoiceId,
      clientId,
      bankId,
      projectId,
      salesTax,
      discount,
      subtotal,
      dueDate,
      total,
      status,
      items: itemIds,
    });

    const savedInvoice = await invoice.save();
    console.log(`Invoice saved successfully with ID: ${savedInvoice._id}`);

    // Get client email for notifications
    console.log(`Looking up client with ID: ${clientId}`);
    const client = await Client.findById(clientId);
    console.log("Client lookup result:", client ? `Found client with ID ${client._id}` : "No client found");
    
    if (client) {
      console.log("Client email:", client.email || "NO EMAIL FOUND");
      
      if (client.email) {
        console.log("About to create notification for:", client.email);
        try {
          const notificationResult = await createNotification(
            client.email,
            'New Invoice Created',
            `A new invoice (${invoiceId}) has been created for you with a total of ${total}`,
            'info'
          );
          console.log("Notification creation result:", notificationResult);
        } catch (notifError) {
          console.error("Failed to create notification:", notifError);
        }
      } else {
        console.log("Cannot create notification - client has no email");
      }
    } else {
      console.log("Cannot create notification - client not found");
    }

    // Return the invoice with items for consistency
    res.status(201).json({
      ...savedInvoice.toObject(),
      items: createdItems
    });

  } catch (error) {
    console.error("ERROR in POST /api/invoices:", error);
    res.status(500).json({ message: "Server error: " + error.message });
  }
});

// PUT - Update an invoice
router.put("/:id", async (req, res) => {
  console.log(`PUT /api/invoices/${req.params.id} - Updating invoice`);
  try {
    const { items, ...invoiceData } = req.body;
    
    const originalInvoice = await Invoice.findById(req.params.id);
    if (!originalInvoice) {
      console.log(`Invoice with ID ${req.params.id} not found`);
      return res.status(404).json({ message: "Invoice not found" });
    }
    
    console.log(`Updating invoice with ID ${req.params.id}`);
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, invoiceData, { new: true });

    // Delete existing items and add new ones
    console.log(`Deleting existing items for invoice ${invoice.invoiceId}`);
    await InvoiceItem.deleteMany({ invoiceId: invoice.invoiceId });
    
    let newItems = [];
    if (items && items.length > 0) {
      console.log(`Creating ${items.length} new items for invoice ${invoice.invoiceId}`);
      const invoiceItems = items.map((item) => ({
        ...item,
        invoiceId: invoice.invoiceId,
      }));
      newItems = await InvoiceItem.insertMany(invoiceItems);
      console.log(`${newItems.length} new items created`);
    }
    
    // Get client email for notifications
    console.log(`Looking up client with ID: ${invoice.clientId}`);
    const client = await Client.findById(invoice.clientId);
    console.log("Client lookup result:", client ? `Found client with ID ${client._id}` : "No client found");
    
    if (client) {
      console.log("Client email:", client.email || "NO EMAIL FOUND");
      
      if (client.email) {
        // Check what changed to customize the notification
        let changes = [];
        if (originalInvoice.status !== invoice.status) {
          changes.push(`status updated to "${invoice.status}"`);
        }
        if (originalInvoice.total !== invoice.total) {
          changes.push(`total amount updated to ${invoice.total}`);
        }
        
        const message = changes.length > 0 
          ? `Your invoice ${invoice.invoiceId} has been updated: ${changes.join(', ')}`
          : `Your invoice ${invoice.invoiceId} has been updated`;
        
        console.log("About to create notification for:", client.email);
        console.log("Notification message:", message);
        
        try {
          const notificationResult = await createNotification(
            client.email,
            'Invoice Updated',
            message,
            'info'
          );
          console.log("Notification creation result:", notificationResult);
        } catch (notifError) {
          console.error("Failed to create notification:", notifError);
        }
      } else {
        console.log("Cannot create notification - client has no email");
      }
    } else {
      console.log("Cannot create notification - client not found");
    }
    
    // Return the updated invoice with its items
    res.json({
      ...invoice.toObject(),
      items: newItems
    });
  } catch (error) {
    console.error("ERROR in PUT /api/invoices/:id", error);
    res.status(400).json({ message: error.message });
  }
});
router.get("/show", async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate('clientId')
      .populate('bankId')
      .populate('projectId');
    
    // For each invoice, fetch its items
    const invoicesWithItems = await Promise.all(
      invoices.map(async (invoice) => {
        const items = await InvoiceItem.find({ invoiceId: invoice.invoiceId });
        return {
          ...invoice.toObject(),
          items
        };
      })
    );
    
    res.json(invoicesWithItems);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({ message: error.message });
    console.log(error)
  }
});
// GET /api/invoice-items?invoiceId=INVMAJ-20250224-0001
router.get("/items", async (req, res) => {
  const { invoiceId } = req.query;

  try {
    if (!invoiceId) {
      return res.status(400).json({ message: "Invoice ID is required" });
    }

    const items = await InvoiceItem.find({ invoiceId });
    res.json(items);
  } catch (err) {
    console.error("Error fetching invoice items:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

router.put("/items/:invoiceId", async (req, res) => {
  const { invoiceId } = req.params;
  const { items } = req.body;

  try {
    if (!invoiceId) {
      return res.status(400).json({ message: "Invoice ID is required" });
    }

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ message: "Items array is required" });
    }

    // Delete existing items for this invoice
    await InvoiceItem.deleteMany({ invoiceId });

    // Insert new items
    const updatedItems = await InvoiceItem.insertMany(
      items.map(item => ({
        ...item,
        invoiceId // Ensure all items have the correct invoiceId
      }))
    );

    // Update the invoice's items reference if needed
    const itemIds = updatedItems.map(item => item._id);
    await Invoice.findOneAndUpdate(
      { invoiceId },
      { items: itemIds }
    );

    res.json(updatedItems);
  } catch (error) {
    console.error("Error updating invoice items:", error);
    res.status(500).json({ message: "Server Error: " + error.message });
  }
});

router.get("/next-id", async (req, res) => {
  try {
    // Find the last invoice in the database, regardless of date
    const lastInvoice = await Invoice.findOne({})
      .sort({ createdAt: -1 }) // Sort by creation time to get the most recent invoice
      .select('invoiceId');

    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateStr = `${year}${month}${day}`;

    let nextNumber = 1;
    if (lastInvoice) {
      // Extract the last number from the most recent invoice
      const lastNumberMatch = lastInvoice.invoiceId.match(/-(\d{4})$/);
      if (lastNumberMatch) {
        const lastNumber = Number.parseInt(lastNumberMatch[1]);
        nextNumber = lastNumber + 1;
      }
    }

    // Ensure the next number is always 4 digits
    const nextInvoiceId = `INVMAJ-${dateStr}-${String(nextNumber).padStart(4, "0")}`;

    res.json({ nextInvoiceId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// Get all invoices with their items
router.get("/", async (req, res) => {
  try {
    const invoices = await Invoice.find();
    
    // For each invoice, fetch its items
    const invoicesWithItems = await Promise.all(
      invoices.map(async (invoice) => {
        const items = await InvoiceItem.find({ invoiceId: invoice.invoiceId });
        return {
          ...invoice.toObject(),
          items
        };
      })
    );
    
    res.json(invoicesWithItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific invoice
router.get("/:id", async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    const items = await InvoiceItem.find({ invoiceId: invoice.invoiceId });
    res.json({ 
      ...invoice.toObject(), 
      items 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/current", async (req, res) => {
  try {
    // Assuming req.clientEmail is set by your auth middleware
    const clientEmail = req.clientEmail;
    
    if (!clientEmail) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const client = await Client.findOne({ email: clientEmail });
    
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    
    // Return only necessary info (don't send password, etc.)
    res.json({
      id: client._id,
      email: client.email,
      name: client.name // If you have this field
    });
  } catch (error) {
    console.error("Error fetching client info:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// Delete an invoice
router.delete("/:id", async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    await InvoiceItem.deleteMany({ invoiceId: invoice.invoiceId });
    res.json({ message: "Invoice deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Get all invoices for logged-in client
router.get('/', async (req, res) => {
  try {
    const client = await Client.findOne({ email: req.clientEmail });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const invoices = await Invoice.find({ clientId: client._id })
      .populate('items')
      .sort({ createdAt: -1 });
      
    res.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ message: 'Error fetching invoices' });
  }
});

// Get individual invoice for logged-in client
router.get('/:invoiceId', async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const client = await Client.findOne({ email: req.clientEmail });
    
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const invoice = await Invoice.findOne({
      _id: invoiceId,
      clientId: client._id
    }).populate('items');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found or unauthorized' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid invoice ID format' });
    }
    res.status(500).json({ message: 'Error fetching invoice' });
  }
});
module.exports = router