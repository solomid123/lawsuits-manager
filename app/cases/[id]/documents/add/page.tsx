"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { addCaseDocument } from "@/app/actions/case-document-actions"
import { uploadFile } from "@/lib/supabase-file-upload"
import Link from "next/link"
import { FileText } from "lucide-react"

export default function AddCaseDocumentPage() {
  const params = useParams()
  const router = useRouter()
  const caseId = params.id as string
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    document_date: new Date().toISOString().split('T')[0]
  })
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0])
      
      // If no document name is provided, use the file name
      if (!formData.name) {
        setFormData({
          ...formData,
          name: e.target.files[0].name.split('.')[0] // Remove extension
        })
      }
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
      console.log("Starting document upload process...")
      
      let filePath: string | undefined = undefined
      let fileName: string | undefined = undefined
      let fileType: string | undefined = undefined
      let fileSize: number | undefined = undefined
      
      // Upload the file if one is selected
      if (selectedFile) {
        console.log("Uploading file:", selectedFile.name, "Size:", selectedFile.size)
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
      } else {
        console.log("No file selected, proceeding without file upload")
      }
      
      // Prepare document data
      const documentData = {
        case_id: caseId,
        name: formData.name,
        description: formData.description || undefined,
        document_date: formData.document_date || undefined,
        file_path: filePath,
        file_name: fileName,
        file_type: fileType,
        file_size: fileSize
      }
      console.log("Saving document to database:", documentData)
      
      // Save document to database
      const result = await addCaseDocument(documentData)
      console.log("Document save result:", result)
      
      if ('error' in result && result.error) {
        console.error("Error saving document:", result.error)
        toast.error(result.error)
        setError(result.error)
      } else {
        console.log("Document saved successfully")
        toast.success("تمت إضافة المستند بنجاح")
        router.push(`/cases/${caseId}?tab=documents`)
      }
    } catch (error: any) {
      console.error("Error adding document:", error)
      setError(error.message || "حدث خطأ أثناء إضافة المستند")
      toast.error("حدث خطأ أثناء إضافة المستند")
    } finally {
      setUploading(false)
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">إضافة مستند</h1>
      </div>
      
      <form onSubmit={handleSubmit}>
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
            
            <div className="space-y-2">
              <Label htmlFor="file">ملف المستند (PDF, Word, الخ)</Label>
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
                      حذف الملف
                    </Button>
                  </div>
                ) : (
                  <div className="py-4">
                    <FileText className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      اسحب ملفاً إلى هنا، أو انقر للاختيار
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
                <Link href={`/cases/${caseId}`}>إلغاء</Link>
              </Button>
              <Button type="submit" disabled={uploading}>
                {uploading ? "جارٍ الرفع والحفظ..." : "حفظ المستند"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
} 