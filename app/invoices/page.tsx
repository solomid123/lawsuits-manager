"use client"

import React, { useState, useEffect, useTransition, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, FileText, Search, Trash, Download, Eye } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "sonner"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { useActionState } from "react"
import { createInvoice } from "../actions/invoice-actions"
import { v4 as uuidv4 } from "uuid"
import InvoiceViewer from "../components/InvoiceViewer"
import { useSearchParams } from "next/navigation"

// Add a custom toast wrapper to prevent duplicates
const toastCache = new Set<string>();
const uniqueToast = {
  success: (message: string, options = {}) => {
    const cacheKey = `success:${message}`;
    if (toastCache.has(cacheKey)) return;
    toastCache.add(cacheKey);
    setTimeout(() => toastCache.delete(cacheKey), 3000); // Clear after 3 seconds
    return toast.success(message, options);
  },
  error: (message: string, options = {}) => {
    const cacheKey = `error:${message}`;
    if (toastCache.has(cacheKey)) return;
    toastCache.add(cacheKey);
    setTimeout(() => toastCache.delete(cacheKey), 3000); // Clear after 3 seconds
    return toast.error(message, options);
  }
};

// Types
type Client = {
  id: string
  first_name: string
  last_name: string
  company_name: string | null
  email: string | null
  phone: string | null
}

type InvoiceItem = {
  id: string
  description: string
  quantity: number
  unit_price: number
  total: number
}

type InvoiceData = {
  client_id: string
  invoice_number: string
  issue_date: string
  due_date: string
  items: InvoiceItem[]
  notes: string
  amount: number
  tax_rate: number
  tax_amount: number
  total_amount: number
  status: "draft" | "sent" | "paid" | "overdue"
}

// Company info - for PDF generation
const companyInfo = {
  name: "مكتب المحاماة",
  address: "شارع المحامين، الرباط، المغرب",
  phone: "+212 500 000 000",
  email: "contact@lawfirm.ma",
  website: "www.lawfirm.ma",
  taxId: "123456789"
}

// Predefined service list
const predefinedServices = [
  { id: "consultation", name: "استشارة قانونية", price: 500 },
  { id: "representation", name: "تمثيل في المحكمة", price: 2000 },
  { id: "document-preparation", name: "إعداد مستندات قانونية", price: 1000 },
  { id: "legal-research", name: "بحث قانوني", price: 1500 },
  { id: "negotiation", name: "تفاوض وتسوية", price: 1200 },
  { id: "contract-review", name: "مراجعة عقود", price: 800 }
]

// Initial form state
const initialFormState = {
  error: undefined,
  success: false,
  invoiceId: undefined
}

