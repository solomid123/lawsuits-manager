"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { 
  Plus, 
  Search, 
  RefreshCw, 
  ExternalLink, 
  FileText, 
  Check, 
  Clock, 
  AlertTriangle,
  Trash2,
  MoreVertical,
  Eye,
  Calendar
} from "lucide-react"
import Link from "next/link"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import InvoiceViewer from "../../components/InvoiceViewer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { deleteInvoice, updateInvoiceStatus } from "@/app/actions/invoice-actions"

// Types
type Invoice = {
  id: string
  invoice_number: string
  invoice_date: string
  due_date: string
  amount: number
  tax_amount: number
  total_amount: number
  status: "draft" | "sent" | "paid" | "overdue"
  created_at: string
  client_id: string
  pdf_url?: string
  clients?: {
    first_name: string
    last_name: string
    company_name: string | null
  }
}

export default function InvoiceListPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [statusUpdateLoading, setStatusUpdateLoading] = useState<string | null>(null)
  
  const supabase = createClientComponentClient()
  
  const fetchInvoices = async (search = "", status = "") => {
    setLoading(true)
    setError(null)
    
    try {
      let query = supabase
        .from("invoices")
        .select(`
          *,
          clients (
            first_name,
            last_name,
            company_name
          )
        `)
        .order("created_at", { ascending: false })
      
      // Apply search if provided
      if (search) {
        query = query.or(`invoice_number.ilike.%${search}%,clients(first_name).ilike.%${search}%,clients(last_name).ilike.%${search}%`)
      }
      
      // Apply status filter if provided
      if (status) {
        query = query.eq("status", status)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      setInvoices(data || [])
    } catch (err) {
      console.error("Error fetching invoices:", err)
      setError("فشل في جلب الفواتير. الرجاء المحاولة مرة أخرى.")
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchInvoices(searchQuery, statusFilter)
  }, [statusFilter])
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchInvoices(searchQuery, statusFilter)
  }
  
  const handleDeleteInvoice = async (id: string) => {
    setDeleteLoading(true)
    try {
      const result = await deleteInvoice(id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("تم حذف الفاتورة بنجاح")
        fetchInvoices(searchQuery, statusFilter)
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء حذف الفاتورة")
    } finally {
      setDeleteLoading(false)
      setInvoiceToDelete(null)
    }
  }
  
  const handleStatusChange = async (id: string, newStatus: string) => {
    setStatusUpdateLoading(id)
    try {
      const result = await updateInvoiceStatus(id, newStatus)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`تم تحديث حالة الفاتورة إلى "${getStatusLabel(newStatus)}"`)
        // Update local state without needing to refetch all invoices
        setInvoices(invoices.map(invoice => 
          invoice.id === id ? { ...invoice, status: newStatus as any } : invoice
        ))
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء تحديث حالة الفاتورة")
    } finally {
      setStatusUpdateLoading(null)
    }
  }
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "yyyy/MM/dd")
    } catch {
      return "—"
    }
  }
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-MA', {
      style: 'currency',
      currency: 'MAD'
    }).format(amount)
  }
  
  const getClientName = (invoice: Invoice) => {
    if (!invoice.clients) return "—"
    
    const { first_name, last_name, company_name } = invoice.clients
    
    return company_name 
      ? `${company_name} (${first_name} ${last_name})`
      : `${first_name} ${last_name}`
  }

  // Get status label for Arabic display
  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'draft': return 'مسودة'
      case 'sent': return 'مرسلة'
      case 'paid': return 'مدفوعة'
      case 'overdue': return 'متأخرة'
      default: return status
    }
  }
  
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'draft':
        return <Badge variant="outline" className="flex items-center gap-1 w-fit"><Clock className="h-3 w-3" /> مسودة</Badge>
      case 'sent':
        return <Badge variant="secondary" className="flex items-center gap-1 w-fit"><FileText className="h-3 w-3" /> مرسلة</Badge>
      case 'paid':
        return <Badge variant="default" className="flex items-center gap-1 w-fit bg-green-100 text-green-800"><Check className="h-3 w-3" /> مدفوعة</Badge>
      case 'overdue':
        return <Badge variant="destructive" className="flex items-center gap-1 w-fit"><AlertTriangle className="h-3 w-3" /> متأخرة</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }
  
  const isInvoiceOverdue = (dueDate: string, status: string) => {
    if (status === 'paid') return false
    
    const today = new Date()
    const due = new Date(dueDate)
    return today > due
  }
  
  // Check for overdue invoices
  useEffect(() => {
    const overdueInvoices = invoices.filter(inv => 
      inv.status !== 'paid' && isInvoiceOverdue(inv.due_date, inv.status)
    )
    
    // Update status for overdue invoices
    if (overdueInvoices.length > 0) {
      toast.warning(`${overdueInvoices.length} فاتورة متأخرة عن موعد السداد`)
    }
  }, [invoices])
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">الفواتير</h1>
        <Link href="/invoices">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            إنشاء فاتورة جديدة
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <form onSubmit={handleSearch} className="flex w-full sm:w-auto items-center gap-2">
          <div className="relative flex-1 w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="البحث عن فاتورة أو عميل..." 
              className="pl-10 text-right w-full" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button type="submit" variant="default">بحث</Button>
        </form>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="w-full sm:w-[200px]">
            <Select
              value={statusFilter || "all"}
              onValueChange={(value) => setStatusFilter(value === "all" ? "" : value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="جميع الحالات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="draft">مسودة</SelectItem>
                <SelectItem value="sent">مرسلة</SelectItem>
                <SelectItem value="paid">مدفوعة</SelectItem>
                <SelectItem value="overdue">متأخرة</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button variant="outline" size="icon" onClick={() => {
            setSearchQuery("")
            setStatusFilter("")
            fetchInvoices()
          }}>
            <RefreshCw className="h-4 w-4" />
            <span className="sr-only">تحديث</span>
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border p-8 text-center">
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button variant="outline" size="sm" onClick={() => fetchInvoices()}>
            إعادة المحاولة
          </Button>
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">رقم الفاتورة</TableHead>
                  <TableHead className="text-right">العميل</TableHead>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">تاريخ الاستحقاق</TableHead>
                  <TableHead className="text-right">المبلغ</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right w-[100px]">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array(5).fill(0).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-[150px]" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-[90px]" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-[90px]" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-9 w-9 rounded-md" /></TableCell>
                    </TableRow>
                  ))
                ) : invoices.length > 0 ? (
                  invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.invoice_number}
                      </TableCell>
                      <TableCell className="font-medium">
                        {getClientName(invoice)}
                      </TableCell>
                      <TableCell>{formatDate(invoice.invoice_date)}</TableCell>
                      <TableCell>{formatDate(invoice.due_date)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(invoice.total_amount)}</TableCell>
                      <TableCell>
                        <Select
                          value={invoice.status}
                          onValueChange={(value) => handleStatusChange(invoice.id, value)}
                          disabled={statusUpdateLoading === invoice.id}
                        >
                          <SelectTrigger className="h-8 w-[120px] border-none">
                            <SelectValue>
                              {statusUpdateLoading === invoice.id ? (
                                <div className="flex items-center">
                                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent ml-2"></div>
                                  جاري التحديث...
                                </div>
                              ) : (
                                getStatusBadge(invoice.status)
                              )}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">
                              <div className="flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5" />
                                <span>مسودة</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="sent">
                              <div className="flex items-center gap-2">
                                <FileText className="h-3.5 w-3.5" />
                                <span>مرسلة</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="paid">
                              <div className="flex items-center gap-2">
                                <Check className="h-3.5 w-3.5" />
                                <span>مدفوعة</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="overdue">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                <span>متأخرة</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">إجراءات</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>إجراءات الفاتورة</DropdownMenuLabel>
                            
                            {invoice.pdf_url ? (
                              <DropdownMenuItem asChild>
                                <InvoiceViewer 
                                  invoiceId={invoice.id} 
                                  invoiceNumber={invoice.invoice_number} 
                                  pdfUrl={invoice.pdf_url}
                                  triggerButton={
                                    <button className="w-full flex items-center px-2 py-1.5 text-sm">
                                      <Eye className="ml-2 h-4 w-4" />
                                      عرض الفاتورة
                                    </button>
                                  }
                                />
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem asChild>
                                <Link href={`/invoices?id=${invoice.id}`} className="flex items-center">
                                  <Eye className="ml-2 h-4 w-4" />
                                  عرض الفاتورة
                                </Link>
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuItem asChild>
                              <Link href={`/invoices?id=${invoice.id}`} className="flex items-center">
                                <FileText className="ml-2 h-4 w-4" />
                                تعديل الفاتورة
                              </Link>
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={() => setInvoiceToDelete(invoice.id)}
                            >
                              <Trash2 className="ml-2 h-4 w-4" />
                              حذف الفاتورة
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      لا توجد فواتير
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Alert Dialog for Delete Confirmation */}
      <AlertDialog open={!!invoiceToDelete} onOpenChange={(open) => !open && setInvoiceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من حذف هذه الفاتورة؟</AlertDialogTitle>
            <AlertDialogDescription>
              هذا الإجراء لا يمكن التراجع عنه. سيتم حذف الفاتورة وجميع البيانات المرتبطة بها بشكل دائم.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => invoiceToDelete && handleDeleteInvoice(invoiceToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteLoading}
            >
              {deleteLoading ? 'جاري الحذف...' : 'حذف الفاتورة'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 