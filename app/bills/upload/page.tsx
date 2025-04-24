"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileUp, ArrowLeft, Calendar, DollarSign } from "lucide-react"
import { format } from "date-fns"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "sonner"
import { uploadFile } from "@/lib/supabase-file-upload"

// Receipt categories
const receiptCategories = [
  { id: "office", name: "مصاريف مكتبية" },
  { id: "case", name: "مصاريف قضايا" },
  { id: "vendor", name: "فواتير موردين" },
  { id: "utilities", name: "فواتير خدمات" },
  { id: "taxes", name: "ضرائب ورسوم" },
  { id: "travel", name: "سفر وتنقلات" },
  { id: "other", name: "أخرى" }
]

// Payment methods
const paymentMethods = [
  { id: "cash", name: "نقداً" },
  { id: "bank_transfer", name: "حوالة بنكية" },
  { id: "credit_card", name: "بطاقة إئتمانية" },
  { id: "check", name: "شيك" },
  { id: "unpaid", name: "غير مدفوع" }
]

// Receipt statuses
const receiptStatuses = [
  { id: "paid", name: "مدفوع", color: "bg-green-100 text-green-800" },
  { id: "pending", name: "قيد الانتظار", color: "bg-yellow-100 text-yellow-800" },
  { id: "unpaid", name: "غير مدفوع", color: "bg-red-100 text-red-800" }
]

