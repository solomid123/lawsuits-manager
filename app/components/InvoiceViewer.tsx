"use client"

import { useState, useEffect } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FileText, Download, Edit, Printer, Loader2 } from "lucide-react"
import { useRouter } from 'next/navigation'

interface InvoiceViewerProps {
  invoiceId: string
  invoiceNumber: string
  pdfUrl: string
  triggerButton?: React.ReactNode // Optional custom trigger button
}

export default function InvoiceViewer({ 
  invoiceId, 
  invoiceNumber, 
  pdfUrl,
  triggerButton
}: InvoiceViewerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Handle download
  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = pdfUrl
    link.download = `فاتورة-${invoiceNumber}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Handle print
  const handlePrint = () => {
    // Open the PDF URL in a new window and trigger print
    const printWindow = window.open(pdfUrl, '_blank')
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        printWindow.print()
      })
    } else {
      // If popup was blocked, offer direct link
      alert('تم حظر النافذة المنبثقة. يرجى السماح بالنوافذ المنبثقة لطباعة الفاتورة.')
    }
  }

  // Navigate to edit page
  const handleEdit = () => {
    setIsOpen(false)
    
    // If we're in preview mode (invoiceId is "preview") or if we're already on the 
    // invoice creation page, just close the dialog
    if (invoiceId === "preview" || window.location.pathname === "/invoices") {
      // No need to navigate, just close the dialog
      return
    }
    
    // Otherwise, navigate to the invoice creation page with the invoice ID
    router.push(`/invoices?id=${invoiceId}`)
  }

  // Reset loading state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setLoading(true)
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="outline" size="sm">
            <FileText className="ml-2 h-4 w-4" />
            عرض الفاتورة
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[85vh]">
        <DialogHeader className="flex flex-row justify-between items-center">
          <DialogTitle>فاتورة رقم: {invoiceNumber}</DialogTitle>
          <div className="flex gap-2">
            <Button onClick={handleEdit} variant="outline" size="sm">
              <Edit className="ml-2 h-4 w-4" />
              تعديل
            </Button>
            <Button onClick={handlePrint} variant="outline" size="sm">
              <Printer className="ml-2 h-4 w-4" />
              طباعة
            </Button>
            <Button onClick={handleDownload} variant="outline" size="sm">
              <Download className="ml-2 h-4 w-4" />
              تنزيل
            </Button>
          </div>
        </DialogHeader>
        
        <div className="relative h-full w-full rounded-md overflow-hidden">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-secondary/50">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          <iframe 
            src={`${pdfUrl}#toolbar=0`} 
            className="w-full h-full" 
            onLoad={() => setLoading(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
} 