"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { FileText, Search, Eye, Download, Loader2 } from "lucide-react"
import { getFileUrl } from "@/lib/supabase-file-upload"
import { format } from "date-fns"

type Client = {
  id: string
  first_name: string
  last_name: string
  company_name: string | null
  client_type: string
}

type Case = {
  id: string
  title: string
  case_number: string
  client_id: string
}

type Document = {
  id: string
  case_id: string
  name: string
  description: string | null
  document_date: string | null
  file_path: string | null
  file_name: string | null
  file_type: string | null
  file_size: number | null
  created_at: string
  updated_at: string | null
  file_url?: string | null
  case_title?: string
  client_name?: string
}

export default function DocumentsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [clientSearchQuery, setClientSearchQuery] = useState("")
  const [cases, setCases] = useState<Case[]>([])
  const [filteredCases, setFilteredCases] = useState<Case[]>([])
  const [caseSearchQuery, setCaseSearchQuery] = useState("")
  const [documents, setDocuments] = useState<Document[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
  
  const [selectedClientId, setSelectedClientId] = useState<string>("all")
  const [selectedCaseId, setSelectedCaseId] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  
  const [loadingClients, setLoadingClients] = useState(true)
  const [loadingCases, setLoadingCases] = useState(false)
  const [loadingDocuments, setLoadingDocuments] = useState(false)
  
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  
  const router = useRouter()
  const supabase = createClientComponentClient()
  
  // Load clients on page load
  useEffect(() => {
    fetchClients()
  }, [])
  
  // Filter cases when client changes
  useEffect(() => {
    if (selectedClientId && selectedClientId !== "all") {
      fetchCasesByClient(selectedClientId)
    } else {
      setCases([])
      setSelectedCaseId("all")
    }
  }, [selectedClientId])
  
  // Fetch documents when case changes
  useEffect(() => {
    if (selectedCaseId && selectedCaseId !== "all") {
      fetchDocumentsByCase(selectedCaseId)
    } else if (selectedClientId && selectedClientId !== "all") {
      fetchDocumentsByClient(selectedClientId)
    } else {
      setDocuments([])
      setFilteredDocuments([])
    }
  }, [selectedCaseId, selectedClientId])
  
  // Apply search filter
  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      setFilteredDocuments(
        documents.filter(doc => 
          doc.name.toLowerCase().includes(query) ||
          doc.description?.toLowerCase().includes(query) ||
          doc.case_title?.toLowerCase().includes(query) ||
          doc.client_name?.toLowerCase().includes(query)
        )
      )
    } else {
      setFilteredDocuments(documents)
    }
  }, [searchQuery, documents])
  
  // Filter clients when search changes
  useEffect(() => {
    if (clientSearchQuery) {
      const query = clientSearchQuery.toLowerCase()
      setFilteredClients(
        clients.filter(client => 
          client.first_name.toLowerCase().includes(query) ||
          client.last_name.toLowerCase().includes(query) ||
          (client.company_name && client.company_name.toLowerCase().includes(query))
        )
      )
    } else {
      setFilteredClients(clients)
    }
  }, [clientSearchQuery, clients])
  
  // Update filtered clients initially when clients are loaded
  useEffect(() => {
    setFilteredClients(clients)
  }, [clients])
  
  // Update filtered cases initially when cases are loaded
  useEffect(() => {
    setFilteredCases(cases)
  }, [cases])
  
  // Filter cases when search changes
  useEffect(() => {
    if (caseSearchQuery) {
      const query = caseSearchQuery.toLowerCase()
      setFilteredCases(
        cases.filter(caseItem => 
          caseItem.title.toLowerCase().includes(query) ||
          caseItem.case_number.toLowerCase().includes(query)
        )
      )
    } else {
      setFilteredCases(cases)
    }
  }, [caseSearchQuery, cases])
  
  const fetchClients = async () => {
    setLoadingClients(true)
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name, company_name, client_type')
        .order('created_at', { ascending: false })
      
      if (error) {
        throw error
      }
      
      setClients(data || [])
    } catch (error) {
      console.error('Error fetching clients:', error)
      toast.error("فشل في جلب قائمة العملاء")
    } finally {
      setLoadingClients(false)
    }
  }
  
  const fetchCasesByClient = async (clientId: string) => {
    setLoadingCases(true)
    try {
      const { data, error } = await supabase
        .from('cases')
        .select('id, title, case_number, client_id')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
      
      if (error) {
        throw error
      }
      
      setCases(data || [])
    } catch (error) {
      console.error('Error fetching cases:', error)
      toast.error("فشل في جلب قائمة القضايا")
    } finally {
      setLoadingCases(false)
    }
  }
  
  const fetchDocumentsByCase = async (caseId: string) => {
    setLoadingDocuments(true)
    try {
      const { data: caseData, error: caseError } = await supabase
        .from('cases')
        .select(`
          id, 
          title, 
          client_id,
          clients (
            id, 
            first_name, 
            last_name, 
            company_name
          )
        `)
        .eq('id', caseId)
        .single()
      
      if (caseError) {
        throw caseError
      }
      
      const { data, error } = await supabase
        .from('case_documents')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false })
      
      if (error) {
        throw error
      }
      
      // Combine documents with case and client info
      const docsWithDetails = (data || []).map(doc => {
        // Access clients as an object, not an array
        const clientData = caseData.clients as any
        const clientName = clientData?.company_name || 
          `${clientData?.first_name || ''} ${clientData?.last_name || ''}`
        
        return {
          ...doc,
          case_title: caseData.title,
          client_name: clientName
        }
      })
      
      setDocuments(docsWithDetails)
      setFilteredDocuments(docsWithDetails)
      
      // Pre-fetch file URLs for better performance
      fetchFileUrls(docsWithDetails)
    } catch (error) {
      console.error('Error fetching documents:', error)
      toast.error("فشل في جلب المستندات")
    } finally {
      setLoadingDocuments(false)
    }
  }
  
  const fetchDocumentsByClient = async (clientId: string) => {
    setLoadingDocuments(true)
    try {
      // First get all cases for this client
      const { data: clientCases, error: casesError } = await supabase
        .from('cases')
        .select('id, title')
        .eq('client_id', clientId)
      
      if (casesError) {
        throw casesError
      }
      
      // Get client info
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id, first_name, last_name, company_name')
        .eq('id', clientId)
        .single()
      
      if (clientError) {
        throw clientError
      }
      
      const clientName = clientData.company_name || 
        `${clientData.first_name} ${clientData.last_name}`
      
      // For each case, get documents
      if (clientCases && clientCases.length > 0) {
        const caseIds = clientCases.map(c => c.id)
        
        const { data, error } = await supabase
          .from('case_documents')
          .select('*')
          .in('case_id', caseIds)
          .order('created_at', { ascending: false })
        
        if (error) {
          throw error
        }
        
        // Combine documents with case titles
        const docsWithDetails = (data || []).map(doc => {
          const relatedCase = clientCases.find(c => c.id === doc.case_id)
          return {
            ...doc,
            case_title: relatedCase?.title || 'Unknown Case',
            client_name: clientName
          }
        })
        
        setDocuments(docsWithDetails)
        setFilteredDocuments(docsWithDetails)
        
        // Pre-fetch file URLs
        fetchFileUrls(docsWithDetails)
      } else {
        setDocuments([])
        setFilteredDocuments([])
      }
    } catch (error) {
      console.error('Error fetching documents by client:', error)
      toast.error("فشل في جلب المستندات")
    } finally {
      setLoadingDocuments(false)
    }
  }
  
  // Pre-fetch file URLs for better performance
  const fetchFileUrls = async (docs: Document[]) => {
    try {
      const docsWithUrls = await Promise.all(
        docs.map(async (doc) => {
          if (doc.file_path) {
            try {
              // Try primary bucket first (case-documents)
              let fileUrl = await getFileUrl(doc.file_path, 'case-documents')
              
              // If primary bucket fails, try secondary bucket (receipts)
              if (!fileUrl) {
                fileUrl = await getFileUrl(doc.file_path, 'receipts')
              }
              
              return { ...doc, file_url: fileUrl }
            } catch (err) {
              console.error('Error fetching URL for file:', doc.file_path, err)
              return doc
            }
          }
          return doc
        })
      )
      
      setDocuments(docsWithUrls as Document[])
      setFilteredDocuments(
        docsWithUrls.filter(d => 
          filteredDocuments.some(fd => fd.id === d.id)
        ) as Document[]
      )
    } catch (error) {
      console.error('Error pre-fetching file URLs:', error)
    }
  }
  
  const handlePreviewDocument = async (document: Document) => {
    setPreviewDocument(document)
    setPreviewLoading(true)
    
    try {
      if (document.file_url) {
        setPreviewUrl(document.file_url)
      } else if (document.file_path) {
        // Try primary bucket first
        let fileUrl = await getFileUrl(document.file_path, 'case-documents')
        
        // If primary bucket fails, try secondary bucket
        if (!fileUrl) {
          fileUrl = await getFileUrl(document.file_path, 'receipts')
        }
        
        if (fileUrl) {
          setPreviewUrl(fileUrl)
        } else {
          toast.error("تعذر الوصول إلى الملف")
        }
      } else {
        toast.error("لا يوجد ملف مرفق لهذا المستند")
      }
    } catch (error) {
      console.error('Error getting file URL:', error)
      toast.error("تعذر الوصول إلى الملف")
    } finally {
      setPreviewLoading(false)
    }
  }
  
  const closePreviewModal = () => {
    setPreviewDocument(null)
    setPreviewUrl(null)
  }
  
  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'غير محدد'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1048576).toFixed(1)} MB`
  }
  
  const formatDocumentDate = (dateString: string | null) => {
    if (!dateString) return 'غير محدد'
    return format(new Date(dateString), 'dd/MM/yyyy')
  }
  
  const getClientFullName = (client: Client) => {
    if (client.client_type === 'company' && client.company_name) {
      return client.company_name
    }
    return `${client.first_name} ${client.last_name}`
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">المستندات</h1>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>عرض مستندات القضايا</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Client Filter - Searchable Dropdown */}
            <div>
              <Select
                value={selectedClientId}
                onValueChange={setSelectedClientId}
                disabled={loadingClients}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر العميل" />
                </SelectTrigger>
                <SelectContent>
                  <div className="flex items-center px-2 pb-2 sticky top-0 bg-white z-10 border-b">
                    <Search className="h-4 w-4 opacity-50 absolute left-3" />
                    <Input 
                      placeholder="البحث عن عميل..." 
                      className="pl-8"
                      value={clientSearchQuery}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        e.stopPropagation();
                        setClientSearchQuery(e.target.value);
                      }}
                    />
                  </div>
                  <SelectItem value="all">جميع العملاء</SelectItem>
                  {filteredClients.length > 0 ? (
                    filteredClients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {getClientFullName(client)}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="text-center py-2 text-sm text-muted-foreground">
                      لا يوجد عملاء متطابقين مع البحث
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            {/* Case Filter */}
            <div>
              <Select
                value={selectedCaseId}
                onValueChange={setSelectedCaseId}
                disabled={loadingCases || cases.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={cases.length === 0 ? "اختر العميل أولا" : "اختر القضية"} />
                </SelectTrigger>
                <SelectContent>
                  {selectedClientId !== "all" && (
                    <div className="flex items-center px-2 pb-2 sticky top-0 bg-white z-10 border-b">
                      <Search className="h-4 w-4 opacity-50 absolute left-3" />
                      <Input 
                        placeholder="البحث عن قضية..." 
                        className="pl-8"
                        value={caseSearchQuery}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          e.stopPropagation();
                          setCaseSearchQuery(e.target.value);
                        }}
                      />
                    </div>
                  )}
                  {selectedClientId && <SelectItem value="all">جميع قضايا العميل</SelectItem>}
                  {filteredCases.length > 0 ? (
                    filteredCases.map(caseItem => (
                      <SelectItem key={caseItem.id} value={caseItem.id}>
                        {caseItem.title}
                      </SelectItem>
                    ))
                  ) : cases.length > 0 ? (
                    <div className="text-center py-2 text-sm text-muted-foreground">
                      لا توجد قضايا متطابقة مع البحث
                    </div>
                  ) : null}
                </SelectContent>
              </Select>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="البحث عن مستند..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          {/* Documents List */}
          {loadingDocuments ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="mt-2 text-muted-foreground">جاري تحميل المستندات...</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground opacity-20" />
              <p className="mt-4 text-lg font-medium">لا توجد مستندات متطابقة</p>
              <p className="text-muted-foreground mt-1">
                {selectedClientId === "all" 
                  ? "الرجاء اختيار عميل لعرض المستندات المرتبطة به"
                  : selectedCaseId === "all" 
                    ? "لا توجد مستندات مرتبطة بهذا العميل" 
                    : "لا توجد مستندات مرتبطة بهذه القضية"}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">اسم المستند</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>القضية</TableHead>
                    <TableHead>العميل</TableHead>
                    <TableHead>حجم الملف</TableHead>
                    <TableHead className="text-left">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((document) => (
                    <TableRow key={document.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{document.name}</span>
                          {document.description && (
                            <span className="text-sm text-muted-foreground">
                              {document.description}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatDocumentDate(document.document_date)}
                      </TableCell>
                      <TableCell>
                        {document.case_title}
                      </TableCell>
                      <TableCell>
                        {document.client_name}
                      </TableCell>
                      <TableCell>
                        {formatFileSize(document.file_size)}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            title="عرض المستند"
                            onClick={() => handlePreviewDocument(document)}
                            disabled={!document.file_path}
                          >
                            <Eye className="h-4 w-4 ml-2" />
                            عرض
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            title="تعديل المستند"
                            onClick={() => router.push(`/cases/${document.case_id}/documents/${document.id}/edit`)}
                          >
                            <FileText className="h-4 w-4 ml-2" />
                            تفاصيل
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
      
      {/* Document Preview Modal */}
      {previewDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative bg-white p-4 rounded-lg max-w-4xl max-h-[90vh] w-full flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b">
              <h3 className="text-lg font-bold">{previewDocument.name}</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={closePreviewModal}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </Button>
            </div>
            
            {/* Modal Body */}
            <div className="flex-grow overflow-auto">
              {previewLoading ? (
                <div className="flex items-center justify-center h-[400px]">
                  <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
                </div>
              ) : !previewUrl ? (
                <div className="text-center py-8">
                  <FileText className="h-16 w-16 mx-auto text-muted-foreground opacity-20" />
                  <p className="mt-4 text-lg font-medium">تعذر تحميل الملف</p>
                </div>
              ) : previewDocument.file_type?.startsWith('image/') || 
                   (previewDocument.file_name?.match(/\.(jpg|jpeg|png|gif)$/i)) ? (
                <div className="flex items-center justify-center">
                  <img 
                    src={previewUrl} 
                    alt={previewDocument.name}
                    className="max-w-full max-h-[70vh] object-contain"
                  />
                </div>
              ) : previewDocument.file_type === 'application/pdf' || 
                   (previewDocument.file_name?.endsWith('.pdf')) ? (
                <object
                  data={previewUrl}
                  type="application/pdf"
                  className="w-full h-[70vh]"
                >
                  <div className="text-center py-8">
                    <p>تعذر عرض ملف PDF. يرجى تنزيله لعرضه.</p>
                  </div>
                </object>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-16 w-16 mx-auto text-muted-foreground opacity-20" />
                  <p className="mt-4 text-lg font-medium">لا يمكن عرض هذا النوع من الملفات</p>
                  <p className="text-muted-foreground">يرجى تنزيل الملف لعرضه</p>
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="flex justify-end gap-2 mt-4 pt-2 border-t">
              <Button
                variant="outline"
                onClick={closePreviewModal}
              >
                إغلاق
              </Button>
              {previewUrl && (
                <Button
                  variant="default"
                  onClick={async () => {
                    try {
                      // Use fetch to get the file as a blob
                      const response = await fetch(previewUrl);
                      const blob = await response.blob();
                      
                      // Create a blob URL
                      const blobUrl = window.URL.createObjectURL(blob);
                      
                      // Create anchor and trigger download - this way should prompt a save dialog
                      const filename = previewDocument.file_name || previewDocument.name || 'document';
                      const a = document.createElement('a');
                      a.href = blobUrl;
                      a.download = filename;
                      a.style.display = 'none';
                      document.body.appendChild(a);
                      a.click();
                      
                      // Clean up
                      window.URL.revokeObjectURL(blobUrl);
                      document.body.removeChild(a);
                      
                      toast.success("جاري تنزيل الملف");
                    } catch (error) {
                      console.error('Error downloading file:', error);
                      toast.error("تعذر تنزيل الملف");
                    }
                  }}
                >
                  <Download className="h-4 w-4 ml-2" />
                  تنزيل الملف
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 