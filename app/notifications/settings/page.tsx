import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Play } from "lucide-react"

export default function NotificationsSettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-right">إعدادات الإشعارات</h1>

      <div className="text-right text-muted-foreground mb-8">
        قم بتخصيص إعدادات الإشعارات حسب تفضيلاتك. يمكنك تحديد نوع التنبيه وتوقيت الإشعارات لكل نوع من أنواع الإشعارات.
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">إعدادات صوت الإشعارات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>اختبار صوت الإشعارات</Label>
            <Button variant="ghost" size="icon">
              <Play className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>الصوت:</Label>
              <span className="text-sm">50%</span>
            </div>
            <Slider defaultValue={[50]} max={100} step={1} />
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground mb-6 text-right">
            قم بتخصيص إعدادات الإشعارات حسب تفضيلاتك. يمكنك تحديد نوع التنبيه وتوقيت الإشعارات لكل نوع من أنواع
            الإشعارات.
          </div>

          <div className="space-y-8">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium">تذكير بجلسات المحكمة</h3>
                <div className="flex flex-col gap-2 mt-4">
                  <p className="text-sm text-muted-foreground">توقيت الإشعارات:</p>
                  <div className="flex items-center gap-2">
                    <Checkbox id="court-today" />
                    <Label htmlFor="court-today" className="text-sm font-normal">
                      فوراً
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="court-daily" />
                    <Label htmlFor="court-daily" className="text-sm font-normal">
                      قبل بيوم
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="court-weekly" defaultChecked />
                    <Label htmlFor="court-weekly" className="text-sm font-normal">
                      قبل بأسبوع
                    </Label>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">طرق التنبيه:</p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Checkbox id="court-email" defaultChecked />
                    <Label htmlFor="court-email" className="text-sm font-normal">
                      البريد الإلكتروني
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="court-app" defaultChecked />
                    <Label htmlFor="court-app" className="text-sm font-normal">
                      داخل التطبيق
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="court-sms" />
                    <Label htmlFor="court-sms" className="text-sm font-normal">
                      (SMS) الرسائل النصية
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="court-push" />
                    <Label htmlFor="court-push" className="text-sm font-normal">
                      إشعارات الدفع
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium">تذكير بأحداث التقويم</h3>
                <div className="flex flex-col gap-2 mt-4">
                  <p className="text-sm text-muted-foreground">توقيت الإشعارات:</p>
                  <div className="flex items-center gap-2">
                    <Checkbox id="calendar-today" defaultChecked />
                    <Label htmlFor="calendar-today" className="text-sm font-normal">
                      فوراً
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="calendar-daily" />
                    <Label htmlFor="calendar-daily" className="text-sm font-normal">
                      قبل بيوم
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="calendar-weekly" />
                    <Label htmlFor="calendar-weekly" className="text-sm font-normal">
                      قبل بأسبوع
                    </Label>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">طرق التنبيه:</p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Checkbox id="calendar-email" defaultChecked />
                    <Label htmlFor="calendar-email" className="text-sm font-normal">
                      البريد الإلكتروني
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="calendar-app" defaultChecked />
                    <Label htmlFor="calendar-app" className="text-sm font-normal">
                      داخل التطبيق
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="calendar-sms" />
                    <Label htmlFor="calendar-sms" className="text-sm font-normal">
                      (SMS) الرسائل النصية
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="calendar-push" />
                    <Label htmlFor="calendar-push" className="text-sm font-normal">
                      إشعارات الدفع
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium">تذكير بالدفعات المستحقة</h3>
                <div className="flex flex-col gap-2 mt-4">
                  <p className="text-sm text-muted-foreground">توقيت الإشعارات:</p>
                  <div className="flex items-center gap-2">
                    <Checkbox id="payment-today" defaultChecked />
                    <Label htmlFor="payment-today" className="text-sm font-normal">
                      فوراً
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="payment-daily" />
                    <Label htmlFor="payment-daily" className="text-sm font-normal">
                      قبل بيوم
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="payment-weekly" />
                    <Label htmlFor="payment-weekly" className="text-sm font-normal">
                      قبل بأسبوع
                    </Label>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">طرق التنبيه:</p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Checkbox id="payment-email" defaultChecked />
                    <Label htmlFor="payment-email" className="text-sm font-normal">
                      البريد الإلكتروني
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="payment-app" defaultChecked />
                    <Label htmlFor="payment-app" className="text-sm font-normal">
                      داخل التطبيق
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="payment-sms" />
                    <Label htmlFor="payment-sms" className="text-sm font-normal">
                      (SMS) الرسائل النصية
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="payment-push" />
                    <Label htmlFor="payment-push" className="text-sm font-normal">
                      إشعارات الدفع
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-8">
            <Button variant="outline">إعادة تعيين</Button>
            <Button>حفظ الإعدادات</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
