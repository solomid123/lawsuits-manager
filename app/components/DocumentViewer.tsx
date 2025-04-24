"use client"

import { useState, useEffect } from "react"
import { getFileUrl } from "@/lib/supabase-file-upload"
import { FileText, FileImage, File, Download, ExternalLink, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface DocumentViewerProps {
  filePath?: string
  fileName?: string
  fileType?: string
  fileSize?: number
}

export default function DocumentViewer({
  filePath,
  fileName,
  fileType,
  fileSize
}: DocumentViewerProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [isImage, setIsImage] = useState(false)
  const [isPdf, setIsPdf] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [pdfLoadFailed, setPdfLoadFailed] = useState(false)
  const [currentBucket, setCurrentBucket] = useState('case-documents')
  
  // Function to retry with different bucket
  const retryWithDifferentBucket = () => {
    // Try with another bucket
    const nextBucket = currentBucket === 'case-documents' ? 'receipts' : 'case-documents'
    setCurrentBucket(nextBucket)
    setError(null)
    setLoading(true)
  }
  
  useEffect(() => {
    async function fetchFileUrl() {
      if (filePath) {
        try {
          setLoading(true)
          setPdfLoadFailed(false)
          
          // Get file URL asynchronously
          const url = await getFileUrl(filePath, currentBucket)
          if (url) {
            setFileUrl(url)
          } else {
            setError(`تعذر الوصول إلى الملف. يرجى التحقق من صلاحيات التخزين.`)
          }
          
          // Check file type to determine appropriate viewer
          if (fileType) {
            setIsImage(fileType.startsWith('image/'))
            setIsPdf(fileType === 'application/pdf' || fileType.includes('pdf'))
          } else if (fileName) {
            // Fallback to checking extension if fileType not available
            const ext = fileName.split('.').pop()?.toLowerCase()
            setIsImage(['jpg', 'jpeg', 'png', 'gif'].includes(ext || ''))
            setIsPdf(ext === 'pdf')
          }
        } catch (err) {
          console.error('Error getting file URL:', err)
          setError('حدث خطأ أثناء تحميل الملف. يرجى التحقق من صلاحيات التخزين.')
        } finally {
          setLoading(false)
        }
      }
    }
    
    fetchFileUrl()
  }, [filePath, fileType, fileName, currentBucket])
  
  // Check if the file exists by preloading it (for images)
  useEffect(() => {
    if (fileUrl && isImage) {
      const img = new Image()
      img.onload = () => {
        setError(null)
      }
      img.onerror = () => {
        setError('تعذر الوصول إلى الملف. يرجى التحقق من صلاحيات التخزين.')
      }
      img.src = fileUrl
    }
  }, [fileUrl, isImage])

  // Handle PDF load error
  const handlePdfLoadError = () => {
    console.error('PDF load failed')
    setPdfLoadFailed(true)
  }
  
  // Fix the handleDownload function to use fetch + blob
  const handleDownload = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!fileUrl) return;
    
    try {
      // Use fetch to get the file as a blob
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      
      // Create a blob URL
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Create anchor and trigger download - this way should prompt a save dialog
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName || filePath?.split('/').pop() || 'document';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center bg-gray-100 rounded-md p-8">
        <div className="text-center text-muted-foreground">
          <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent mx-auto mb-2"></div>
          <p>جاري تحميل الملف...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
        <div className="mt-2 flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.location.reload()}
          >
            إعادة المحاولة
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={retryWithDifferentBucket}
          >
            إعادة المحاولة بمكان تخزين آخر
          </Button>
        </div>
      </Alert>
    )
  }
  
  if (!filePath || !fileUrl) {
    return (
      <div className="flex items-center justify-center bg-gray-100 rounded-md p-8">
        <div className="text-center text-muted-foreground">
          <File className="h-12 w-12 mx-auto mb-2" />
          <p>لا يوجد ملف</p>
        </div>
      </div>
    )
  }
  
  // Format file size to readable format
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return ''
    
    if (bytes < 1024) return `${bytes} bytes`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }
  
  return (
    <div className="border rounded-md overflow-hidden flex flex-col">
      <div className="p-3 bg-gray-50 border-b flex justify-between items-center">
        <div className="flex items-center">
          {isImage ? (
            <FileImage className="h-5 w-5 text-blue-500 mr-2" />
          ) : isPdf ? (
            <FileText className="h-5 w-5 text-red-500 mr-2" />
          ) : (
            <File className="h-5 w-5 text-gray-500 mr-2" />
          )}
          <span className="font-medium truncate max-w-[200px]">
            {fileName || filePath.split('/').pop()}
          </span>
          {fileSize && (
            <span className="text-xs text-muted-foreground mr-2">
              ({formatFileSize(fileSize)})
            </span>
          )}
        </div>
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <a href={fileUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
      
      <div className="p-0 flex-grow">
        {isImage ? (
          <div className="p-4 flex items-center justify-center bg-gray-50">
            <img 
              src={fileUrl} 
              alt={fileName || "صورة المستند"} 
              className="max-w-full max-h-[400px] object-contain"
              onError={() => setError('تعذر تحميل الصورة. يرجى التحقق من صلاحيات التخزين.')}
            />
          </div>
        ) : isPdf && !pdfLoadFailed ? (
          <div className="relative">
            {/* Using object tag instead of iframe for better PDF support */}
            <object
              data={fileUrl}
              type="application/pdf"
              className="w-full h-[400px]"
              onError={handlePdfLoadError}
            >
              <div className="p-8 flex items-center justify-center bg-gray-50 h-full">
                <div className="text-center">
                  <FileText className="h-16 w-16 mx-auto mb-3 text-red-400" />
                  <p className="text-muted-foreground">
                    تعذر تحميل ملف PDF في المتصفح. يرجى فتحه في متصفح منفصل أو تنزيله.
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center gap-2 mt-4">
                    <Button variant="outline" onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-2" />
                      تنزيل الملف
                    </Button>
                    <Button variant="outline" asChild>
                      <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        فتح في متصفح منفصل
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </object>
            <div className="absolute bottom-4 right-4">
              <Button variant="secondary" size="sm" asChild>
                <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  عرض في نافذة جديدة
                </a>
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-8 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <File className="h-16 w-16 mx-auto mb-3 text-gray-400" />
              <p className="text-muted-foreground">
                لا يمكن عرض محتوى هذا الملف. يرجى تنزيله لعرضه.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-2 mt-4">
                <Button variant="outline" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  تنزيل الملف
                </Button>
                <Button variant="outline" asChild>
                  <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    فتح في علامة تبويب جديدة
                  </a>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 