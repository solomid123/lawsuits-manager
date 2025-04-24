"use server"

import { cookies } from "next/headers"
import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { redirect } from "next/navigation"
import { logActivity } from "@/lib/services/activity-service"

// Define type for client form data
type ClientFormData = {
  clientType: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationalId: string;
  address: string;
  city: string;
  postalCode: string;
  notes: string;
  companyName?: string;
}

export async function addClient(prevState: any, formData: FormData) {
  // Extract the form data
  const clientType = formData.get("client-type") as string
  const firstName = formData.get("first-name") as string
  const lastName = formData.get("last-name") as string
  const email = formData.get("email") as string
  const phone = formData.get("phone") as string
  const nationalId = formData.get("national-id") as string
  const address = formData.get("address") as string
  const city = formData.get("city") as string
  const postalCode = formData.get("postal-code") as string
  const notes = formData.get("notes") as string
  const companyName = clientType === "company" ? formData.get("company-name") as string : null

  // Validate required fields
  if (!firstName || !lastName) {
    return {
      error: "الاسم الأول واسم العائلة مطلوبان"
    }
  }

  // Validate client type
  if (!clientType) {
    return {
      error: "نوع العميل مطلوب"
    }
  }

  // Create Supabase client
  try {
    const cookieStore = cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return {
        error: "يجب تسجيل الدخول لإضافة عميل"
      }
    }

    // Insert the client into the database
    const { data, error } = await supabase.from("clients").insert({
      client_type: clientType,
      first_name: firstName,
      last_name: lastName,
      email: email || null,
      phone: phone || null,
      address: address || null,
      company_name: companyName || null,
      notes: notes || null,
      city: city || null,
      postal_code: postalCode || null,
      national_id: nationalId || null
    }).select()

    if (error) {
      console.error("Error adding client:", error)
      return {
        error: `خطأ في قاعدة البيانات: ${error.message}`
      }
    }

    // Log the activity
    if (data && data[0]) {
      try {
        await logActivity(
          user.id,
          "create",
          `تمت إضافة عميل جديد: ${firstName} ${lastName}`,
          "client",
          data[0].id
        )
      } catch (error) {
        console.error("Error logging activity:", error)
        // Continue even if logging fails
      }

      // Return success, let the client handle redirect
      return { success: true, clientId: data[0].id };
    } else {
      return { 
        error: "تم إنشاء العميل، ولكن لم يتم استرجاع البيانات" 
      }
    }
  } catch (error: any) {
    console.error("Error:", error)
    return {
      error: "حدث خطأ أثناء إضافة العميل. الرجاء المحاولة مرة أخرى." + (error?.message ? `: ${error.message}` : "")
    }
  }
}

export async function updateClient(prevState: any, formData: FormData) {
  // Extract client ID and data
  const clientId = formData.get("client-id") as string
  const clientType = formData.get("client-type") as string
  const firstName = formData.get("first-name") as string
  const lastName = formData.get("last-name") as string
  const email = formData.get("email") as string
  const phone = formData.get("phone") as string
  const nationalId = formData.get("national-id") as string
  const address = formData.get("address") as string
  const city = formData.get("city") as string
  const postalCode = formData.get("postal-code") as string
  const notes = formData.get("notes") as string
  const companyName = clientType === "company" ? formData.get("company-name") as string : null

  // Validate required fields
  if (!clientId) {
    return {
      error: "معرف العميل مطلوب"
    }
  }

  if (!firstName || !lastName) {
    return {
      error: "الاسم الأول واسم العائلة مطلوبان"
    }
  }

  if (!clientType) {
    return {
      error: "نوع العميل مطلوب"
    }
  }

  try {
    const cookieStore = cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return {
        error: "يجب تسجيل الدخول لتحديث بيانات العميل"
      }
    }

    // Update client data
    const { data, error } = await supabase
      .from("clients")
      .update({
        client_type: clientType,
        first_name: firstName,
        last_name: lastName,
        email: email || null,
        phone: phone || null,
        address: address || null,
        company_name: companyName || null,
        notes: notes || null,
        city: city || null,
        postal_code: postalCode || null,
        national_id: nationalId || null
      })
      .eq("id", clientId)
      .select();

    if (error) {
      console.error("Error updating client:", error)
      return {
        error: `خطأ في قاعدة البيانات: ${error.message}`
      }
    }

    // Log the activity
    try {
      await logActivity(
        user.id,
        "update",
        `تم تحديث بيانات العميل: ${firstName} ${lastName}`,
        "client",
        clientId
      )
    } catch (error) {
      console.error("Error logging activity:", error)
      // Continue even if logging fails
    }

    return { success: true, clientId };

  } catch (error: any) {
    console.error("Error:", error)
    return {
      error: "حدث خطأ أثناء تحديث بيانات العميل. الرجاء المحاولة مرة أخرى." + (error?.message ? `: ${error.message}` : "")
    }
  }
}

export async function deleteClient(prevState: any, formData: FormData) {
  const clientId = formData.get("client-id") as string;
  
  if (!clientId) {
    return {
      error: "معرف العميل مطلوب"
    }
  }

  try {
    const cookieStore = cookies()
    const supabase = createServerActionClient({ cookies: () => cookieStore })

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return {
        error: "يجب تسجيل الدخول لحذف العميل"
      }
    }

    // Get client data before deletion for activity log
    const { data: clientData } = await supabase
      .from("clients")
      .select("first_name, last_name")
      .eq("id", clientId)
      .single();

    // Delete the client
    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", clientId);

    if (error) {
      console.error("Error deleting client:", error)
      return {
        error: `خطأ في قاعدة البيانات: ${error.message}`
      }
    }

    // Log the activity
    if (clientData) {
      try {
        await logActivity(
          user.id,
          "delete",
          `تم حذف العميل: ${clientData.first_name} ${clientData.last_name}`,
          "client",
          clientId
        )
      } catch (error) {
        console.error("Error logging activity:", error)
        // Continue even if logging fails
      }
    }

    return { success: true };

  } catch (error: any) {
    console.error("Error:", error)
    return {
      error: "حدث خطأ أثناء حذف العميل. الرجاء المحاولة مرة أخرى." + (error?.message ? `: ${error.message}` : "")
    }
  }
} 