"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Search, Filter, ArrowUpDown, ExternalLink, Trash, Plus } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { toast } from "sonner"
import { getFileUrl } from "@/lib/supabase-file-upload"

// Receipt categories for filtering
const receiptCategories = [
  { id: "all", name: "جميع الفئات" },
  { id: "office", name: "مصاريف مكتبية" },
  { id: "case", name: "مصاريف قضايا" },
  { id: "vendor", name: "فواتير موردين" },
  { id: "utilities", name: "فواتير خدمات" },
  { id: "taxes", name: "ضرائب ورسوم" },
  { id: "travel", name: "سفر وتنقلات" },
  { id: "other", name: "أخرى" }
]

// Receipt statuses with styling
const receiptStatuses = {
  paid: { label: "مدفوع", color: "bg-green-100 text-green-800" },
  pending: { label: "قيد الانتظار", color: "bg-yellow-100 text-yellow-800" },
  unpaid: { label: "غير مدفوع", color: "bg-red-100 text-red-800" }
}

// Payment methods
const paymentMethods = {
  cash: "نقداً",
  bank_transfer: "حوالة بنكية",
  credit_card: "بطاقة إئتمانية",
  check: "شيك",
  unpaid: "غير مدفوع"
}

// Type for a receipt
type Receipt = {
  id: string
  title: string
  amount: number
  category: string
  date: string
  payment_method: string
  status: "paid" | "pending" | "unpaid"
  reference_number: string | null
  case_id: string | null
  vendor: string | null
  notes: string | null
  file_path: string
  file_url?: string | null
  created_at: string
  case_title?: string
}