export default function UploadReceiptPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const receiptType = searchParams.get('type') || 'general'
  
  const [loading, setLoading] = useState(false)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [cases, setCases] = useState<Array<{id: string, title: string}>>([])
  
  const [receiptData, setReceiptData] = useState({
    title: "",
    amount: "",
    category: receiptType === 'expense' ? 'office' : (receiptType === 'vendor' ? 'vendor' : ''),
    date: format(new Date(), "yyyy-MM-dd"),
    payment_method: receiptType === 'vendor' ? 'unpaid' : 'cash',
    status: receiptType === 'vendor' ? 'unpaid' : 'paid',
    reference_number: "",
    case_id: "",
    vendor: "",
    notes: "",
    file_path: ""
  })
  
  const supabase = createClientComponentClient()
  
  // Fetch cases for the dropdown
  useEffect(() => {
    const fetchCases = async () => {
      try {
        const { data, error } = await supabase
          .from('cases')
          .select('id, title')
          .order('created_at', { ascending: false })
        
        if (error) throw error
        setCases(data || [])
      } catch (error) {
        console.error('Error fetching cases:', error)
      }
    }
    
    fetchCases()
  }, [])
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setReceiptFile(file)
      
      // Create preview URL for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setFilePreview(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        setFilePreview(null)
      }
    }
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setReceiptData(prev => ({ ...prev, [name]: value }))
  }
  
  const handleSelectChange = (name: string, value: string) => {
    setReceiptData(prev => ({ ...prev, [name]: value }))
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!receiptFile) {
      toast.error("يرجى إرفاق صورة أو ملف الإيصال")
      return
    }
    
    if (!receiptData.title) {
      toast.error("يرجى إدخال عنوان الإيصال")
      return
    }
    
    if (!receiptData.amount || isNaN(parseFloat(receiptData.amount))) {
      toast.error("يرجى إدخال قيمة صحيحة للإيصال")
      return
    }
    
    setLoading(true)
    
    try {
      // 1. Upload file to storage
      const { path, error: uploadError } = await uploadFile(
        receiptFile,
        'receipts',
        receiptData.category
      )
      
      if (uploadError) throw new Error(uploadError.toString())
      
      // 2. Insert receipt data to database
      const { data, error } = await supabase
        .from('receipts')
        .insert({
          title: receiptData.title,
          amount: parseFloat(receiptData.amount),
          category: receiptData.category,
          date: receiptData.date,
          payment_method: receiptData.payment_method,
          status: receiptData.status,
          reference_number: receiptData.reference_number || null,
          case_id: receiptData.case_id === "none" ? null : (receiptData.case_id || null),
          vendor: receiptData.vendor || null,
          notes: receiptData.notes || null,
          file_path: path,
          created_at: new Date().toISOString()
        })
        .select()
      
      if (error) throw error
      
      toast.success("تم إضافة الإيصال بنجاح")
      router.push('/bills/list')
    } catch (error) {
      console.error('Error uploading receipt:', error)
      toast.error("حدث خطأ أثناء رفع الإيصال")
    } finally {
      setLoading(false)
    }
  }
  
  // Get title based on receipt type
  const getPageTitle = () => {
    switch (receiptType) {
      case 'expense':
        return 'إضافة مصروف جديد'
      case 'vendor':
        return 'إضافة فاتورة مورد'
      default:
        return 'إضافة إيصال جديد'
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => router.push('/bills')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{getPageTitle()}</h1>
        </div>
        <Button 
          onClick={handleSubmit} 
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2"></div>
              جاري الحفظ...
            </span>
          ) : (
            "حفظ الإيصال"
          )}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Receipt Details */}
        <Card>
          <CardHeader>
            <CardTitle>بيانات الإيصال</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">عنوان الإيصال</Label>
              <Input
                id="title"
                name="title"
                placeholder="أدخل عنوان وصفي للإيصال"
                value={receiptData.title}
                onChange={handleInputChange}
              />
            </div>
            
            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">المبلغ</Label>
              <div className="relative">
                <DollarSign className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="pr-10"
                  value={receiptData.amount}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">فئة الإيصال</Label>
              <Select 
                value={receiptData.category} 
                onValueChange={(value) => handleSelectChange('category', value)}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="اختر فئة الإيصال" />
                </SelectTrigger>
                <SelectContent>
                  {receiptCategories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">تاريخ الإيصال</Label>
              <div className="relative">
                <Calendar className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="date"
                  name="date"
                  type="date"
                  className="pr-10"
                  value={receiptData.date}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="payment-method">طريقة الدفع</Label>
              <Select 
                value={receiptData.payment_method} 
                onValueChange={(value) => handleSelectChange('payment_method', value)}
              >
                <SelectTrigger id="payment-method">
                  <SelectValue placeholder="اختر طريقة الدفع" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map(method => (
                    <SelectItem key={method.id} value={method.id}>
                      {method.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">حالة الدفع</Label>
              <Select 
                value={receiptData.status} 
                onValueChange={(value) => handleSelectChange('status', value)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="اختر حالة الدفع" />
                </SelectTrigger>
                <SelectContent>
                  {receiptStatuses.map(status => (
                    <SelectItem key={status.id} value={status.id}>
                      <div className={`px-2 py-1 rounded text-xs inline-block ${status.color}`}>
                        {status.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Additional Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>تفاصيل إضافية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Reference Number */}
              <div className="space-y-2">
                <Label htmlFor="reference-number">رقم المرجع</Label>
                <Input
                  id="reference-number"
                  name="reference_number"
                  placeholder="رقم الفاتورة أو المرجع (اختياري)"
                  value={receiptData.reference_number}
                  onChange={handleInputChange}
                />
              </div>
              
              {/* Related Case */}
              <div className="space-y-2">
                <Label htmlFor="case">القضية المرتبطة</Label>
                <Select 
                  value={receiptData.case_id} 
                  onValueChange={(value) => handleSelectChange('case_id', value)}
                >
                  <SelectTrigger id="case">
                    <SelectValue placeholder="اختر القضية المرتبطة (اختياري)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون قضية</SelectItem>
                    {cases.map(caseItem => (
                      <SelectItem key={caseItem.id} value={caseItem.id}>
                        {caseItem.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Vendor */}
              <div className="space-y-2">
                <Label htmlFor="vendor">المورد / الجهة</Label>
                <Input
                  id="vendor"
                  name="vendor"
                  placeholder="اسم المورد أو الجهة (اختياري)"
                  value={receiptData.vendor}
                  onChange={handleInputChange}
                />
              </div>
              
              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">ملاحظات</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="أي ملاحظات إضافية (اختياري)"
                  className="min-h-[100px]"
                  value={receiptData.notes}
                  onChange={handleInputChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle>ملف الإيصال</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="receipt-file"
                  className="hidden"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                />
                
                {filePreview ? (
                  <div className="space-y-4">
                    <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-lg border">
                      <img 
                        src={filePreview} 
                        alt="Receipt preview" 
                        className="h-auto w-full object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setReceiptFile(null)
                          setFilePreview(null)
                        }}
                      >
                        إزالة
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {receiptFile?.name} ({receiptFile?.size ? Math.round(receiptFile.size / 1024) : 0} KB)
                    </p>
                  </div>
                ) : receiptFile ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="p-4 bg-gray-100 rounded-lg">
                        <FileUp className="h-8 w-8 text-gray-500" />
                      </div>
                    </div>
                    <p className="text-sm">
                      {receiptFile.name} ({receiptFile.size ? Math.round(receiptFile.size / 1024) : 0} KB)
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setReceiptFile(null)
                      }}
                    >
                      إزالة الملف
                    </Button>
                  </div>
                ) : (
                  <div>
                    <FileUp className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm font-medium">قم بسحب وإفلات الملف هنا أو</p>
                    <Label htmlFor="receipt-file">
                      <Button
                        variant="outline"
                        className="mt-2"
                        type="button"
                        onClick={() => document.getElementById('receipt-file')?.click()}
                      >
                        اختر ملف
                      </Button>
                    </Label>
                    <p className="mt-1 text-xs text-gray-500">
                      PNG, JPG, JPEG أو PDF حتى 10MB
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 