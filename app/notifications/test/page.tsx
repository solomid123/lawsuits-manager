import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, Calendar, CreditCard } from "lucide-react"

export default function NotificationsTestPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-right">اختبار الإشعارات</h1>

      <div className="text-right text-muted-foreground mb-8">
        استخدم هذه الصفحة لاختبار نظام الإشعارات ومعرفة ما إذا كانت الإشعارات تعمل بشكل صحيح. يمكنك إرسال إشعارات
        تجريبية لمختلف أنواع الأحداث، والتحقق من وصولها إلى المستخدمين.
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-500" />
              جلسات المحكمة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">إرسال إشعارات للجلسات القادمة</p>
            <Button className="w-full">إرسال إشعار</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-500" />
              أحداث التقويم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">إرسال إشعارات لأحداث التقويم القادمة</p>
            <Button className="w-full">إرسال إشعار</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-red-500" />
              دفعات مستحقة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">إرسال إشعارات للدفعات المستحقة</p>
            <Button className="w-full">إرسال إشعار</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5 text-purple-500" />
              تجهيز التذكيرات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">إرسال تذكيرات للأحداث القادمة</p>
            <Button className="w-full">إرسال تذكير</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              تذكيرات التقويم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">إرسال تذكيرات لأحداث التقويم</p>
            <Button className="w-full">إرسال تذكير</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
