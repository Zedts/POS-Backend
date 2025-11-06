import * as invoiceModel from '../models/invoices.js';

// Get all invoices with optional filters
export const getInvoices = async (req, res) => {
  try {
    const { startDate, endDate, invoiceNumber, status, paidBy } = req.query;
    
    const filters = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (invoiceNumber) filters.invoiceNumber = invoiceNumber;
    if (status) filters.status = status;
    if (paidBy) filters.paidBy = paidBy;

    const invoices = await invoiceModel.getAllInvoices(filters);
    res.json(invoices);
  } catch (error) {
    console.error('Error in getInvoices:', error);
    res.status(500).json({ message: 'Error fetching invoices', error: error.message });
  }
};

// Get invoice by invoice number with items
export const getInvoiceByNumber = async (req, res) => {
  try {
    const { invoiceNumber } = req.params;

    const invoice = await invoiceModel.getInvoiceByNumber(invoiceNumber);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const items = await invoiceModel.getInvoiceItems(invoice.order_number);
    
    res.json({
      ...invoice,
      items
    });
  } catch (error) {
    console.error('Error in getInvoiceByNumber:', error);
    res.status(500).json({ message: 'Error fetching invoice details', error: error.message });
  }
};

// Get invoice statistics
export const getInvoiceStats = async (req, res) => {
  try {
    const stats = await invoiceModel.getInvoiceStats();
    res.json(stats);
  } catch (error) {
    console.error('Error in getInvoiceStats:', error);
    res.status(500).json({ message: 'Error fetching invoice statistics', error: error.message });
  }
};

// Create new invoice
export const createInvoice = async (req, res) => {
  try {
    const invoiceData = req.body;

    // Validation
    if (!invoiceData.orderNumber || !invoiceData.orderTotal || !invoiceData.balance || !invoiceData.paidBy || !invoiceData.verifiedBy) {
      return res.status(400).json({
        success: false,
        message: 'Data invoice tidak lengkap'
      });
    }

    // Create invoice
    const invoiceNumber = await invoiceModel.createInvoice(invoiceData);
    
    res.json({
      success: true,
      message: 'Invoice berhasil dibuat',
      data: { invoiceNumber }
    });
  } catch (error) {
    console.error('Error in createInvoice:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal membuat invoice',
      error: error.message
    });
  }
};
