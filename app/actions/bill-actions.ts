"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { addActivity } from "./activity-actions"

export type BillFormState = {
  error?: string
  success?: boolean
}

export type BillData = {
  id?: string
  bill_date: string
  amount: string
  description: string
  bill_type: string
  vendor: string
  expense_category: string
  case_id: string
  file_path: string
  file_name: string
}

export async function createBill(data: BillData): Promise<BillFormState> {
  const session = await auth()
  
  if (!session?.user) {
    return { error: "يجب تسجيل الدخول لإضافة فاتورة" }
  }
  
  // Validate required fields
  if (!data.bill_date || !data.amount || !data.bill_type || !data.file_path) {
    return { 
      error: "يرجى ملء جميع الحقول المطلوبة وتحميل ملف الفاتورة" 
    }
  }
  
  const supabase = createClient()
  
  try {
    // Insert bill data
    const { data: billData, error } = await supabase
      .from("bills")
      .insert({
        bill_date: data.bill_date,
        amount: parseFloat(data.amount),
        description: data.description,
        bill_type: data.bill_type,
        vendor: data.vendor,
        expense_category: data.expense_category,
        case_id: data.case_id || null,
        file_path: data.file_path,
        file_name: data.file_name,
        created_by: session.user.id
      })
      .select()
      .single()
    
    if (error) throw error
    
    // Log activity
    await addActivity({
      action: "create",
      entity_type: "bill",
      entity_id: billData.id,
      description: `تمت إضافة فاتورة جديدة: ${data.bill_type} بمبلغ ${data.amount}`
    })
    
    // Revalidate the bills list page
    revalidatePath("/bills/list")
    
    return { success: true }
    
  } catch (error) {
    console.error("Error creating bill:", error)
    return { 
      error: error instanceof Error ? error.message : "حدث خطأ أثناء حفظ بيانات الفاتورة" 
    }
  }
}

export async function getBillById(id: string) {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase
      .from("bills")
      .select("*")
      .eq("id", id)
      .single()
    
    if (error) throw error
    
    return { data }
    
  } catch (error) {
    console.error("Error fetching bill:", error)
    return { 
      error: error instanceof Error ? error.message : "حدث خطأ أثناء استرجاع بيانات الفاتورة" 
    }
  }
}

export async function updateBill(id: string, data: Partial<BillData>): Promise<BillFormState> {
  const session = await auth()
  
  if (!session?.user) {
    return { error: "يجب تسجيل الدخول لتحديث الفاتورة" }
  }
  
  const supabase = createClient()
  
  try {
    // Update bill data
    const { error } = await supabase
      .from("bills")
      .update({
        bill_date: data.bill_date,
        amount: data.amount ? parseFloat(data.amount) : undefined,
        description: data.description,
        bill_type: data.bill_type,
        vendor: data.vendor,
        expense_category: data.expense_category,
        case_id: data.case_id || null,
        file_path: data.file_path,
        file_name: data.file_name,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
    
    if (error) throw error
    
    // Log activity
    await addActivity({
      action: "update",
      entity_type: "bill",
      entity_id: id,
      description: `تم تحديث بيانات الفاتورة: ${data.bill_type} بمبلغ ${data.amount}`
    })
    
    // Revalidate the bills list page
    revalidatePath("/bills/list")
    revalidatePath(`/bills/${id}`)
    
    return { success: true }
    
  } catch (error) {
    console.error("Error updating bill:", error)
    return { 
      error: error instanceof Error ? error.message : "حدث خطأ أثناء تحديث بيانات الفاتورة" 
    }
  }
}

export async function deleteBill(id: string): Promise<BillFormState> {
  const session = await auth()
  
  if (!session?.user) {
    return { error: "يجب تسجيل الدخول لحذف الفاتورة" }
  }
  
  const supabase = createClient()
  
  try {
    // Delete bill
    const { error } = await supabase
      .from("bills")
      .delete()
      .eq("id", id)
    
    if (error) throw error
    
    // Log activity
    await addActivity({
      action: "delete",
      entity_type: "bill",
      entity_id: id,
      description: "تم حذف الفاتورة"
    })
    
    // Revalidate the bills list page
    revalidatePath("/bills/list")
    
    return { success: true }
    
  } catch (error) {
    console.error("Error deleting bill:", error)
    return { 
      error: error instanceof Error ? error.message : "حدث خطأ أثناء حذف الفاتورة" 
    }
  }
} 