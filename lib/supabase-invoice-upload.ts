"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { v4 as uuidv4 } from 'uuid'

const supabase = createClientComponentClient()

// Bucket name for invoice PDFs
const INVOICE_BUCKET = 'invoice-documents'

/**
 * Upload an invoice PDF to Supabase Storage
 * @param file The PDF blob to upload
 * @param invoiceId The ID of the invoice
 * @param invoiceNumber The invoice number (for filename)
 * @returns Object with the upload status and file path or error
 */
export async function uploadInvoicePDF(
  file: Blob,
  invoiceId: string,
  invoiceNumber: string
): Promise<{ path: string | null; publicUrl: string | null; error: Error | null }> {
  try {
    console.log(`Starting invoice PDF upload for invoice ${invoiceNumber} (${invoiceId})`)
    
    // Create a unique filename with timestamp to prevent collisions
    const timestamp = new Date().getTime()
    const fileName = `invoice-${invoiceNumber}-${timestamp}.pdf`
    const filePath = `invoices/${invoiceId}/${fileName}`
    
    console.log(`Generated file path: ${filePath}`)

    // Convert Blob to File
    const pdfFile = new File([file], fileName, { type: 'application/pdf' })

    // Upload the file to Supabase Storage
    console.log(`Uploading to Supabase Storage...`)
    const { data, error } = await supabase.storage
      .from(INVOICE_BUCKET)
      .upload(filePath, pdfFile, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Error uploading invoice PDF:', error)
      return { path: null, publicUrl: null, error }
    }

    console.log(`Invoice PDF uploaded successfully`, data)
    
    // Get the public URL for the file
    const { data: urlData } = supabase.storage
      .from(INVOICE_BUCKET)
      .getPublicUrl(filePath)
    
    // Return the full path and public URL to the file
    return { 
      path: data.path, 
      publicUrl: urlData.publicUrl, 
      error: null 
    }
  } catch (error) {
    console.error('Error in uploadInvoicePDF function:', error)
    return { 
      path: null, 
      publicUrl: null, 
      error: error as Error 
    }
  }
}

/**
 * Get a public URL for an invoice PDF in Supabase Storage
 * @param path The file path in the storage bucket
 * @returns The public URL for the file
 */
export function getInvoicePdfUrl(path: string): string {
  const { data } = supabase.storage.from(INVOICE_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

/**
 * Delete an invoice PDF from Supabase Storage
 * @param path The file path in the storage bucket
 * @returns Object with the deletion status and error (if any)
 */
export async function deleteInvoicePdf(
  path: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase.storage.from(INVOICE_BUCKET).remove([path])

    if (error) {
      console.error('Error deleting invoice PDF:', error)
      return { success: false, error }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error('Error in deleteInvoicePdf function:', error)
    return { success: false, error: error as Error }
  }
} 