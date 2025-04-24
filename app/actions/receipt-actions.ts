"use server"

import { createClient } from "@/lib/supabase-server"
import { getCurrentUser } from "@/lib/supabase-server"
import { logActivity } from "@/lib/services/activity-service"
import { revalidatePath } from "next/cache"
import { deleteFile } from "@/lib/supabase-file-upload"

// Types
export type ReceiptFormData = {
  title: string
  amount: number
  category: string
  date: string
  payment_method: string
  status: string
  reference_number?: string
  case_id?: string
  vendor?: string
  notes?: string
  file_path: string
}

export type ReceiptFormState = {
  error?: string
  success?: boolean
  receiptId?: string
}

/**
 * Create a new receipt
 */
export async function createReceipt(prevState: ReceiptFormState, formData: FormData | any): Promise<ReceiptFormState> {
  try {
    // Check authentication
    const { user, error: authError } = await getCurrentUser()
    
    if (authError || !user) {
      return {
        error: "يجب تسجيل الدخول لإضافة إيصال جديد"
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
    
    // Extract data from form
    const title = getValue("title");
    const amount = parseFloat(getValue("amount"));
    const category = getValue("category");
    const date = getValue("date");
    const paymentMethod = getValue("payment_method");
    const status = getValue("status");
    const referenceNumber = getValue("reference_number") || null;
    const caseId = getValue("case_id") || null;
    const vendor = getValue("vendor") || null;
    const notes = getValue("notes") || null;
    const filePath = getValue("file_path");
    
    // Validate required fields
    if (!title || isNaN(amount) || !category || !date || !paymentMethod || !status || !filePath) {
      return {
        error: "جميع الحقول المطلوبة يجب ملؤها"
      }
    }
    
    // Initialize Supabase client
    const supabase = await createClient()
    
    // Receipt data object to insert
    const receiptData = {
      title,
      amount,
      category,
      date,
      payment_method: paymentMethod,
      status,
      reference_number: referenceNumber,
      case_id: caseId,
      vendor,
      notes,
      file_path: filePath,
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updated_by: user.id
    }
    
    // Insert receipt data
    const { data: receipt, error } = await supabase
      .from("receipts")
      .insert(receiptData)
      .select("id")
      .single()
    
    if (error) {
      console.error("Error creating receipt:", error)
      return {
        error: "فشل في إضافة الإيصال"
      }
    }
    
    // Log activity
    try {
      await logActivity(
        user.id,
        "create",
        `تم إضافة إيصال جديد: ${title}`,
        "receipt",
        receipt.id
      )
    } catch (error) {
      console.error("Error logging activity:", error)
    }
    
    // Revalidate related paths
    revalidatePath("/receipts")
    revalidatePath("/receipts/list")
    if (caseId) {
      revalidatePath(`/cases/${caseId}`)
    }
    
    return {
      success: true,
      receiptId: receipt.id
    }
  } catch (error) {
    console.error("Unexpected error in createReceipt:", error)
    return {
      error: "حدث خطأ غير متوقع"
    }
  }
}

/**
 * Get receipt by ID
 */
export async function getReceiptById(id: string) {
  try {
    const supabase = await createClient()
    
    // Get the receipt
    const { data: receipt, error } = await supabase
      .from("receipts")
      .select(`
        *,
        cases (
          id,
          title,
          case_number
        )
      `)
      .eq("id", id)
      .single()
    
    if (error) {
      console.error("Error fetching receipt:", error)
      return { error: "فشل في جلب بيانات الإيصال" }
    }
    
    return { receipt }
  } catch (error) {
    console.error("Unexpected error in getReceiptById:", error)
    return { error: "حدث خطأ غير متوقع" }
  }
}

/**
 * Update receipt status
 */
export async function updateReceiptStatus(id: string, status: string) {
  try {
    const { user, error: authError } = await getCurrentUser()
    
    if (authError || !user) {
      return { error: "يجب تسجيل الدخول لتحديث حالة الإيصال" }
    }
    
    const supabase = await createClient()
    
    const { error } = await supabase
      .from("receipts")
      .update({
        status,
        updated_at: new Date().toISOString(),
        updated_by: user.id
      })
      .eq("id", id)
    
    if (error) {
      console.error("Error updating receipt status:", error)
      return { error: "فشل في تحديث حالة الإيصال" }
    }
    
    // Log activity
    try {
      await logActivity(
        user.id,
        "update",
        `تم تحديث حالة الإيصال إلى ${status}`,
        "receipt",
        id
      )
    } catch (error) {
      console.error("Error logging activity:", error)
    }
    
    revalidatePath("/receipts")
    revalidatePath("/receipts/list")
    revalidatePath(`/receipts/${id}`)
    
    return { success: true }
  } catch (error) {
    console.error("Unexpected error in updateReceiptStatus:", error)
    return { error: "حدث خطأ غير متوقع" }
  }
}

/**
 * Delete a receipt and its file
 */
export async function deleteReceipt(id: string) {
  try {
    const { user, error: authError } = await getCurrentUser()
    
    if (authError || !user) {
      return { error: "يجب تسجيل الدخول لحذف الإيصال" }
    }
    
    const supabase = await createClient()
    
    // Get receipt file path first
    const { data: receipt, error: fetchError } = await supabase
      .from("receipts")
      .select("file_path, case_id")
      .eq("id", id)
      .single()
    
    if (fetchError) {
      console.error("Error fetching receipt for deletion:", fetchError)
      return { error: "فشل في العثور على الإيصال" }
    }
    
    // Delete the receipt
    const { error } = await supabase
      .from("receipts")
      .delete()
      .eq("id", id)
    
    if (error) {
      console.error("Error deleting receipt:", error)
      return { error: "فشل في حذف الإيصال" }
    }
    
    // Delete associated file
    if (receipt?.file_path) {
      try {
        await deleteFile(receipt.file_path, 'receipts')
      } catch (fileError) {
        console.error("Error deleting receipt file:", fileError)
        // Continue even if file deletion fails
      }
    }
    
    // Log activity
    try {
      await logActivity(
        user.id,
        "delete",
        `تم حذف الإيصال`,
        "receipt",
        id
      )
    } catch (error) {
      console.error("Error logging activity:", error)
    }
    
    revalidatePath("/receipts")
    revalidatePath("/receipts/list")
    if (receipt?.case_id) {
      revalidatePath(`/cases/${receipt.case_id}`)
    }
    
    return { success: true }
  } catch (error) {
    console.error("Unexpected error in deleteReceipt:", error)
    return { error: "حدث خطأ غير متوقع" }
  }
} 