import { NextRequest, NextResponse } from 'next/server'
import { canExportPDF } from '@/lib/actions/permissions'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const canExport = await canExportPDF()
    
    if (!canExport) {
      return NextResponse.json(
        { error: 'Upgrade to Pro or Fleet plan to export PDFs' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { type, data } = body // type: 'invoice' | 'quote' | 'report', data: the document data

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get business info for PDF header
    const { data: business } = await supabase
      .from('businesses')
      .select('name, email, phone, address, city, state, zip')
      .eq('owner_id', user.id)
      .single()

    if (type === 'invoice' && data.invoiceId) {
      // Fetch invoice data
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          *,
          client:clients(name, email, phone, address, city, state, zip),
          invoice_items(*)
        `)
        .eq('id', data.invoiceId)
        .single()

      if (invoiceError || !invoice) {
        return NextResponse.json(
          { error: 'Invoice not found' },
          { status: 404 }
        )
      }

      // Generate simple PDF content (HTML format that can be converted to PDF)
      // In production, you'd use a library like jsPDF, PDFKit, or Puppeteer
      const pdfContent = generateInvoicePDF(invoice, business)
      
      return NextResponse.json({ 
        success: true,
        message: 'PDF generated successfully',
        type: 'invoice',
        // In production, return the PDF blob or URL
        // For now, return the HTML content that can be converted
        content: pdfContent,
        filename: `invoice-${invoice.id.substring(0, 8)}.pdf`
      })
    }

    if (type === 'quote' && data.quoteId) {
      // Fetch quote data
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select(`
          *,
          client:clients(name, email, phone, address, city, state, zip),
          quote_items(*)
        `)
        .eq('id', data.quoteId)
        .single()

      if (quoteError || !quote) {
        return NextResponse.json(
          { error: 'Quote not found' },
          { status: 404 }
        )
      }

      const pdfContent = generateQuotePDF(quote, business)
      
      return NextResponse.json({ 
        success: true,
        message: 'PDF generated successfully',
        type: 'quote',
        content: pdfContent,
        filename: `quote-${quote.id.substring(0, 8)}.pdf`
      })
    }

    return NextResponse.json(
      { error: 'Invalid export type or missing data' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to export' },
      { status: 500 }
    )
  }
}

// Helper function to generate invoice PDF HTML
function generateInvoicePDF(invoice: any, business: any) {
  const items = invoice.invoice_items || []
  const client = invoice.client || {}
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Invoice ${invoice.id.substring(0, 8)}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; }
        .header { margin-bottom: 30px; }
        .business-info { margin-bottom: 20px; }
        .client-info { margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f5f5f5; }
        .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>INVOICE</h1>
        <p>Invoice #: ${invoice.id.substring(0, 8)}</p>
        <p>Date: ${new Date(invoice.created_at).toLocaleDateString()}</p>
        <p>Status: ${invoice.status.toUpperCase()}</p>
      </div>
      
      <div class="business-info">
        <h3>From:</h3>
        <p><strong>${business?.name || 'Business Name'}</strong></p>
        ${business?.address ? `<p>${business.address}</p>` : ''}
        ${business?.city && business?.state ? `<p>${business.city}, ${business.state} ${business.zip || ''}</p>` : ''}
        ${business?.email ? `<p>Email: ${business.email}</p>` : ''}
        ${business?.phone ? `<p>Phone: ${business.phone}</p>` : ''}
      </div>
      
      <div class="client-info">
        <h3>Bill To:</h3>
        <p><strong>${client.name || 'Client Name'}</strong></p>
        ${client.address ? `<p>${client.address}</p>` : ''}
        ${client.city && client.state ? `<p>${client.city}, ${client.state} ${client.zip || ''}</p>` : ''}
        ${client.email ? `<p>Email: ${client.email}</p>` : ''}
        ${client.phone ? `<p>Phone: ${client.phone}</p>` : ''}
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Description</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item: any) => `
            <tr>
              <td>${item.name || 'Item'}</td>
              <td>${item.description || ''}</td>
              <td>${item.quantity || 1}</td>
              <td>$${(item.price || 0).toFixed(2)}</td>
              <td>$${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="total">
        <p>Subtotal: $${invoice.total.toFixed(2)}</p>
        ${invoice.paid_amount > 0 ? `<p>Paid: $${invoice.paid_amount.toFixed(2)}</p>` : ''}
        ${invoice.status !== 'paid' ? `<p>Amount Due: $${(invoice.total - (invoice.paid_amount || 0)).toFixed(2)}</p>` : ''}
      </div>
    </body>
    </html>
  `
}

// Helper function to generate quote PDF HTML
function generateQuotePDF(quote: any, business: any) {
  const items = quote.quote_items || []
  const client = quote.client || {}
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Quote ${quote.id.substring(0, 8)}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; }
        .header { margin-bottom: 30px; }
        .business-info { margin-bottom: 20px; }
        .client-info { margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f5f5f5; }
        .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 20px; }
        .quote-note { margin-top: 30px; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #007bff; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>QUOTE</h1>
        <p>Quote #: ${quote.id.substring(0, 8)}</p>
        <p>Date: ${new Date(quote.created_at).toLocaleDateString()}</p>
        <p>Status: ${quote.status.toUpperCase()}</p>
      </div>
      
      <div class="business-info">
        <h3>From:</h3>
        <p><strong>${business?.name || 'Business Name'}</strong></p>
        ${business?.address ? `<p>${business.address}</p>` : ''}
        ${business?.city && business?.state ? `<p>${business.city}, ${business.state} ${business.zip || ''}</p>` : ''}
        ${business?.email ? `<p>Email: ${business.email}</p>` : ''}
        ${business?.phone ? `<p>Phone: ${business.phone}</p>` : ''}
      </div>
      
      <div class="client-info">
        <h3>Quote For:</h3>
        <p><strong>${client.name || 'Client Name'}</strong></p>
        ${client.address ? `<p>${client.address}</p>` : ''}
        ${client.city && client.state ? `<p>${client.city}, ${client.state} ${client.zip || ''}</p>` : ''}
        ${client.email ? `<p>Email: ${client.email}</p>` : ''}
        ${client.phone ? `<p>Phone: ${client.phone}</p>` : ''}
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Description</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item: any) => `
            <tr>
              <td>${item.name || 'Item'}</td>
              <td>${item.description || ''}</td>
              <td>${item.quantity || 1}</td>
              <td>$${(item.price || 0).toFixed(2)}</td>
              <td>$${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="total">
        <p>Total: $${quote.total.toFixed(2)}</p>
      </div>
      
      <div class="quote-note">
        <p><strong>Note:</strong> This quote is valid for 30 days from the date of issue.</p>
      </div>
    </body>
    </html>
  `
}