export default function InvoicesPage() {
  // Form state
  const [formState, dispatch] = useActionState(createInvoice, initialFormState)
  
  // Get query parameters
  const searchParams = useSearchParams()
  const invoiceIdToEdit = searchParams?.get('id')
  
  // State to track if edit success toast is shown already
  const [editToastShown, setEditToastShown] = useState(false)
  
  // State
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")
  const [invoice, setInvoice] = useState<InvoiceData>({
    client_id: "",
    invoice_number: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
    issue_date: format(new Date(), "yyyy-MM-dd"),
    due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
    items: [],
    notes: "",
    amount: 0,
    tax_rate: 20,
    tax_amount: 0,
    total_amount: 0,
    status: "draft"
  })
  const [newItem, setNewItem] = useState<Omit<InvoiceItem, "id" | "total">>({
    description: "",
    quantity: 1,
    unit_price: 0
  })
  const [selectedService, setSelectedService] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [clientSearchQuery, setClientSearchQuery] = useState("")
  
  // Use useRef to keep the Supabase client stable between renders
  const supabaseRef = useRef(createClientComponentClient())
  const supabase = supabaseRef.current

  // Add isPending state and startTransition function
  const [isPending, startTransition] = useTransition();

  const [pdfState, setPdfState] = useState<{
    previewUrl: string | null;
    loading: boolean;
  }>({
    previewUrl: null,
    loading: false,
  });

  // Load invoice data if editing an existing invoice
  useEffect(() => {
    if (!invoiceIdToEdit) return
    
    // Wrap the async operation in startTransition to fix the error
    startTransition(() => {
      const loadInvoiceData = async () => {
        try {
          // Fetch the invoice data
          const { data: invoiceData, error: invoiceError } = await supabase
            .from("invoices")
            .select(`
              *,
              clients (
                id, first_name, last_name, company_name, email, phone
              ),
              invoice_items (*)
            `)
            .eq("id", invoiceIdToEdit)
            .single()
          
          if (invoiceError) throw invoiceError
          
          if (!invoiceData) {
            toast.error("لم يتم العثور على الفاتورة")
            return
          }
          
          // Set client data if not already fetched
          if (invoiceData.clients) {
            setClients([invoiceData.clients])
            setSelectedClient(invoiceData.clients.id)
          }
          
          // Transform invoice items to match the expected format
          const items = (invoiceData.invoice_items || []).map((item: any) => ({
            id: item.id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total: item.total || (item.quantity * item.unit_price)
          }))
          
          // Update the invoice form data
          setInvoice({
            client_id: invoiceData.client_id,
            invoice_number: invoiceData.invoice_number,
            issue_date: invoiceData.invoice_date || invoiceData.issue_date,
            due_date: invoiceData.due_date,
            items: items,
            notes: invoiceData.notes || "",
            amount: invoiceData.subtotal || invoiceData.amount,
            tax_rate: invoiceData.tax_rate || 20,
            tax_amount: invoiceData.tax_amount,
            total_amount: invoiceData.total || invoiceData.total_amount,
            status: invoiceData.status
          })
          
          // Don't manually update formState or call dispatch here
          // This was causing the "useActionState outside of transition" error
          
          // Only show the toast once
          if (!editToastShown) {
            uniqueToast.success("تم تحميل الفاتورة للتعديل")
            setEditToastShown(true)
          }
        } catch (error) {
          console.error("Error loading invoice:", error)
          uniqueToast.error("فشل في تحميل بيانات الفاتورة")
        }
      }
      
      loadInvoiceData()
    })
  }, [invoiceIdToEdit, supabase, editToastShown])

  // Reset toast state when not in edit mode
  useEffect(() => {
    if (!invoiceIdToEdit) {
      setEditToastShown(false)
    }
  }, [invoiceIdToEdit])

  // Fetch clients
  const fetchClients = async () => {
    try {
      let query = supabase
        .from("clients")
        .select("id, first_name, last_name, company_name, email, phone")
        .order("first_name", { ascending: true })
      
      if (clientSearchQuery) {
        query = query.or(`first_name.ilike.%${clientSearchQuery}%,last_name.ilike.%${clientSearchQuery}%,company_name.ilike.%${clientSearchQuery}%`)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error("Error fetching clients:", error)
      toast.error("فشل في جلب العملاء")
    }
  }

  // Only fetch clients when clientSearchQuery changes or on initial mount
  useEffect(() => {
    // Skip the first render if we're editing an invoice (we'll load clients with the invoice data)
    if (invoiceIdToEdit) return;
    
    fetchClients()
  }, [clientSearchQuery])

  // Calculate totals
  useEffect(() => {
    const amount = invoice.items.reduce((sum, item) => sum + item.total, 0)
    const taxAmount = amount * (invoice.tax_rate / 100)
    const totalAmount = amount + taxAmount
    
    setInvoice({
      ...invoice,
      amount,
      tax_amount: taxAmount,
      total_amount: totalAmount
    })
  }, [invoice.items, invoice.tax_rate])

  // Update client selection
  useEffect(() => {
    if (selectedClient) {
      setInvoice(prev => ({ ...prev, client_id: selectedClient }))
    }
  }, [selectedClient])

  // Handle form state changes
  useEffect(() => {
    if (formState.error) {
      toast.error(formState.error)
    }
    
    if (formState.success) {
      toast.success("تم إنشاء الفاتورة بنجاح")
      
      // Automatically generate PDF after successful invoice creation
      if (formState.invoiceId) {
        // Generate PDF with the newly created invoice ID
        generatePdfAfterSave(formState.invoiceId);
      }
      
      // Reset form
      setInvoice({
        client_id: "",
        invoice_number: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
        issue_date: format(new Date(), "yyyy-MM-dd"),
        due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
        items: [],
        notes: "",
        amount: 0,
        tax_rate: 20,
        tax_amount: 0,
        total_amount: 0,
        status: "draft"
      })
      setSelectedClient("")
    }
  }, [formState])

  // Handle adding a new item
  const handleAddItem = () => {
    if (!newItem.description || newItem.quantity <= 0 || newItem.unit_price <= 0) {
      toast.error("يرجى إدخال وصف الخدمة والكمية والسعر")
      return
    }
    
    const total = newItem.quantity * newItem.unit_price
    const item: InvoiceItem = {
      id: Math.random().toString(36).substring(2, 11),
      description: newItem.description,
      quantity: newItem.quantity,
      unit_price: newItem.unit_price,
      total
    }
    
    setInvoice({
      ...invoice,
      items: [...invoice.items, item]
    })
    
    // Reset new item form
    setNewItem({
      description: "",
      quantity: 1,
      unit_price: 0
    })
    setSelectedService("")
  }

  // Handle selecting a predefined service
  const handleServiceSelect = (serviceId: string) => {
    const service = predefinedServices.find(s => s.id === serviceId)
    if (service) {
      setNewItem({
        description: service.name,
        quantity: 1,
        unit_price: service.price
      })
      setSelectedService(serviceId)
    }
  }

  // Handle removing an item
  const handleRemoveItem = (itemId: string) => {
    setInvoice({
      ...invoice,
      items: invoice.items.filter(item => item.id !== itemId)
    })
  }

  // Handle submitting the form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
     
    if (!invoice.client_id) {
      toast.error("يرجى اختيار العميل أولاً")
      return
    }
     
    if (invoice.items.length === 0) {
      toast.error("يرجى إضافة خدمة واحدة على الأقل")
      return
    }
     
    setLoading(true)
     
    try {
      // Create a FormData object for traditional form submission if needed
      const formData = new FormData()
      formData.append("client_id", invoice.client_id)
      formData.append("invoice_number", invoice.invoice_number)
      formData.append("issue_date", invoice.issue_date)
      formData.append("due_date", invoice.due_date)
      formData.append("notes", invoice.notes)
      formData.append("tax_rate", invoice.tax_rate.toString())
      formData.append("subtotal", invoice.amount.toString())
      formData.append("tax_amount", invoice.tax_amount.toString())
      formData.append("total", invoice.total_amount.toString())
      formData.append("items", JSON.stringify(invoice.items))
      
      // If we're editing an existing invoice, include the ID
      if (invoiceIdToEdit) {
        formData.append("invoice_id", invoiceIdToEdit)
      }
       
      // Submit the form using server action
      startTransition(() => {
        // Instead of directly passing FormData, create an object with the same properties
        const formDataObject: Record<string, string> = {
          client_id: invoice.client_id,
          invoice_number: invoice.invoice_number,
          issue_date: invoice.issue_date,
          due_date: invoice.due_date,
          notes: invoice.notes,
          tax_rate: invoice.tax_rate.toString(),
          subtotal: invoice.amount.toString(),
          tax_amount: invoice.tax_amount.toString(),
          total: invoice.total_amount.toString(),
          items: JSON.stringify(invoice.items)
        };

        // Add invoice_id if we're editing
        if (invoiceIdToEdit) {
          formDataObject.invoice_id = invoiceIdToEdit;
        }

        // Dispatch the plain object instead of FormData
        dispatch(formDataObject);
      })
    } catch (error) {
      console.error("Error submitting form:", error)
      toast.error("فشل في إنشاء الفاتورة")
    } finally {
      setLoading(false)
    }
  }

  // Function to generate PDF after successfully saving the invoice
  const generatePdfAfterSave = async (invoiceId: string) => {
    try {
      // Get client info
      const client = clients.find(c => c.id === invoice.client_id)
      
      if (!client) {
        console.error("Client not found for PDF generation");
        return;
      }
      
      // Import the PDF generation function
      const { generateInvoicePDF } = await import('@/lib/generate-invoice-pdf')
      
      // Generate the PDF with the saved invoice ID
      const pdfData = {
        ...invoice,
        id: invoiceId
      }
      
      // Always save to Supabase since we have an ID
      const { storageUrl } = await generateInvoicePDF(
        pdfData, 
        client, 
        companyInfo,
        true // Always save to Supabase
      )
      
      if (storageUrl) {
        console.log("PDF saved to Supabase:", storageUrl);
      }
    } catch (error) {
      console.error("Error generating PDF after save:", error);
    }
  }

  // Handle previewing the invoice
  const handlePreviewInvoice = async () => {
    if (!invoice.client_id) {
      toast.error("يرجى اختيار العميل أولاً")
      return
    }
    
    if (invoice.items.length === 0) {
      toast.error("يرجى إضافة خدمة واحدة على الأقل")
      return
    }
    
    setPdfState({ previewUrl: null, loading: true });
    
    try {
      // Get client info
      const client = clients.find(c => c.id === invoice.client_id)
      
      if (!client) {
        toast.error("لم يتم العثور على بيانات العميل")
        return
      }
      
      // Import the PDF generation function dynamically to avoid SSR issues
      const { generateInvoicePDF } = await import('@/lib/generate-invoice-pdf')
      
      // Generate the PDF without saving
      const pdfData = {
        ...invoice,
        id: formState.invoiceId || uuidv4() // Use existing ID or generate temporary one
      }
      
      const { pdfBlob } = await generateInvoicePDF(
        pdfData, 
        client, 
        companyInfo,
        false // Don't save to Supabase for preview
      )
      
      // Create a URL for the blob to preview it
      const url = URL.createObjectURL(pdfBlob);
      setPdfState({ previewUrl: url, loading: false });
      
    } catch (error) {
      console.error("Error generating PDF preview:", error)
      toast.error("فشل في إنشاء معاينة الفاتورة")
      setPdfState({ previewUrl: null, loading: false });
    }
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-MA', {
      style: 'currency',
      currency: 'MAD'
    }).format(amount)
  }

  // Get client name
  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId)
    if (!client) return ""
    
    return client.company_name 
      ? `${client.company_name} (${client.first_name} ${client.last_name})`
      : `${client.first_name} ${client.last_name}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">إنشاء فاتورة</h1>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            disabled={loading || isPending || pdfState.loading} 
            onClick={handleSubmit}
          >
            <FileText className="ml-2 h-4 w-4" />
            {isPending ? "جاري الحفظ..." : "حفظ الفاتورة"}
          </Button>
          
          {pdfState.previewUrl && (
            <InvoiceViewer
              invoiceId={formState.invoiceId || "preview"}
              invoiceNumber={invoice.invoice_number}
              pdfUrl={pdfState.previewUrl}
              triggerButton={
                <Button variant="outline">
                  <Eye className="ml-2 h-4 w-4" />
                  عرض الفاتورة
                </Button>
              }
            />
          )}
          
          <Button 
            variant={pdfState.previewUrl ? "outline" : "default"}
            disabled={loading || isPending || pdfState.loading}
            onClick={handlePreviewInvoice}
          >
            <Eye className="ml-2 h-4 w-4" />
            {pdfState.loading ? "جاري التحميل..." : "معاينة الفاتورة"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Client and Invoice Details */}
        <Card>
          <CardHeader>
            <CardTitle>تفاصيل العميل والفاتورة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Client Selection */}
            <div className="space-y-2">
              <Label htmlFor="client">العميل</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="client-search"
                  placeholder="البحث عن عميل..."
                  className="pl-10 text-right"
                  value={clientSearchQuery}
                  onChange={(e) => setClientSearchQuery(e.target.value)}
                />
              </div>
              <div className="max-h-40 overflow-y-auto border rounded-md mt-1">
                {clients.length > 0 ? (
                  <div className="p-1">
                    {clients.map((client) => (
                      <div
                        key={client.id}
                        className={`p-2 cursor-pointer rounded ${
                          selectedClient === client.id ? 'bg-primary/10' : 'hover:bg-secondary'
                        }`}
                        onClick={() => setSelectedClient(client.id)}
                      >
                        <div className="font-medium">
                          {client.first_name} {client.last_name}
                          {client.company_name && <span className="text-muted-foreground text-sm mr-2">({client.company_name})</span>}
                        </div>
                        {(client.email || client.phone) && (
                          <div className="text-sm text-muted-foreground">
                            {client.email && <span>{client.email}</span>}
                            {client.email && client.phone && <span> • </span>}
                            {client.phone && <span dir="ltr">{client.phone}</span>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    لا يوجد عملاء متطابقين
                  </div>
                )}
              </div>
            </div>

            {/* Invoice Number */}
            <div className="space-y-2">
              <Label htmlFor="invoice-number">رقم الفاتورة</Label>
              <Input
                id="invoice-number"
                value={invoice.invoice_number}
                onChange={(e) => setInvoice({...invoice, invoice_number: e.target.value})}
              />
            </div>

            {/* Invoice Date */}
            <div className="space-y-2">
              <Label htmlFor="issue-date">تاريخ الفاتورة</Label>
              <Input
                id="issue-date"
                type="date"
                value={invoice.issue_date}
                onChange={(e) => setInvoice({...invoice, issue_date: e.target.value})}
              />
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="due-date">تاريخ الاستحقاق</Label>
              <Input
                id="due-date"
                type="date"
                value={invoice.due_date}
                onChange={(e) => setInvoice({...invoice, due_date: e.target.value})}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea
                id="notes"
                value={invoice.notes}
                onChange={(e) => setInvoice({...invoice, notes: e.target.value})}
                placeholder="أي ملاحظات إضافية للفاتورة..."
                className="h-20"
              />
            </div>
          </CardContent>
        </Card>

        {/* Invoice Items */}
        <Card>
          <CardHeader>
            <CardTitle>الخدمات والرسوم</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Tax Rate */}
            <div className="space-y-2">
              <Label htmlFor="tax-rate">نسبة الضريبة (%)</Label>
              <Input
                id="tax-rate"
                type="number"
                min="0"
                max="100"
                value={invoice.tax_rate}
                onChange={(e) => setInvoice({...invoice, tax_rate: parseFloat(e.target.value) || 0})}
              />
            </div>

            {/* Add New Item Form */}
            <div className="space-y-4 border rounded-md p-4">
              <h3 className="font-medium">إضافة خدمة</h3>
              
              {/* Predefined Service Selection */}
              <div className="space-y-2">
                <Label htmlFor="service-select">اختر خدمة</Label>
                <Select
                  value={selectedService}
                  onValueChange={handleServiceSelect}
                >
                  <SelectTrigger id="service-select">
                    <SelectValue placeholder="اختر من الخدمات المتاحة" />
                  </SelectTrigger>
                  <SelectContent>
                    {predefinedServices.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} - {formatCurrency(service.price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="item-description">وصف الخدمة</Label>
                <Input
                  id="item-description"
                  value={newItem.description}
                  onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                  placeholder="أدخل وصف الخدمة"
                />
              </div>
              
              {/* Quantity and Price */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="item-quantity">الكمية</Label>
                  <Input
                    id="item-quantity"
                    type="number"
                    min="1"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 1})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item-price">السعر (درهم)</Label>
                  <Input
                    id="item-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newItem.unit_price}
                    onChange={(e) => setNewItem({...newItem, unit_price: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>
              
              <Button onClick={handleAddItem} className="w-full">
                <PlusCircle className="ml-2 h-4 w-4" />
                إضافة للفاتورة
              </Button>
            </div>

            {/* Items List */}
            <div className="space-y-2">
              <h3 className="font-medium">الخدمات المضافة</h3>
              {invoice.items.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  لم تتم إضافة أي خدمات بعد
                </div>
              ) : (
                <div className="space-y-2">
                  {invoice.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center border rounded-md p-3">
                      <div className="flex-1">
                        <div className="font-medium">{item.description}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.quantity} × {formatCurrency(item.unit_price)}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="font-medium text-right" style={{ minWidth: "100px" }}>
                          {formatCurrency(item.total)}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {/* Totals */}
                  <div className="border-t pt-4 mt-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">المجموع الفرعي:</span>
                      <span>{formatCurrency(invoice.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الضريبة ({invoice.tax_rate}%):</span>
                      <span>{formatCurrency(invoice.tax_amount)}</span>
                    </div>
                    <div className="flex justify-between font-bold pt-2 border-t">
                      <span>الإجمالي:</span>
                      <span>{formatCurrency(invoice.total_amount)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview section at bottom - modified to remove download button */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div>
              {selectedClient && (
                <div className="space-y-1">
                  <div className="font-medium text-lg">العميل: {getClientName(selectedClient)}</div>
                  <div className="text-muted-foreground">
                    الفاتورة رقم: {invoice.invoice_number} | التاريخ: {format(new Date(invoice.issue_date), "PPP", { locale: ar })}
                  </div>
                </div>
              )}
            </div>
            
            {pdfState.previewUrl ? (
              <InvoiceViewer
                invoiceId={formState.invoiceId || "preview"}
                invoiceNumber={invoice.invoice_number}
                pdfUrl={pdfState.previewUrl}
                triggerButton={
                  <Button size="lg">
                    <Eye className="ml-2 h-5 w-5" />
                    عرض الفاتورة
                  </Button>
                }
              />
            ) : (
              <Button 
                disabled={loading || isPending || pdfState.loading} 
                onClick={handlePreviewInvoice} 
                size="lg"
              >
                {pdfState.loading ? (
                  <span className="flex items-center">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2"></div>
                    جاري التحميل...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Eye className="ml-2 h-5 w-5" />
                    معاينة الفاتورة
                  </span>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 