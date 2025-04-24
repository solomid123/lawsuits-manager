"use client"

import jsPDF from 'jspdf'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'

// Font handling
import { loadFont } from './pdf-fonts'
import { processArabicText, processNumericValue } from './arabic-helpers'
import { uploadInvoicePDF } from './supabase-invoice-upload'
import { updateInvoicePdfUrl } from '@/app/actions/invoice-actions'

// Types
type Client = {
  id: string
  first_name: string
  last_name: string
  company_name: string | null
  email: string | null
  phone: string | null
}

type InvoiceItem = {
  id: string
  description: string
  quantity: number
  unit_price: number
  total: number
}

type InvoiceData = {
  id?: string // Optional id field for saved invoices
  client_id: string
  invoice_number: string
  issue_date: string  // Changed from invoice_date 
  due_date: string
  items: InvoiceItem[]
  notes: string
  amount: number     // Changed from subtotal
  tax_rate: number   // This is needed for calculations but not in DB
  tax_amount: number
  total_amount: number // Changed from total
  status: "draft" | "sent" | "paid" | "overdue"
}

export async function generateInvoicePDF(
  invoice: InvoiceData,
  client: Client,
  companyInfo: {
    name: string
    address: string
    phone: string
    email: string
    website?: string
    taxId?: string
    logo?: string
  },
  saveToSupabase: boolean = true
): Promise<{ pdfBlob: Blob, storageUrl?: string }> {
  // Create new PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  // Load and set Arabic font
  await loadFont(doc)
  
  // Page dimensions
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  const margin = 15
  
  // Colors
  const primaryColor = [52, 131, 235] // #3483eb
  const secondaryColor = [100, 100, 100] // #646464
  
  // Format currency
  const formatCurrency = (amount: number) => {
    // Use processNumericValue to ensure LTR display
    return processNumericValue(
      new Intl.NumberFormat('ar-MA', {
        style: 'currency',
        currency: 'MAD'
      }).format(amount).replace(/\s/g, ' ')
    );
  }

  // Format date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PPP', { locale: ar })
  }

  // ===== HEADER SECTION =====
  let yPos = margin

  // Company logo (if available)
  if (companyInfo.logo) {
    try {
      doc.addImage(companyInfo.logo, 'PNG', margin, yPos, 50, 20)
    } catch (error) {
      console.error('Error adding logo:', error)
    }
    yPos += 25
  } else {
    // Company name instead of logo
    doc.setFontSize(24)
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text(processArabicText("فاتورة"), margin, yPos)
    yPos += 10
  }

  // Invoice title
  doc.setFontSize(28)
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.text(processArabicText("فاتورة"), margin, yPos)
  
  // Invoice details
  doc.setFontSize(10)
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2])
  yPos += 10
  doc.text(processArabicText(`رقم الفاتورة: ${processNumericValue(invoice.invoice_number)}`), margin, yPos)
  yPos += 7
  doc.text(processArabicText(`تاريخ الإصدار: ${formatDate(invoice.issue_date)}`), margin, yPos)
  yPos += 7
  doc.text(processArabicText(`تاريخ الاستحقاق: ${formatDate(invoice.due_date)}`), margin, yPos)
  
  // Company info - right side
  yPos = margin + 15
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.text(processArabicText(companyInfo.address), pageWidth - margin, yPos, { align: 'right' })
  yPos += 7
  doc.text(processArabicText(`الهاتف: ${processNumericValue(companyInfo.phone)}`), pageWidth - margin, yPos, { align: 'right' })
  yPos += 7
  doc.text(processArabicText(`البريد الإلكتروني: ${companyInfo.email}`), pageWidth - margin, yPos, { align: 'right' })
  
  if (companyInfo.website) {
    yPos += 7
    doc.text(processArabicText(`الموقع الإلكتروني: ${companyInfo.website}`), pageWidth - margin, yPos, { align: 'right' })
  }
  
  if (companyInfo.taxId) {
    yPos += 7
    doc.text(processArabicText(`الرقم الضريبي: ${processNumericValue(companyInfo.taxId)}`), pageWidth - margin, yPos, { align: 'right' })
  }
  
  // Divider line
  yPos += 15
  doc.setDrawColor(200, 200, 200)
  doc.line(margin, yPos, pageWidth - margin, yPos)
  
  // ===== CLIENT INFORMATION =====
  yPos += 15
  doc.setFontSize(14)
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.text(processArabicText("معلومات العميل"), margin, yPos)
  
  yPos += 10
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  
  const clientName = client.company_name 
    ? `${client.company_name} (${client.first_name} ${client.last_name})`
    : `${client.first_name} ${client.last_name}`
    
  doc.text(processArabicText(`الاسم: ${clientName}`), margin, yPos)
  
  if (client.email) {
    yPos += 7
    doc.text(processArabicText(`البريد الإلكتروني: ${client.email}`), margin, yPos)
  }
  
  if (client.phone) {
    yPos += 7
    doc.text(processArabicText(`الهاتف: ${processNumericValue(client.phone)}`), margin, yPos)
  }
  
  // ===== INVOICE ITEMS TABLE =====
  yPos += 20
  
  // Create custom table manually instead of using autoTable
  // This gives us full control over the rendering of Arabic text
  
  // Table headers
  const headers = ['الوصف', 'الكمية', 'سعر الوحدة', 'المجموع'];
  const columnWidths = [80, 25, 35, 35]; // Width of each column in mm
  const tableWidth = columnWidths.reduce((a, b) => a + b, 0);
  const startX = (pageWidth - tableWidth) / 2;
  
  // Table styling
  const rowHeight = 10;
  const headerBgColor = [240, 240, 240]; // Light gray
  const borderColor = [200, 200, 200]; // Light gray
  const textColor = [0, 0, 0]; // Black
  
  // Draw table header
  doc.setFillColor(headerBgColor[0], headerBgColor[1], headerBgColor[2]);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFontSize(12);
  // Use normal font style since our base64 encoded font doesn't support bold
  doc.setFont('Amiri', 'normal');
  
  // Draw header background
  doc.rect(startX, yPos, tableWidth, rowHeight, 'F');
  
  // Draw header text
  let xPos = startX;
  for (let i = 0; i < headers.length; i++) {
    // For RTL, we need to draw headers from right to left
    const colIndex = headers.length - 1 - i;
    const header = headers[colIndex];
    const colWidth = columnWidths[colIndex];
    
    // Draw header text - ensure proper Arabic rendering
    doc.text(
      processArabicText(header),
      xPos + colWidth - 2, // Right align with 2mm padding
      yPos + rowHeight / 2 + 1, // Vertically center
      { align: 'right', baseline: 'middle' }
    );
    
    // Draw vertical line (except for the last column)
    if (i < headers.length - 1) {
      doc.line(xPos + colWidth, yPos, xPos + colWidth, yPos + rowHeight);
    }
    
    xPos += colWidth;
  }
  
  // Draw horizontal line after header
  doc.line(startX, yPos + rowHeight, startX + tableWidth, yPos + rowHeight);
  
  // Draw table rows
  doc.setFont('Amiri', 'normal');
  doc.setFontSize(10);
  
  let currentY = yPos + rowHeight;
  let rowCount = 0;
  
  for (const item of invoice.items) {
    // Alternate row background
    if (rowCount % 2 === 0) {
      doc.setFillColor(250, 250, 250); // Very light gray
      doc.rect(startX, currentY, tableWidth, rowHeight, 'F');
    }
    
    // Draw row data
    xPos = startX;
    for (let i = 0; i < headers.length; i++) {
      // For RTL, we need to draw data from right to left
      const colIndex = headers.length - 1 - i;
      const colWidth = columnWidths[colIndex];
      
      let cellText = '';
      switch (colIndex) {
        case 0: // Description
          cellText = processArabicText(item.description);
          break;
        case 1: // Quantity
          cellText = processNumericValue(item.quantity.toString());
          break;
        case 2: // Unit Price
          cellText = formatCurrency(item.unit_price);
          break;
        case 3: // Total
          cellText = formatCurrency(item.total);
          break;
      }
      
      // Draw cell text
      doc.text(
        cellText,
        xPos + colWidth - 2, // Right align with 2mm padding
        currentY + rowHeight / 2 + 1, // Vertically center
        { align: 'right', baseline: 'middle' }
      );
      
      // Draw vertical line (except for the last column)
      if (i < headers.length - 1) {
        doc.line(xPos + colWidth, currentY, xPos + colWidth, currentY + rowHeight);
      }
      
      xPos += colWidth;
    }
    
    // Draw horizontal line after row
    doc.line(startX, currentY + rowHeight, startX + tableWidth, currentY + rowHeight);
    
    // Move to next row
    currentY += rowHeight;
    rowCount++;
  }
  
  // Draw table border
  doc.rect(startX, yPos, tableWidth, currentY - yPos, 'S');
  
  // Update yPos to after the table
  yPos = currentY + 10;
  
  // ===== TOTALS =====
  // Use absolute positioning with fixed coordinates for the totals section
  doc.setFont('Amiri', 'normal');
  
  // Fixed positions for totals section
  const totalsRightEdge = pageWidth - margin;
  const labelRightPos = totalsRightEdge - 20; // Position for right edge of labels
  const valueRightPos = totalsRightEdge - 80; // Position for right edge of values
  
  // Subtotal - Remove colon
  doc.setFontSize(10);
  doc.text(processArabicText('المجموع الفرعي'), labelRightPos, yPos, { align: 'right' });
  doc.text(formatCurrency(invoice.amount), valueRightPos, yPos, { align: 'right' });
  
  // Tax - Remove tax percentage completely
  yPos += 7;
  doc.text(processArabicText('الضريبة'), labelRightPos, yPos, { align: 'right' });
  doc.text(formatCurrency(invoice.tax_amount), valueRightPos, yPos, { align: 'right' });
  
  // Total - Remove colon
  yPos += 10;
  doc.setFontSize(12);
  doc.text(processArabicText('المجموع الكلي'), labelRightPos, yPos, { align: 'right' });
  doc.text(formatCurrency(invoice.total_amount), valueRightPos, yPos, { align: 'right' });
  
  // ===== NOTES =====
  if (invoice.notes) {
    yPos += 20;
    doc.setFontSize(10);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(processArabicText('ملاحظات:'), margin, yPos);
    yPos += 7;
    
    // Handle multiline notes
    const splitNotes = doc.splitTextToSize(processArabicText(invoice.notes), pageWidth - (margin * 2));
    doc.text(splitNotes, margin, yPos);
  }
  
  // ===== FOOTER =====
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text(processArabicText('شكراً لتعاملكم معنا'), pageWidth / 2, pageHeight - 20, { align: 'center' });
  
  // Generate the PDF as a blob
  const pdfBlob = doc.output('blob');
  
  // If we don't need to save to Supabase or the invoice doesn't have an ID, just return the blob
  if (!saveToSupabase || !invoice.id) {
    return { pdfBlob };
  }
  
  try {
    // Upload to Supabase Storage
    const uploadResult = await uploadInvoicePDF(
      pdfBlob, 
      invoice.id, 
      invoice.invoice_number
    );
    
    if (uploadResult.error) {
      console.error('Error uploading PDF to Supabase:', uploadResult.error);
      return { pdfBlob };
    }
    
    if (uploadResult.publicUrl) {
      // Update the invoice record with the PDF URL
      const updateResult = await updateInvoicePdfUrl(invoice.id, uploadResult.publicUrl);
      
      if (updateResult.error) {
        console.error('Error updating invoice with PDF URL:', updateResult.error);
      }
      
      return { 
        pdfBlob, 
        storageUrl: uploadResult.publicUrl 
      };
    }
  } catch (error) {
    console.error('Error in Supabase storage process:', error);
  }
  
  // Return just the blob if anything fails in the upload process
  return { pdfBlob };
}

/**
 * Utility function to download an invoice PDF
 */
export function downloadInvoicePDF(pdfBlob: Blob, invoiceNumber: string) {
  // Create a download link
  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `فاتورة-${invoiceNumber}.pdf`;
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
