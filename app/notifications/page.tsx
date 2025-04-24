import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Plus, Trash, Upload } from "lucide-react"

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">الإشعارات</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            تحميل الإشعارات
          </Button>
          <Button size="sm" variant="outline">
            <Check className="mr-2 h-4 w-4" />
            تحديد الكل كمقروء
          </Button>
          <Button size="sm" variant="destructive">
            <Trash className="mr-2 h-4 w-4" />
            حذف المحددة
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            إنشاء إشعار
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="rounded-full">
          دعوات
        </Badge>
        <Badge variant="outline" className="rounded-full">
          أحداث
        </Badge>
        <Badge variant="outline" className="rounded-full">
          جلسات
        </Badge>
        <Badge variant="outline" className="rounded-full">
          مقروءة
        </Badge>
        <Badge variant="outline" className="rounded-full">
          غير مقروءة
        </Badge>
        <Badge variant="secondary" className="rounded-full">
          الكل
        </Badge>
        <Badge variant="secondary" className="rounded-full">
          الحالة
        </Badge>
      </div>

      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    </div>
  )
}
