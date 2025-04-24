import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function getRecentActivities(limit = 5) {
  const supabase = createServerComponentClient({ cookies })

  try {
    // تصحيح استعلام SQL للحصول على الأنشطة الأخيرة
    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching recent activities:", error)
      return []
    }

    // إذا كنت بحاجة إلى معلومات المستخدم، يمكنك إجراء استعلام منفصل
    // أو تعديل هيكل قاعدة البيانات لتخزين معلومات إضافية في جدول الأنشطة

    return data
  } catch (error) {
    console.error("Error fetching recent activities:", error)
    return []
  }
}

export async function logActivity(
  userId: string,
  activityType: string,
  description: string,
  entityType?: string,
  entityId?: string,
) {
  try {
    const supabase = createServerActionClient({ cookies })

    const { error } = await supabase.from("activities").insert({
      user_id: userId,
      activity_type: activityType,
      description,
      entity_type: entityType,
      entity_id: entityId,
    })

    if (error) {
      console.error("Error logging activity:", error)
    }
  } catch (error) {
    console.error("Error logging activity:", error)
  }
}
