# Invoices Module for Lawsuits Manager

This module enables creating and managing invoices in the Lawsuits Manager application, allowing users to generate professional PDF invoices for clients in Arabic.

## Features

- Create invoices with client selection, itemized services, and tax calculations
- Generate downloadable PDF invoices with full Arabic support
- Track invoice status (draft, sent, paid, overdue)
- Search and filter invoices by various criteria
- Store invoice data in Supabase database

## Setup Instructions

To set up the invoices module, follow these steps:

### 1. Database Migration

You need to run the database migration to create the `invoices` and `invoice_items` tables:

```bash
# Add your service role key to .env.local first:
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Then run the migration
node run-invoices-migration.js
```

Alternatively, you can execute the SQL directly in the Supabase SQL Editor:

1. Go to the Supabase Dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `add-invoices-tables.sql`
4. Run the SQL script

### 2. Install Dependencies

The invoices module requires the following dependencies:

```bash
npm install --legacy-peer-deps jspdf jspdf-autotable
```

## Using the Invoices Feature

### Creating a New Invoice

1. Navigate to `/invoices` in the application
2. Search for and select a client from the dropdown
3. Fill in the invoice details (dates, notes, etc.)
4. Add services to the invoice:
   - Select from predefined services, or
   - Enter custom service descriptions and prices
5. The system will automatically calculate subtotals, tax, and final totals
6. Click "Save Invoice" to store the invoice in the database
7. Click "Download PDF" to generate a downloadable PDF invoice

### Managing Invoices

1. Navigate to `/invoices/list` to view all invoices
2. Use the search and filter options to find specific invoices
3. View invoice details, download PDFs, or update status as needed

## PDF Invoice Template

The generated PDF invoices include:

- Professional layout with company and client information
- Invoice number, dates, and payment terms
- Itemized list of services with quantities and prices
- Subtotal, tax calculations, and total amount
- Space for notes and payment instructions
- Full Arabic language support

## Customization

You can customize the invoice template by modifying:

- `lib/generate-invoice-pdf.ts` - The PDF generation logic and layout
- `lib/pdf-fonts.ts` - Font configuration for Arabic support
- The company information in the `companyInfo` object in `app/invoices/page.tsx`

## Troubleshooting

If you encounter issues:

1. Ensure all database migrations have been properly applied
2. Check that all dependencies are correctly installed
3. Verify that the Supabase environment variables are properly configured
4. Look for errors in the browser console or server logs

For PDF generation issues, you may need to provide proper Arabic font files in a production environment.

## Future Enhancements

Planned future enhancements include:

- Email sending functionality for invoices
- Recurring invoice templates
- Payment tracking and reminders
- Integration with payment gateways 