import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, Send } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function NewNotificationPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-right">إنشاء إشعار جديد</h1>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>استخدم هذه الصفحة لإنشاء إشعار يدوي جديد.</AlertTitle>
        <AlertDescription>يمكنك تحديد نوع الإشعار ومحتواه.</AlertDescription>
      </Alert>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label>نوع الإشعار</Label>
            <div className="rounded-md border px-3 py-2 text-sm">رسالة نظام</div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notification-title">عنوان الإشعار *</Label>
            <Input id="notification-title" placeholder="أدخل عنوان الإشعار" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notification-content">محتوى الإشعار *</Label>
            <Textarea id="notification-content" placeholder="أدخل محتوى الإشعار" rows={5} />
          </div>

          <div className="space-y-2">
            <Label>بيانات إضافية</Label>
            <div className="space-y-2">
              <Label htmlFor="link" className="text-sm font-normal">
                رابط (اختياري)
              </Label>
              <Input id="link" placeholder="أدخل رابطاً إذا كان هناك" />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button>
              <Send className="mr-2 h-4 w-4" />
              إرسال الإشعار
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