export default function ReceiptsListPage() {
  const router = useRouter()
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [filteredReceipts, setFilteredReceipts] = useState<Receipt[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [sortColumn, setSortColumn] = useState("date")
  const [sortDirection, setSortDirection] = useState("desc")
  
  const supabase = createClientComponentClient()
  
  // Fetch all receipts
  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        setLoading(true)
        
        console.log('Fetching receipts from database...')
        
        const { data, error } = await supabase
          .from('receipts')
          .select(`
            *,
            cases (
              title
            )
          `)
          .order('created_at', { ascending: false })
        
        if (error) {
          console.error('Supabase error:', error)
          throw error
        }
        
        console.log('Receipts fetched:', data?.length || 0)
        
        // Transform the data to include case title
        const formattedReceipts = data?.map((receipt: any) => ({
          ...receipt,
          case_title: receipt.cases?.title
        })) || []
        
        setReceipts(formattedReceipts)
        setFilteredReceipts(formattedReceipts)
        
        // Pre-fetch file URLs for all receipts
        if (formattedReceipts.length > 0) {
          fetchFileUrls(formattedReceipts)
        }
      } catch (error) {
        console.error('Error fetching receipts:', error)
        toast.error("فشل في جلب الإيصالات")
      } finally {
        setLoading(false)
      }
    }
    
    fetchReceipts()
  }, [])
  
  // Pre-fetch file URLs for better performance
  const fetchFileUrls = async (receiptsData: Receipt[]) => {
    try {
      console.log('Pre-fetching file URLs for', receiptsData.length, 'receipts')
      
      const receiptsWithUrls = await Promise.all(
        receiptsData.map(async (receipt) => {
          try {
            const fileUrl = await getFileUrl(receipt.file_path, 'receipts')
            return { ...receipt, file_url: fileUrl }
          } catch (err) {
            console.error('Error fetching URL for receipt:', receipt.id, err)
            return receipt
          }
        })
      )
      
      console.log('Fetched URLs successfully')
      setReceipts(receiptsWithUrls as Receipt[])
      setFilteredReceipts(
        receiptsWithUrls.filter(r => 
          filteredReceipts.some(fr => fr.id === r.id)
        ) as Receipt[]
      )
    } catch (error) {
      console.error('Error pre-fetching file URLs:', error)
    }
  }
  
  // Apply filters and search
  useEffect(() => {
    let result = [...receipts]
    
    // Apply category filter
    if (selectedCategory !== "all") {
      result = result.filter(receipt => receipt.category === selectedCategory)
    }
    
    // Apply status filter
    if (selectedStatus !== "all") {
      result = result.filter(receipt => receipt.status === selectedStatus)
    }
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(receipt => 
        receipt.title.toLowerCase().includes(query) ||
        receipt.vendor?.toLowerCase().includes(query) ||
        receipt.reference_number?.toLowerCase().includes(query) ||
        receipt.case_title?.toLowerCase().includes(query)
      )
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let aValue, bValue
      
      switch (sortColumn) {
        case "date":
          aValue = new Date(a.date).getTime()
          bValue = new Date(b.date).getTime()
          break
        case "amount":
          aValue = a.amount
          bValue = b.amount
          break
        case "title":
          aValue = a.title
          bValue = b.title
          break
        default:
          aValue = a.created_at
          bValue = b.created_at
      }
      
      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
    
    setFilteredReceipts(result)
  }, [receipts, searchQuery, selectedCategory, selectedStatus, sortColumn, sortDirection])
  
  // Handle sorting
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("desc")
    }
  }
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-MA', {
      style: 'currency',
      currency: 'MAD'
    }).format(amount)
  }
  
  // Handle file preview/download
  const handleViewFile = async (receipt: Receipt) => {
    try {
      // Use pre-fetched URL if available, otherwise fetch it
      const fileUrl = receipt.file_url || await getFileUrl(receipt.file_path, 'receipts')
      if (fileUrl) {
        window.open(fileUrl, '_blank')
      } else {
        toast.error("تعذر الوصول إلى الملف")
      }
    } catch (error) {
      console.error('Error getting file URL:', error)
      toast.error("تعذر الوصول إلى الملف")
    }
  }
  
  // Handle receipt deletion
  const handleDeleteReceipt = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الإيصال؟")) return
    
    try {
      const { error } = await supabase
        .from('receipts')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      setReceipts(prev => prev.filter(receipt => receipt.id !== id))
      toast.success("تم حذف الإيصال بنجاح")
    } catch (error) {
      console.error('Error deleting receipt:', error)
      toast.error("فشل في حذف الإيصال")
    }
  }
  
  // File Preview Modal
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  
  const openFilePreview = async (receipt: Receipt) => {
    try {
      const fileUrl = receipt.file_url || await getFileUrl(receipt.file_path, 'receipts')
      if (fileUrl) {
        setPreviewUrl(fileUrl)
      } else {
        toast.error("تعذر الوصول إلى الملف")
      }
    } catch (error) {
      console.error('Error getting file URL for preview:', error)
      toast.error("تعذر الوصول إلى الملف")
    }
  }
  
  const closeFilePreview = () => {
    setPreviewUrl(null)
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
          <h1 className="text-2xl font-bold">الإيصالات</h1>
        </div>
        <Button 
          onClick={() => router.push('/bills/upload')}
        >
          إضافة إيصال جديد
        </Button>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>قائمة الإيصالات</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search and filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="البحث عن إيصال..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <div className="w-[180px]">
                <Select 
                  value={selectedCategory} 
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="فئة الإيصال" />
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
              <div className="w-[180px]">
                <Select 
                  value={selectedStatus} 
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="حالة الدفع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    <SelectItem value="paid">مدفوع</SelectItem>
                    <SelectItem value="pending">قيد الانتظار</SelectItem>
                    <SelectItem value="unpaid">غير مدفوع</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Receipts table */}
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
              <p className="mt-2 text-muted-foreground">جاري تحميل الإيصالات...</p>
            </div>
          ) : filteredReceipts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">لا توجد إيصالات متطابقة</p>
              <Button 
                variant="outline"
                onClick={() => router.push('/bills/upload')}
              >
                <Plus className="mr-2 h-4 w-4" />
                إضافة إيصال جديد
              </Button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">
                      <button 
                        className="flex items-center gap-1"
                        onClick={() => handleSort("title")}
                      >
                        العنوان
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button 
                        className="flex items-center gap-1"
                        onClick={() => handleSort("amount")}
                      >
                        المبلغ
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button 
                        className="flex items-center gap-1"
                        onClick={() => handleSort("date")}
                      >
                        التاريخ
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead>الفئة</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>طريقة الدفع</TableHead>
                    <TableHead className="text-left">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReceipts.map((receipt) => (
                    <TableRow key={receipt.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{receipt.title}</span>
                          {receipt.vendor && (
                            <span className="text-sm text-muted-foreground">
                              المورد: {receipt.vendor}
                            </span>
                          )}
                          {receipt.case_title && (
                            <span className="text-sm text-muted-foreground">
                              القضية: {receipt.case_title}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{formatCurrency(receipt.amount)}</span>
                      </TableCell>
                      <TableCell>
                        {format(new Date(receipt.date), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>
                        {receiptCategories.find(c => c.id === receipt.category)?.name || receipt.category}
                      </TableCell>
                      <TableCell>
                        {receipt.status && (
                          <Badge 
                            className={receiptStatuses[receipt.status]?.color || ""}
                            variant="outline"
                          >
                            {receiptStatuses[receipt.status]?.label || receipt.status}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {paymentMethods[receipt.payment_method as keyof typeof paymentMethods] || receipt.payment_method}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            title="عرض الإيصال"
                            onClick={() => handleViewFile(receipt)}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            title="معاينة الإيصال"
                            onClick={() => openFilePreview(receipt)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                              <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            title="حذف الإيصال"
                            onClick={() => handleDeleteReceipt(receipt.id)}
                          >
                            <Trash className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* File Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative bg-white p-4 rounded-lg max-w-3xl max-h-[80vh] w-full overflow-auto">
            <Button
              variant="outline"
              size="icon"
              className="absolute top-2 right-2 z-10"
              onClick={closeFilePreview}
            >
              <span className="sr-only">Close</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </Button>
            
            {previewUrl.toLowerCase().endsWith('.pdf') ? (
              <iframe
                src={previewUrl}
                className="w-full h-[70vh]"
                title="Document Preview"
              />
            ) : (
              <img
                src={previewUrl}
                alt="Document Preview"
                className="max-w-full max-h-[70vh] object-contain mx-auto"
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
} 