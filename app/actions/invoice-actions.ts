"use server"

import { createClient } from "@/lib/supabase-server"
import { getCurrentUser } from "@/lib/supabase-server"
import { logActivity } from "@/lib/services/activity-service"
import { revalidatePath } from "next/cache"

type InvoiceItem = {
  description: string
  quantity: number
  unit_price: number
  total: number
}

export type InvoiceFormData = {
  client_id: string
  invoice_number: string
  invoice_date: string
  due_date: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  notes?: string
  items: InvoiceItem[]
  status: "draft" | "sent" | "paid" | "overdue"
}

export type InvoiceFormState = {
  error?: string
  success?: boolean
  invoiceId?: string
}

/**
 * Create or update an invoice
 */
export async function createInvoice(prevState: InvoiceFormState, formData: FormData | any): Promise<InvoiceFormState> {
  try {
    // Check authentication
    const { user, error: authError } = await getCurrentUser()
    
    if (authError || !user) {
      return {
        error: "يجب تسجيل الدخول لإنشاء فاتورة جديدة"
      }
    }
    
    // Helper function to safely get values from formData
    const getValue = (key: string): string => {
      if (formData instanceof FormData) {
        return formData.get(key) as string;
      } else if (typeof formData === 'object' && formData !== null) {
        return formData[key];
      }
      return '';
    };
    
    // Check if we're updating an existing invoice
    const invoiceId = getValue("invoice_id");
    const isUpdate = !!invoiceId
    
    // Extract data from form
    const clientId = getValue("client_id");
    const invoiceNumber = getValue("invoice_number");
    const invoiceDate = getValue("issue_date");
    const dueDate = getValue("due_date");
    const notes = getValue("notes");
    
    // Financial data - mapping from form fields to database fields
    const taxRate = parseFloat(getValue("tax_rate"));
    const amount = parseFloat(getValue("subtotal"));        // Form uses "subtotal", DB uses "amount"
    const taxAmount = parseFloat(getValue("tax_amount"));
    const totalAmount = parseFloat(getValue("total"));      // Form uses "total", DB uses "total_amount"
    
    // Validate required fields
    if (!clientId || !invoiceNumber || !invoiceDate || !dueDate) {
      return {
        error: "جميع الحقول المطلوبة يجب ملؤها"
      }
    }
    
    // Get items from JSON string
    const itemsJson = getValue("items");
    let items: InvoiceItem[] = []
    
    try {
      items = JSON.parse(itemsJson)
    } catch (error) {
      return {
        error: "حدث خطأ في معالجة بيانات الخدمات"
      }
    }
    
    if (items.length === 0) {
      return {
        error: "يجب إضافة خدمة واحدة على الأقل"
      }
    }
    
    // Initialize Supabase client
    const supabase = await createClient()
    
    // Invoice data object to insert/update - matching exact database schema
    const invoiceData = {
      client_id: clientId,
      invoice_number: invoiceNumber,
      issue_date: invoiceDate,
      due_date: dueDate,
      amount: amount,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      notes: notes || null,
      status: isUpdate ? undefined : "draft", // Only set status for new invoices
      updated_at: new Date().toISOString(),
      updated_by: user.id
    }
    
    let resultInvoiceId = invoiceId
    
    if (isUpdate) {
      // Update existing invoice
      console.log("Updating invoice:", invoiceId, "with data:", invoiceData)
      
      const { error: updateError } = await supabase
        .from("invoices")
        .update(invoiceData)
        .eq("id", invoiceId)
      
      if (updateError) {
        console.error("Error updating invoice:", updateError)
        return {
          error: "فشل في تحديث الفاتورة"
        }
      }
      
      // Delete existing items to replace with new ones
      const { error: deleteItemsError } = await supabase
        .from("invoice_items")
        .delete()
        .eq("invoice_id", invoiceId)
      
      if (deleteItemsError) {
        console.error("Error deleting invoice items:", deleteItemsError)
        return {
          error: "فشل في تحديث خدمات الفاتورة"
        }
      }
    } else {
      // Create new invoice
      console.log("Creating invoice with data:", {
        ...invoiceData,
        status: "draft",
        created_by: user.id,
        created_at: new Date().toISOString()
      })
      
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          ...invoiceData,
          status: "draft",
          created_by: user.id,
          created_at: new Date().toISOString()
        })
        .select("id")
        .single()
      
      if (invoiceError) {
        console.error("Error creating invoice:", invoiceError)
        return {
          error: "فشل في إنشاء الفاتورة"
        }
      }
      
      resultInvoiceId = invoice.id
    }

    // Create invoice items - matching exact database schema
    const invoiceItems = items.map(item => ({
      invoice_id: resultInvoiceId,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      amount: item.total, // Using the total from the item as the amount in the database
      created_at: new Date().toISOString()
    }))
    
    const { error: itemsError } = await supabase
      .from("invoice_items")
      .insert(invoiceItems)
    
    if (itemsError) {
      console.error("Error creating invoice items:", itemsError)
      if (!isUpdate) {
        // Only attempt to delete the invoice if it's a new one
        await supabase.from("invoices").delete().eq("id", resultInvoiceId)
      }
      return {
        error: "فشل في إضافة الخدمات للفاتورة"
      }
    }
    
    // Log activity
    try {
      await logActivity(
        user.id,
        isUpdate ? "update" : "create",
        isUpdate 
          ? `تم تحديث الفاتورة رقم ${invoiceNumber}`
          : `تم إنشاء فاتورة جديدة برقم ${invoiceNumber}`,
        "invoice",
        resultInvoiceId
      )
    } catch (error) {
      console.error("Error logging activity:", error)
    }
    
    // Revalidate related paths
    revalidatePath("/invoices")
    revalidatePath("/invoices/list")
    revalidatePath(`/clients/${clientId}`)
    if (isUpdate) {
      revalidatePath(`/invoices/${invoiceId}`)
    }
    
    return {
      success: true,
      invoiceId: resultInvoiceId
    }
  } catch (error) {
    console.error("Unexpected error in createInvoice:", error)
    return {
      error: "حدث خطأ غير متوقع"
    }
  }
}

