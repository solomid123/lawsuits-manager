"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { getCaseDocument, updateCaseDocument } from "@/app/actions/case-document-actions"
import { uploadFile, getFileUrl } from "@/lib/supabase-file-upload"
import Link from "next/link"
import { FileText, Loader2, Download } from "lucide-react"
import DocumentViewer from "@/app/components/DocumentViewer"

export default function EditCaseDocumentPage() {
  const params = useParams()
  const router = useRouter()
  const caseId = params.id as string
  const documentId = params.documentId as string
  
  const [formData, setFormData] = useState({
    id: documentId,
    case_id: caseId,
    name: "",
    description: "",
    document_date: new Date().toISOString().split('T')[0]
  })
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [documentData, setDocumentData] = useState<any>(null)
  
  // Fetch document data
  useEffect(() => {
    async function fetchDocument() {
      try {
        setLoading(true)
        setError(null)
        
        const result = await getCaseDocument(documentId)
        
        if ('error' in result && result.error) {
          setError(result.error)
          toast.error(result.error)
          return
        }
        
        if (result.data) {
          setDocumentData(result.data)
          
          // Update form data with document details
          setFormData({
            id: documentId,
            case_id: caseId,
            name: result.data.name || "",
            description: result.data.description || "",
            document_date: result.data.document_date ? 
              new Date(result.data.document_date).toISOString().split('T')[0] : 
              new Date().toISOString().split('T')[0]
          })
        }
      } catch (err: any) {
        console.error("Error fetching document:", err)
        setError(err.message || "An error occurred while loading the document")
        toast.error("Failed to load document details")
      } finally {
        setLoading(false)
      }
    }
    
    fetchDocument()
  }, [documentId, caseId])
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0])
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name) {
      toast.error("يرجى إدخال اسم المستند")
      return
    }
    
    try {
      setUploading(true)
      setError(null)
      console.log("Starting document update process...")
      
      let filePath = documentData?.file_path || undefined
      let fileName = documentData?.file_name || undefined
      let fileType = documentData?.file_type || undefined
      let fileSize = documentData?.file_size || undefined
      
      // Upload the file if a new one is selected
      if (selectedFile) {
        console.log("Uploading new file:", selectedFile.name, "Size:", selectedFile.size)
        const { path, error } = await uploadFile(selectedFile, 'case-documents')
        
        if (error) {
          console.error("File upload error:", error)
          setError(`فشل في رفع الملف: ${error.message}`)
          setUploading(false)
          toast.error(`فشل في رفع الملف: ${error.message}`)
          return
        }
        
        if (path) {
          console.log("File uploaded successfully, path:", path)
          filePath = path
          fileName = selectedFile.name
          fileType = selectedFile.type
          fileSize = selectedFile.size
        }
      }
      
      // Prepare document data for update
      const updateData = {
        id: documentId,
        case_id: caseId,
        name: formData.name,
        description: formData.description || undefined,
        document_date: formData.document_date || undefined,
        file_path: filePath,
        file_name: fileName,
        file_type: fileType,
        file_size: fileSize
      }
      
      console.log("Updating document in database:", updateData)
      
      // Update document in database
      const result = await updateCaseDocument(updateData)
      console.log("Document update result:", result)
      
      if ('error' in result && result.error) {
        console.error("Error updating document:", result.error)
        toast.error(result.error)
        setError(result.error)
      } else {
        console.log("Document updated successfully")
        toast.success("تم تحديث المستند بنجاح")
        router.push(`/cases/${caseId}?tab=documents`)
      }
    } catch (error: any) {
      console.error("Error updating document:", error)
      setError(error.message || "حدث خطأ أثناء تحديث المستند")
      toast.error("حدث خطأ أثناء تحديث المستند")
    } finally {
      setUploading(false)
    }
  }
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">جارٍ تحميل بيانات المستند...</p>
      </div>
    )
  }
  
  if (error && !documentData) {
    return (
      <div className="bg-red-50 text-red-700 p-6 rounded-md">
        <h2 className="text-lg font-medium mb-2">خطأ في تحميل المستند</h2>
        <p>{error}</p>
        <Button className="mt-4" asChild>
          <Link href={`/cases/${caseId}?tab=documents`}>العودة إلى المستندات</Link>
        </Button>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">تعديل المستند</h1>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">معلومات المستند</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">اسم المستند*</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="أدخل اسم المستند"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="document_date">تاريخ المستند</Label>
                <Input
                  id="document_date"
                  type="date"
                  value={formData.document_date}
                  onChange={(e) => setFormData({...formData, document_date: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">وصف المستند</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="أدخل وصف المستند"
                  rows={3}
                />
              </div>
              
              {/* Show only if there's an existing file */}
              {documentData?.file_path && !selectedFile && (
                <div className="p-4 border rounded-md">
                  <Label className="mb-2 block">الملف الحالي</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    {documentData.file_name || "ملف موجود"}
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="file">تحديث الملف (اختياري)</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                  {selectedFile ? (
                    <div className="py-2">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="text-sm">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(1)} كيلوبايت
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => setSelectedFile(null)}
                      >
                        إلغاء
                      </Button>
                    </div>
                  ) : (
                    <div className="py-4">
                      <FileText className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        اسحب ملفاً إلى هنا، أو انقر للاختيار
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        (اترك هذا فارغًا للاحتفاظ بالملف الحالي)
                      </p>
                      <Input
                        id="file"
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => document.getElementById('file')?.click()}
                      >
                        اختر ملفاً
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
                  {error}
                </div>
              )}
              
              <div className="flex justify-end gap-4 pt-4">
                <Button asChild variant="outline">
                  <Link href={`/cases/${caseId}?tab=documents`}>إلغاء</Link>
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? "جارٍ الحفظ..." : "حفظ التغييرات"}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {documentData?.file_path && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">معاينة المستند</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex justify-end">
                  <Button 
                    variant="default" 
                    onClick={() => {
                      if (documentData.file_path) {
                        const handleDownload = async () => {
                          try {
                            // Try primary bucket first
                            let fileUrl = await getFileUrl(documentData.file_path, 'case-documents')
                            
                            // If primary bucket fails, try secondary bucket
                            if (!fileUrl) {
                              fileUrl = await getFileUrl(documentData.file_path, 'receipts')
                            }
                            
                            if (fileUrl) {
                              // Instead of using an anchor tag, we'll use fetch to get the file as a blob
                              const response = await fetch(fileUrl);
                              const blob = await response.blob();
                              
                              // Create a blob URL
                              const blobUrl = window.URL.createObjectURL(blob);
                              
                              // Use saveAs function (via an anchor with download attribute)
                              const filename = documentData.file_name || 'document';
                              
                              // Create anchor and trigger download with saveAs-like behavior
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
                            } else {
                              toast.error("تعذر الوصول إلى الملف");
                            }
                          } catch (error) {
                            console.error('Error downloading file:', error);
                            toast.error("تعذر تنزيل الملف");
                          }
                        };
                        handleDownload();
                      }
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    تنزيل الملف
                  </Button>
                </div>
                <DocumentViewer
                  filePath={documentData.file_path}
                  fileName={documentData.file_name}
                  fileType={documentData.file_type}
                  fileSize={documentData.file_size}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </form>
    </div>
  )
} 