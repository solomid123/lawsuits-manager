"use server"

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { logActivity } from "../../lib/activity-logger"

type ActionState = {
  errors?: {
    case_id?: string[];
    session_date?: string[];
    session_time?: string[];
    location?: string[];
    _form?: string[];
  };
  message?: string | null;
  success?: boolean;
};

function validateSessionData(data: FormData, isUpdate = false): ActionState {
  const errors: ActionState['errors'] = {};
  
  // Only require case_id if not an update
  if (!isUpdate && !data.get('case-id')) {
    errors.case_id = ['يجب اختيار القضية'];
  }
  
  if (!data.get('session-date')) {
    errors.session_date = ['تاريخ الجلسة مطلوب'];
  }
  
  // Uncomment now that the session_time column exists in the database
  if (!data.get('session-time')) {
    errors.session_time = ['وقت الجلسة مطلوب'];
  }
  
  if (!data.get('location')) {
    errors.location = ['مكان الجلسة مطلوب'];
  }
  
  return Object.keys(errors).length > 0 ? { errors } : { success: true };
}

/**
 * Updates the next_session_date for a case based on court sessions
 */
async function updateNextSessionDate(caseId: string, supabase: any) {
  try {
    // Get the current date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find the earliest future session for this case
    const { data: sessions, error } = await supabase
      .from('court_sessions')
      .select('session_date')
      .eq('case_id', caseId)
      .gte('session_date', today.toISOString())
      .order('session_date', { ascending: true })
      .limit(1);
      
    if (error) {
      console.error('Error fetching future sessions:', error);
      return;
    }
    
    // Update the case's next_session_date
    const nextDate = sessions && sessions.length > 0 ? sessions[0].session_date : null;
    const { error: updateError } = await supabase
      .from('cases')
      .update({ 
        next_session_date: nextDate,
        updated_at: new Date().toISOString()
      })
      .eq('id', caseId);
      
    if (updateError) {
      console.error('Error updating next session date:', updateError);
    }
  } catch (error) {
    console.error('Error in updateNextSessionDate:', error);
  }
}

/**
 * Add a new court session
 */
export async function addCourtSession(formData: FormData): Promise<ActionState> {
  const supabase = createServerComponentClient({ cookies })
  
  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return {
      errors: {
        _form: ['يجب تسجيل الدخول لإضافة جلسة محكمة']
      }
    }
  }
  
  // Validate the form data
  const validation = validateSessionData(formData)
  if (!validation.success) {
    return validation
  }
  
  // Extract data from the form
  const caseId = formData.get('case-id') as string
  const sessionDate = formData.get('session-date') as string
  const sessionTime = formData.get('session-time') as string
  const location = formData.get('location') as string
  const notes = formData.get('notes') as string || ''
  const sessionType = formData.get('session-type') as string || 'regular'
  
  try {
    // Insert the court session
    const { data: sessionData, error } = await supabase
      .from('court_sessions')
      .insert({
        case_id: caseId,
        session_date: sessionDate,
        session_time: sessionTime,
        session_type: sessionType,
        location: location,
        notes: notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) {
      return {
        errors: {
          _form: ['فشل في إضافة جلسة المحكمة: ' + error.message]
        }
      }
    }
    
    // Update the next session date in the cases table
    await updateNextSessionDate(caseId, supabase);
    
    // Log the activity
    await logActivity({
      action: 'create',
      entity_type: 'court_session',
      entity_id: sessionData.id,
      description: `تمت إضافة جلسة محكمة جديدة للقضية ${caseId}`,
      user_id: session.user.id,
      metadata: {
        session_date: sessionDate,
        session_time: sessionTime,
        location: location
      }
    })
    
    // Revalidate related paths
    revalidatePath(`/cases/${caseId}`)
    revalidatePath(`/cases/${caseId}/sessions`)
    revalidatePath(`/cases`) // Also revalidate the cases list page
    
    return {
      success: true,
      message: 'تمت إضافة جلسة المحكمة بنجاح'
    }
  } catch (error) {
    console.error('Error adding court session:', error)
    return {
      errors: {
        _form: ['حدث خطأ غير متوقع أثناء إضافة جلسة المحكمة']
      }
    }
  }
}