/**
 * Get invoice by ID
 */
export async function getInvoiceById(id: string) {
  try {
    const supabase = await createClient()
    
    // Get the invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select(`
        *,
        clients (
          id,
          first_name,
          last_name,
          company_name,
          email,
          phone
        )
      `)
      .eq("id", id)
      .single()
    
    if (invoiceError) {
      console.error("Error fetching invoice:", invoiceError)
      return { error: "فشل في جلب بيانات الفاتورة" }
    }
    
    // Get invoice items
    const { data: items, error: itemsError } = await supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", id)
      .order("created_at", { ascending: true })
    
    if (itemsError) {
      console.error("Error fetching invoice items:", itemsError)
      return { error: "فشل في جلب خدمات الفاتورة" }
    }
    
    return {
      invoice: {
        ...invoice,
        items: items || []
      }
    }
  } catch (error) {
    console.error("Unexpected error in getInvoiceById:", error)
    return { error: "حدث خطأ غير متوقع" }
  }
}

/**
 * Update invoice status
 */
export async function updateInvoiceStatus(id: string, status: string) {
  try {
    const { user, error: authError } = await getCurrentUser()
    
    if (authError || !user) {
      return { error: "يجب تسجيل الدخول لتحديث حالة الفاتورة" }
    }
    
    const supabase = await createClient()
    
    const { error } = await supabase
      .from("invoices")
      .update({
        status,
        updated_at: new Date().toISOString(),
        updated_by: user.id
      })
      .eq("id", id)
    
    if (error) {
      console.error("Error updating invoice status:", error)
      return { error: "فشل في تحديث حالة الفاتورة" }
    }
    
    // Log activity
    try {
      await logActivity(
        user.id,
        "update",
        `تم تحديث حالة الفاتورة إلى ${status}`,
        "invoice",
        id
      )
    } catch (error) {
      console.error("Error logging activity:", error)
    }
    
    revalidatePath("/invoices")
    revalidatePath(`/invoices/${id}`)
    
    return { success: true }
  } catch (error) {
    console.error("Unexpected error in updateInvoiceStatus:", error)
    return { error: "حدث خطأ غير متوقع" }
  }
}

/**
 * Update invoice with PDF URL
 */
export async function updateInvoicePdfUrl(id: string, pdfUrl: string) {
  try {
    const { user, error: authError } = await getCurrentUser()
    
    if (authError || !user) {
      return { error: "يجب تسجيل الدخول لتحديث الفاتورة" }
    }
    
    const supabase = await createClient()
    
    const { error } = await supabase
      .from("invoices")
      .update({
        pdf_url: pdfUrl,
        updated_at: new Date().toISOString(),
        updated_by: user.id
      })
      .eq("id", id)
    
    if (error) {
      console.error("Error updating invoice with PDF URL:", error)
      return { error: "فشل في تحديث الفاتورة برابط PDF" }
    }
    
    // Log activity
    try {
      await logActivity(
        user.id,
        "update",
        `تم إضافة ملف PDF للفاتورة`,
        "invoice",
        id
      )
    } catch (error) {
      console.error("Error logging activity:", error)
    }
    
    revalidatePath("/invoices")
    revalidatePath(`/invoices/${id}`)
    
    return { success: true }
  } catch (error) {
    console.error("Unexpected error in updateInvoicePdfUrl:", error)
    return { error: "حدث خطأ غير متوقع" }
  }
}

/**
 * Delete an invoice and its related items
 */
export async function deleteInvoice(id: string) {
  try {
    const { user, error: authError } = await getCurrentUser()
    
    if (authError || !user) {
      return { error: "يجب تسجيل الدخول لحذف الفاتورة" }
    }
    
    const supabase = await createClient()
    
    // First, delete related invoice items
    const { error: itemsError } = await supabase
      .from("invoice_items")
      .delete()
      .eq("invoice_id", id)
    
    if (itemsError) {
      console.error("Error deleting invoice items:", itemsError)
      return { error: "فشل في حذف خدمات الفاتورة" }
    }
    
    // Then delete the invoice
    const { error } = await supabase
      .from("invoices")
      .delete()
      .eq("id", id)
    
    if (error) {
      console.error("Error deleting invoice:", error)
      return { error: "فشل في حذف الفاتورة" }
    }
    
    // Log activity
    try {
      await logActivity(
        user.id,
        "delete",
        `تم حذف الفاتورة`,
        "invoice",
        id
      )
    } catch (error) {
      console.error("Error logging activity:", error)
    }
    
    revalidatePath("/invoices")
    revalidatePath("/invoices/list")
    
    return { success: true }
  } catch (error) {
    console.error("Unexpected error in deleteInvoice:", error)
    return { error: "حدث خطأ غير متوقع" }
  }
} 