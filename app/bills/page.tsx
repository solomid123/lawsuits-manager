"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileText, Filter, Plus, Receipt } from "lucide-react"
import Link from "next/link"

export default function ReceiptsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">الإيصالات</h1>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/bills/list">
              عرض جميع الإيصالات
            </Link>
          </Button>
          <Button asChild>
            <Link href="/bills/upload">
              <Upload className="ml-2 h-4 w-4" />
              إضافة إيصال جديد
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">جميع الإيصالات</TabsTrigger>
          <TabsTrigger value="expenses">المصاريف</TabsTrigger>
          <TabsTrigger value="invoices">فواتير المزودين</TabsTrigger>
          <TabsTrigger value="others">إيصالات أخرى</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>الإيصالات الأخيرة</CardTitle>
              <CardDescription>
                عرض جميع الإيصالات المرفوعة مؤخرًا
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Receipt className="mx-auto h-12 w-12 opacity-20 mb-4" />
                <h3 className="font-medium text-lg mb-2">لا توجد إيصالات بعد</h3>
                <p className="max-w-md mx-auto mb-4">
                  قم بإضافة إيصاالات جديدة لتتمكن من متابعة المصاريف والفواتير
                </p>
                <Button asChild>
                  <Link href="/bills/upload">
                    <Plus className="ml-2 h-4 w-4" />
                    إضافة إيصال
                  </Link>
                </Button>
                <Button asChild variant="outline" className="mr-2">
                  <Link href="/bills/list">
                    عرض الإيصالات
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>المصاريف</CardTitle>
              <CardDescription>
                عرض كافة مصاريف المكتب والقضايا
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Receipt className="mx-auto h-12 w-12 opacity-20 mb-4" />
                <h3 className="font-medium text-lg mb-2">لا توجد مصاريف بعد</h3>
                <p className="max-w-md mx-auto mb-4">
                  قم بإضافة إيصاالات للمصاريف لتتمكن من متابعتها
                </p>
                <Button asChild>
                  <Link href="/bills/upload?type=expense">
                    <Plus className="ml-2 h-4 w-4" />
                    إضافة مصروف
                  </Link>
                </Button>
                <Button asChild variant="outline" className="mr-2">
                  <Link href="/bills/list">
                    عرض الإيصالات
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>فواتير المزودين</CardTitle>
              <CardDescription>
                عرض كافة فواتير المزودين والخدمات
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 opacity-20 mb-4" />
                <h3 className="font-medium text-lg mb-2">لا توجد فواتير مزودين بعد</h3>
                <p className="max-w-md mx-auto mb-4">
                  قم بإضافة فواتير المزودين لتتمكن من متابعة المدفوعات
                </p>
                <Button asChild>
                  <Link href="/bills/upload?type=vendor">
                    <Plus className="ml-2 h-4 w-4" />
                    إضافة فاتورة
                  </Link>
                </Button>
                <Button asChild variant="outline" className="mr-2">
                  <Link href="/bills/list">
                    عرض الإيصالات
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="others" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>إيصالات أخرى</CardTitle>
              <CardDescription>
                عرض كافة الإيصالات الأخرى
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Receipt className="mx-auto h-12 w-12 opacity-20 mb-4" />
                <h3 className="font-medium text-lg mb-2">لا توجد إيصالات أخرى بعد</h3>
                <p className="max-w-md mx-auto mb-4">
                  قم بإضافة إيصاالات أخرى لتتمكن من متابعتها وتصنيفها
                </p>
                <Button asChild>
                  <Link href="/bills/upload?type=other">
                    <Plus className="ml-2 h-4 w-4" />
                    إضافة إيصال
                  </Link>
                </Button>
                <Button asChild variant="outline" className="mr-2">
                  <Link href="/bills/list">
                    عرض الإيصالات
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 