/**
 * Update an existing court session
 */
export async function updateCourtSession(formData: FormData): Promise<ActionState> {
  const supabase = createServerComponentClient({ cookies })
  
  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return {
      errors: {
        _form: ['يجب تسجيل الدخول لتحديث جلسة المحكمة']
      }
    }
  }
  
  // Validate the form data
  const validation = validateSessionData(formData, true)
  if (!validation.success) {
    return validation
  }
  
  // Extract data from the form
  const sessionId = formData.get('session-id') as string
  const caseId = formData.get('case-id') as string
  const sessionDate = formData.get('session-date') as string
  const sessionTime = formData.get('session-time') as string
  const location = formData.get('location') as string
  const notes = formData.get('notes') as string || ''
  const sessionType = formData.get('session-type') as string || 'regular'
  
  try {
    // Update the court session
    const { data: sessionData, error } = await supabase
      .from('court_sessions')
      .update({
        session_date: sessionDate,
        session_time: sessionTime,
        session_type: sessionType,
        location: location,
        notes: notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select()
      .single()
    
    if (error) {
      return {
        errors: {
          _form: ['فشل في تحديث جلسة المحكمة: ' + error.message]
        }
      }
    }
    
    // Update the next session date in the cases table
    await updateNextSessionDate(caseId, supabase);
    
    // Log the activity
    await logActivity({
      action: 'update',
      entity_type: 'court_session',
      entity_id: sessionId,
      description: `تم تحديث جلسة المحكمة للقضية ${caseId}`,
      user_id: session.user.id,
      metadata: {
        session_date: sessionDate,
        session_time: sessionTime,
        location: location
      }
    })
    
    // Revalidate related paths
    revalidatePath(`/cases/${caseId}`)
    revalidatePath(`/cases/${caseId}/sessions`)
    revalidatePath(`/cases`) // Also revalidate the cases list page
    
    return {
      success: true,
      message: 'تم تحديث جلسة المحكمة بنجاح'
    }
  } catch (error) {
    console.error('Error updating court session:', error)
    return {
      errors: {
        _form: ['حدث خطأ غير متوقع أثناء تحديث جلسة المحكمة']
      }
    }
  }
}

/**
 * Delete a court session
 */
export async function deleteCourtSession(formData: FormData): Promise<ActionState> {
  const supabase = createServerComponentClient({ cookies })
  
  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return {
      errors: {
        _form: ['يجب تسجيل الدخول لحذف جلسة المحكمة']
      }
    }
  }
  
  // Extract data from the form
  const sessionId = formData.get('session-id') as string
  const caseId = formData.get('case-id') as string
  
  try {
    // Delete the court session
    const { error } = await supabase
      .from('court_sessions')
      .delete()
      .eq('id', sessionId)
    
    if (error) {
      return {
        errors: {
          _form: ['فشل في حذف جلسة المحكمة: ' + error.message]
        }
      }
    }
    
    // Update the next session date in the cases table after deletion
    await updateNextSessionDate(caseId, supabase);
    
    // Log the activity
    await logActivity({
      action: 'delete',
      entity_type: 'court_session',
      entity_id: sessionId,
      description: `تم حذف جلسة المحكمة للقضية ${caseId}`,
      user_id: session.user.id,
      metadata: {
        case_id: caseId
      }
    })
    
    // Revalidate related paths
    revalidatePath(`/cases/${caseId}`)
    revalidatePath(`/cases/${caseId}/sessions`)
    revalidatePath(`/cases`) // Also revalidate the cases list page
    
    return {
      success: true,
      message: 'تم حذف جلسة المحكمة بنجاح'
    }
  } catch (error) {
    console.error('Error deleting court session:', error)
    return {
      errors: {
        _form: ['حدث خطأ غير متوقع أثناء حذف جلسة المحكمة']
      }
    }
  }
} 