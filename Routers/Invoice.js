const express = require("express")
const router = express.Router()
const Invoice = require('../Models/InvoiceModel');
const InvoiceItem = require("../Models/InvoiceItems")

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

// PUT /api/invoice/items/:invoiceId
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

// Get next invoice ID
router.get("/next-id", async (req, res) => {
  try {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const dateStr = `${year}${month}${day}`

    const lastInvoice = await Invoice.findOne({
      invoiceId: new RegExp(`INVMAJ-${dateStr}-\\d{4}$`),
    }).sort({ invoiceId: -1 })

    let nextNumber = 1
    if (lastInvoice) {
      const lastNumber = Number.parseInt(lastInvoice.invoiceId.split("-")[2])
      nextNumber = lastNumber + 1
    }

    const nextInvoiceId = `INVMAJ-${dateStr}-${String(nextNumber).padStart(4, "0")}`
    res.json({ nextInvoiceId })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Create a new invoice
router.post("/", async (req, res) => {
 try {
   const {
     invoiceId,
     clientId,
     bankId,
     projectId,
     salesTax,
     discount,
     subtotal,
     total,
     dueDate,
     status,
     items
   } = req.body;

   // ✅ Step 1: Validate Required Fields
   if (!invoiceId || !clientId || !bankId || !projectId || subtotal === undefined || total === undefined || !dueDate || !status) {
    return res.status(400).json({ message: "Please provide all required fields." });
   }
  
   // ✅ Step 2: Check Items
   if (!items || items.length === 0) {
     return res.status(400).json({ message: "At least one invoice item is required." });
   }
   
   // ✅ Step 3: Insert Invoice Items
   const createdItems = await InvoiceItem.insertMany(
     items.map(item => ({
       ...item,
       invoiceId, // Linking item to the invoice
     }))
   );

   const itemIds = createdItems.map(item => item._id); // Extract ObjectIds

   // ✅ Step 4: Create Invoice
   const invoice = new Invoice({
     invoiceId,
     clientId,
     bankId,
     projectId,
     salesTax,
     discount,
     subtotal,
     total,
     dueDate,
     status,
     items: itemIds, // Storing the ObjectIds of created items
   });

   const savedInvoice = await invoice.save();

   // Return the invoice with items for consistency
   res.status(201).json({
     ...savedInvoice.toObject(),
     items: createdItems
   });

 } catch (error) {
   res.status(500).json({ message: "Server error: " + error.message });
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

// Update an invoice
router.put("/:id", async (req, res) => {
  try {
    const { items, ...invoiceData } = req.body;
    
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, invoiceData, { new: true });
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    // Delete existing items and add new ones
    await InvoiceItem.deleteMany({ invoiceId: invoice.invoiceId });
    
    if (items && items.length > 0) {
      const invoiceItems = items.map((item) => ({
        ...item,
        invoiceId: invoice.invoiceId,
      }));
      const newItems = await InvoiceItem.insertMany(invoiceItems);
      
      // Return the updated invoice with its items
      res.json({
        ...invoice.toObject(),
        items: newItems
      });
    } else {
      res.json({
        ...invoice.toObject(),
        items: []
      });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
    console.log(error);
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

module.exports = router