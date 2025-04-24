"use client"

import { useState } from "react"
import DashboardLayout from "../dashboard-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  
  const handleSave = (section: string) => {
    setLoading(true)
    
    // Simulate saving
    setTimeout(() => {
      setLoading(false)
      toast.success(`تم حفظ إعدادات ${section} بنجاح`)
    }, 1000)
  }
  
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col space-y-6">
          <div className="space-y-0.5">
            <h2 className="text-2xl font-bold tracking-tight">الإعدادات</h2>
            <p className="text-muted-foreground">
              قم بإدارة إعدادات حسابك والتطبيق
            </p>
          </div>
          
          <Separator className="my-6" />
          
          <Tabs defaultValue="profile" className="w-full space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="profile">
                الملف الشخصي
              </TabsTrigger>
              <TabsTrigger value="notifications">
                الإشعارات
              </TabsTrigger>
              <TabsTrigger value="appearance">
                المظهر
              </TabsTrigger>
              <TabsTrigger value="security">
                الأمان
              </TabsTrigger>
              <TabsTrigger value="advanced">
                متقدم
              </TabsTrigger>
            </TabsList>
            
            {/* Profile Settings */}
            <TabsContent value="profile" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>الملف الشخصي</CardTitle>
                  <CardDescription>
                    قم بتعديل معلومات الملف الشخصي الخاص بك
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">الاسم الأول</Label>
                      <Input id="firstName" placeholder="محمد" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">اسم العائلة</Label>
                      <Input id="lastName" placeholder="أحمد" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input id="email" type="email" placeholder="mail@example.com" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">رقم الهاتف</Label>
                    <Input id="phone" placeholder="05xxxxxxxx" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="role">الدور الوظيفي</Label>
                    <Select defaultValue="lawyer">
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الدور الوظيفي" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lawyer">محامي</SelectItem>
                        <SelectItem value="assistant">مساعد قانوني</SelectItem>
                        <SelectItem value="admin">مدير</SelectItem>
                        <SelectItem value="partner">شريك</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={() => handleSave("الملف الشخصي")} 
                    disabled={loading}
                  >
                    {loading ? "جاري الحفظ..." : "حفظ التغييرات"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Notification Settings */}
            <TabsContent value="notifications" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>إعدادات الإشعارات</CardTitle>
                  <CardDescription>
                    اختر الإشعارات التي ترغب في تلقيها
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="email_notifications">إشعارات البريد الإلكتروني</Label>
                        <p className="text-sm text-muted-foreground">
                          استلام إشعارات عبر البريد الإلكتروني
                        </p>
                      </div>
                      <Switch id="email_notifications" defaultChecked />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="push_notifications">إشعارات داخل التطبيق</Label>
                        <p className="text-sm text-muted-foreground">
                          استلام إشعارات داخل التطبيق
                        </p>
                      </div>
                      <Switch id="push_notifications" defaultChecked />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="case_updates">تحديثات القضايا</Label>
                        <p className="text-sm text-muted-foreground">
                          استلام إشعارات عند تحديث القضايا
                        </p>
                      </div>
                      <Switch id="case_updates" defaultChecked />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="session_reminders">تذكير بالجلسات</Label>
                        <p className="text-sm text-muted-foreground">
                          استلام تذكير قبل موعد الجلسات
                        </p>
                      </div>
                      <Switch id="session_reminders" defaultChecked />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="deadline_reminders">تذكير بالمواعيد النهائية</Label>
                        <p className="text-sm text-muted-foreground">
                          استلام تذكير بالمواعيد النهائية للمهام
                        </p>
                      </div>
                      <Switch id="deadline_reminders" defaultChecked />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={() => handleSave("الإشعارات")} 
                    disabled={loading}
                  >
                    {loading ? "جاري الحفظ..." : "حفظ التغييرات"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Appearance Settings */}
            <TabsContent value="appearance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>إعدادات المظهر</CardTitle>
                  <CardDescription>
                    تخصيص مظهر التطبيق
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="theme">السمة</Label>
                      <Select defaultValue="light">
                        <SelectTrigger>
                          <SelectValue placeholder="اختر السمة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">فاتح</SelectItem>
                          <SelectItem value="dark">داكن</SelectItem>
                          <SelectItem value="system">حسب النظام</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <Label htmlFor="language">اللغة</Label>
                      <Select defaultValue="ar">
                        <SelectTrigger>
                          <SelectValue placeholder="اختر اللغة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ar">العربية</SelectItem>
                          <SelectItem value="en">الإنجليزية</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="rtl">اتجاه القراءة من اليمين إلى اليسار</Label>
                        <p className="text-sm text-muted-foreground">
                          تفعيل اتجاه القراءة من اليمين إلى اليسار
                        </p>
                      </div>
                      <Switch id="rtl" defaultChecked />
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <Label htmlFor="font_size">حجم الخط</Label>
                      <Select defaultValue="medium">
                        <SelectTrigger>
                          <SelectValue placeholder="اختر حجم الخط" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">صغير</SelectItem>
                          <SelectItem value="medium">متوسط</SelectItem>
                          <SelectItem value="large">كبير</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={() => handleSave("المظهر")} 
                    disabled={loading}
                  >
                    {loading ? "جاري الحفظ..." : "حفظ التغييرات"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Security Settings */}
            <TabsContent value="security" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>إعدادات الأمان</CardTitle>
                  <CardDescription>
                    إدارة إعدادات الأمان وكلمة المرور
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current_password">كلمة المرور الحالية</Label>
                      <Input id="current_password" type="password" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="new_password">كلمة المرور الجديدة</Label>
                      <Input id="new_password" type="password" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirm_password">تأكيد كلمة المرور الجديدة</Label>
                      <Input id="confirm_password" type="password" />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="two_factor">المصادقة الثنائية</Label>
                        <p className="text-sm text-muted-foreground">
                          تفعيل المصادقة الثنائية لتأمين حسابك
                        </p>
                      </div>
                      <Switch id="two_factor" />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="session_timeout">مهلة الجلسة</Label>
                        <p className="text-sm text-muted-foreground">
                          تسجيل الخروج تلقائيًا بعد فترة من عدم النشاط
                        </p>
                      </div>
                      <Select defaultValue="30">
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="اختر المدة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 دقيقة</SelectItem>
                          <SelectItem value="30">30 دقيقة</SelectItem>
                          <SelectItem value="60">ساعة</SelectItem>
                          <SelectItem value="120">ساعتين</SelectItem>
                          <SelectItem value="never">أبدًا</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={() => handleSave("الأمان")} 
                    disabled={loading}
                  >
                    {loading ? "جاري الحفظ..." : "حفظ التغييرات"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Advanced Settings */}
            <TabsContent value="advanced" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>إعدادات متقدمة</CardTitle>
                  <CardDescription>
                    إعدادات متقدمة للنظام وإدارة البيانات
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="date_format">تنسيق التاريخ</Label>
                      <Select defaultValue="dd/mm/yyyy">
                        <SelectTrigger>
                          <SelectValue placeholder="اختر تنسيق التاريخ" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                          <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                          <SelectItem value="yyyy/mm/dd">YYYY/MM/DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <Label htmlFor="timezone">المنطقة الزمنية</Label>
                      <Select defaultValue="asia_riyadh">
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المنطقة الزمنية" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="asia_riyadh">الرياض (GMT+3)</SelectItem>
                          <SelectItem value="asia_dubai">دبي (GMT+4)</SelectItem>
                          <SelectItem value="europe_london">لندن (GMT+0)</SelectItem>
                          <SelectItem value="america_newyork">نيويورك (GMT-5)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="auto_backup">النسخ الاحتياطي التلقائي</Label>
                        <p className="text-sm text-muted-foreground">
                          إنشاء نسخة احتياطية تلقائية للبيانات
                        </p>
                      </div>
                      <Switch id="auto_backup" defaultChecked />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="data_sharing">مشاركة البيانات</Label>
                        <p className="text-sm text-muted-foreground">
                          مشاركة بيانات الاستخدام المجهولة لتحسين التطبيق
                        </p>
                      </div>
                      <Switch id="data_sharing" />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="destructive"
                    onClick={() => toast.error("تم إلغاء هذه العملية")}
                  >
                    مسح جميع البيانات
                  </Button>
                  <Button 
                    onClick={() => handleSave("الإعدادات المتقدمة")} 
                    disabled={loading}
                  >
                    {loading ? "جاري الحفظ..." : "حفظ التغييرات"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  )
} 