"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, X } from "lucide-react"
import { createCase, CaseFormState } from "@/app/actions/case-actions"
import { useActionState } from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { uploadFile } from "@/lib/supabase-file-upload"

// Define the proper type for the form state
type FormState = CaseFormState;

type Client = {
  id: string;
  first_name: string;
  last_name: string;
  company_name: string | null;
}

type Court = {
  id: string;
  name: string;
  location?: string | null;
}

type Party = {
  id: string;
  name: string;
  role: string;
  type: string;
  contact?: string;
}

type Document = {
  id: string;
  name: string;
  description?: string;
  date: string;
  file_path?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
}

const initialState: CaseFormState = {
  error: undefined,
  success: false,
  caseId: undefined,
  data: undefined
}

export default function NewCasePage() {
  const router = useRouter();
  const [state, formAction] = useActionState(createCase, initialState);
  const [clients, setClients] = useState<Client[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedCourt, setSelectedCourt] = useState<string>("");
  const [selectedCaseType, setSelectedCaseType] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingCourts, setLoadingCourts] = useState(true);
  
  // Party management
  const [showPartyDialog, setShowPartyDialog] = useState(false);
  const [parties, setParties] = useState<Party[]>([]);
  const [newParty, setNewParty] = useState<Omit<Party, 'id'>>({
    name: '',
    role: 'defendant',
    type: 'individual',
    contact: ''
  });

  // Document management
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [newDocument, setNewDocument] = useState<Omit<Document, 'id'>>({
    name: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const supabase = createClientComponentClient();
  
  // Log Supabase URL on component mount to verify it's correct
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('Environment check:', {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      });
    }
  }, []);
  
  // Fetch clients for the dropdown
  useEffect(() => {
    async function fetchClients() {
      try {
        setLoadingClients(true);
        const { data, error } = await supabase
          .from("clients")
          .select("id, first_name, last_name, company_name")
          .order("created_at", { ascending: false });
          
        if (error) throw error;
        
        setClients(data || []);
      } catch (error) {
        console.error("Error fetching clients:", error);
      } finally {
        setLoadingClients(false);
      }
    }
    
    fetchClients();
  }, [supabase]);
  
  // Fetch courts for the dropdown - Add retry mechanism
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 3;
    
    async function fetchCourts() {
      try {
        setLoadingCourts(true);
        console.log(`Fetching courts... (attempt ${attempts + 1}/${maxAttempts})`);
        
        const { data, error } = await supabase
          .from("courts")
          .select("id, name")
          .order("name", { ascending: true });
          
        if (error) {
          console.error("Error fetching courts:", error);
          throw error;
        }
        
        console.log('Courts data:', data);
        
        if (!data || data.length === 0) {
          console.warn("No courts found in the database!");
          
          if (attempts < maxAttempts - 1) {
            attempts++;
            // Wait a bit before retrying
            setTimeout(fetchCourts, 1000);
            return;
          }
        }
        
        setCourts(data || []);
      } catch (error) {
        console.error("Error fetching courts:", error);
        toast.error("فشل في تحميل المحاكم. الرجاء تحديث الصفحة.");
        
        if (attempts < maxAttempts - 1) {
          attempts++;
          // Wait a bit before retrying
          setTimeout(fetchCourts, 1000);
        }
      } finally {
        if (attempts >= maxAttempts - 1) {
          setLoadingCourts(false);
        }
      }
    }
    
    fetchCourts();
  }, [supabase]);
  
  // Handle the server action response
  useEffect(() => {
    if (state.success) {
      toast.success("تم إضافة القضية بنجاح");
      router.push("/cases");
    } else if (state.error) {
      toast.error(state.error);
      setIsSubmitting(false);
    }
  }, [state, router]);

  // Format client name for display
  const getClientName = (client: Client) => {
    return client.company_name 
      ? `${client.company_name}`
      : `${client.first_name} ${client.last_name}`;
  };

  // Add a new party
  const handleAddParty = () => {
    const party: Party = {
      id: crypto.randomUUID(),
      name: newParty.name,
      role: newParty.role,
      type: newParty.type,
      contact: newParty.contact
    };
    
    setParties([...parties, party]);
    setNewParty({
      name: '',
      role: 'defendant',
      type: 'individual',
      contact: ''
    });
    setShowPartyDialog(false);
    toast.success("تمت إضافة الطرف بنجاح");
  };

  // Remove a party
  const handleRemoveParty = (id: string) => {
    setParties(parties.filter(party => party.id !== id));
    toast.success("تم حذف الطرف");
  };

  // Add a new document
  const handleAddDocument = async () => {
    try {
      setUploading(true);
      setUploadError(null);
      
      let filePath: string | undefined = undefined;
      let fileName: string | undefined = undefined;
      let fileType: string | undefined = undefined;
      let fileSize: number | undefined = undefined;
      
      // Upload the file if one is selected
      if (selectedFile) {
        const { path, error } = await uploadFile(selectedFile, 'case-documents');
        
        if (error) {
          setUploadError(`فشل في رفع الملف: ${error.message}`);
          setUploading(false);
          return;
        }
        
        if (path) {
          filePath = path;
          fileName = selectedFile.name;
          fileType = selectedFile.type;
          fileSize = selectedFile.size;
        }
      }
      
      const document: Document = {
        id: crypto.randomUUID(),
        name: newDocument.name,
        description: newDocument.description,
        date: newDocument.date,
        file_path: filePath,
        file_name: fileName,
        file_type: fileType,
        file_size: fileSize
      };
      
      setDocuments([...documents, document]);
      setNewDocument({
        name: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      setSelectedFile(null);
      setShowDocumentDialog(false);
      toast.success("تمت إضافة المستند بنجاح");
    } catch (error) {
      console.error("Error adding document:", error);
      setUploadError("حدث خطأ أثناء إضافة المستند");
    } finally {
      setUploading(false);
    }
  };

  // File input handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      
      // If no document name is provided, use the file name
      if (!newDocument.name) {
        setNewDocument({
          ...newDocument,
          name: e.target.files[0].name.split('.')[0] // Remove extension
        });
      }
    }
  };

  // Remove a document
  const handleRemoveDocument = (id: string) => {
    setDocuments(documents.filter(doc => doc.id !== id));
    toast.success("تم حذف المستند");
  };

  // Get role display name
  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'plaintiff': return 'مدعي';
      case 'defendant': return 'مدعى عليه';
      case 'witness': return 'شاهد';
      case 'expert': return 'خبير';
      default: return role;
    }
  };

  // Get type display name
  const getTypeDisplay = (type: string) => {
    switch (type) {
      case 'individual': return 'فرد';
      case 'company': return 'شركة';
      case 'government': return 'جهة حكومية';
      default: return type;
    }
  };

  // Add form validation state
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  
  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    // Check required fields
    if (!selectedCourt) {
      errors.court = "يرجى اختيار المحكمة";
    }
    
    if (!selectedCaseType) {
      errors.caseType = "يرجى اختيار نوع القضية";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Custom form submission handler
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    console.log("Form submission started");
    
    // Get form element values
    const formElement = e.currentTarget;
    const titleInput = formElement.querySelector('#title') as HTMLInputElement;
    const caseNumberInput = formElement.querySelector('#case-number') as HTMLInputElement;
    
    console.log("Fields:", {
      title: titleInput?.value,
      caseNumber: caseNumberInput?.value,
      courtId: selectedCourt,
      caseType: selectedCaseType,
      clientId: selectedClientId,
      parties: parties.length,
      documents: documents.length
    });
    
    // Add validation for title field explicitly
    if (!titleInput?.value) {
      e.preventDefault();
      toast.error("موضوع القضية مطلوب");
      return;
    }
    
    if (!validateForm()) {
      e.preventDefault(); // Prevent form submission if validation fails
      toast.error("يرجى تصحيح الأخطاء قبل الإرسال");
      return;
    }
    
    // If validation passes, allow the form to submit and update UI state
    console.log("Form validation passed, submitting form...");
    setIsSubmitting(true);
  };

  // Reset submitting state when action completes
  useEffect(() => {
    if (state.error || state.success) {
      setIsSubmitting(false);
    }
  }, [state]);
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-right">إنشاء قضية جديدة</h1>

      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <form action={formAction} onSubmit={handleFormSubmit}>
        {/* Add hidden input fields for form data */}
        <input type="hidden" name="court-id" value={selectedCourt} />
        <input type="hidden" name="case-type" value={selectedCaseType} />
        <input type="hidden" name="status" value="active" />
        <input type="hidden" name="priority" value="medium" />
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">معلومات القضية الأساسية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="court">المحكمة*</Label>
                <Select 
                  name="court" 
                  value={selectedCourt} 
                  onValueChange={(value) => {
                    setSelectedCourt(value);
                    setFormErrors({...formErrors, court: ''});
                  }}
                  required
                >
                  <SelectTrigger className={formErrors.court ? "border-red-500" : ""}>
                    <SelectValue placeholder={loadingCourts ? "جاري تحميل المحاكم..." : courts.length === 0 ? "لا توجد محاكم متاحة" : "اختر المحكمة"} />
                  </SelectTrigger>
                  <SelectContent>
                    {courts.length === 0 ? (
                      <SelectItem value="no-courts" disabled>لا توجد محاكم في قاعدة البيانات</SelectItem>
                    ) : (
                      courts.map(court => (
                        <SelectItem key={court.id} value={court.id}>
                          {court.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {formErrors.court && (
                  <p className="text-xs text-red-500">{formErrors.court}</p>
                )}
                {courts.length === 0 && !loadingCourts && (
                  <p className="text-sm text-red-500 mt-1">تحذير: لا توجد محاكم في قاعدة البيانات. يرجى إضافة محاكم أولاً.</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="case-type">نوع القضية*</Label>
                <Select 
                  name="case-type" 
                  value={selectedCaseType} 
                  onValueChange={(value) => setSelectedCaseType(value)}
                  required
                >
                  <SelectTrigger className={formErrors.caseType ? "border-red-500" : ""}>
                    <SelectValue placeholder="اختر نوع القضية" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="civil">مدني</SelectItem>
                    <SelectItem value="commercial">تجاري</SelectItem>
                    <SelectItem value="criminal">جنائي</SelectItem>
                    <SelectItem value="family">أحوال شخصية</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.caseType && (
                  <p className="text-xs text-red-500">{formErrors.caseType}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="client-id">الموكل*</Label>
                <Select 
                  name="client-id" 
                  value={selectedClientId} 
                  onValueChange={(value) => setSelectedClientId(value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingClients ? "جاري تحميل العملاء..." : "اختر الموكل"} />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {getClientName(client)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="opponent-name">الخصم</Label>
                <Input 
                  id="opponent-name" 
                  name="opponent-name" 
                  placeholder="أدخل اسم الخصم" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fee-amount">قيمة القضية</Label>
                <Input id="fee-amount" name="fee-amount" type="number" placeholder="0" required />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fee-type">نوع الرسوم</Label>
                <Select 
                  name="fee-type" 
                  defaultValue="percentage"
                >
                  <SelectTrigger id="fee-type">
                    <SelectValue placeholder="اختر نوع الرسوم" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">نسبة مئوية</SelectItem>
                    <SelectItem value="fixed">مبلغ ثابت</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">موضوع القضية*</Label>
                <Input 
                  id="title" 
                  name="title" 
                  placeholder="أدخل موضوع القضية" 
                  required 
                  defaultValue="قضية جديدة"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="case-number">رقم القضية</Label>
                <Input 
                  id="case-number" 
                  name="case-number" 
                  placeholder="أدخل رقم القضية" 
                  defaultValue={`${new Date().getFullYear()}/${Math.floor(Math.random() * 900) + 100}`}
                />
                <p className="text-xs text-gray-500">سيتم إنشاء رقم تلقائي إذا تركت الحقل فارغًا</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">وصف القضية</Label>
              <Textarea id="description" name="description" placeholder="أدخل وصفاً تفصيلياً للقضية" rows={5} />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="priority">الأولوية</Label>
                <Select 
                  name="priority" 
                  defaultValue="medium"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الأولوية" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">عالية</SelectItem>
                    <SelectItem value="medium">متوسطة</SelectItem>
                    <SelectItem value="low">منخفضة</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">الحالة</Label>
                <Select 
                  name="status" 
                  defaultValue="active"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="pending">معلق</SelectItem>
                    <SelectItem value="closed">مغلق</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">الأطراف</CardTitle>
            <Dialog open={showPartyDialog} onOpenChange={setShowPartyDialog}>
              <DialogTrigger asChild>
                <Button type="button" size="sm" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  إضافة طرف
                </Button>
              </DialogTrigger>
              <DialogContent className="text-right">
                <DialogHeader>
                  <DialogTitle>إضافة طرف جديد</DialogTitle>
                  <DialogDescription>
                    أدخل معلومات الطرف المراد إضافته للقضية
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="party-name">اسم الطرف*</Label>
                    <Input 
                      id="party-name" 
                      value={newParty.name}
                      onChange={e => setNewParty({...newParty, name: e.target.value})}
                      placeholder="أدخل اسم الطرف" 
                      required 
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="party-role">دور الطرف*</Label>
                      <Select 
                        value={newParty.role}
                        onValueChange={value => setNewParty({...newParty, role: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر دور الطرف" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="plaintiff">مدعي</SelectItem>
                          <SelectItem value="defendant">مدعى عليه</SelectItem>
                          <SelectItem value="witness">شاهد</SelectItem>
                          <SelectItem value="expert">خبير</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="party-type">نوع الطرف*</Label>
                      <Select 
                        value={newParty.type}
                        onValueChange={value => setNewParty({...newParty, type: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر نوع الطرف" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="individual">فرد</SelectItem>
                          <SelectItem value="company">شركة</SelectItem>
                          <SelectItem value="government">جهة حكومية</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="party-contact">معلومات الاتصال</Label>
                    <Input 
                      id="party-contact" 
                      value={newParty.contact || ''}
                      onChange={e => setNewParty({...newParty, contact: e.target.value})}
                      placeholder="رقم الهاتف أو البريد الإلكتروني" 
                    />
                  </div>
                </div>
                <DialogFooter className="sm:justify-end">
                  <Button type="button" variant="outline" onClick={() => setShowPartyDialog(false)}>
                    إلغاء
                  </Button>
                  <Button 
                    type="button" 
                    disabled={!newParty.name} 
                    onClick={handleAddParty}
                  >
                    إضافة
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {parties.length > 0 ? (
              <div className="space-y-4">
                {parties.map(party => (
                  <div 
                    key={party.id} 
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div>
                      <div className="font-medium">{party.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {getRoleDisplay(party.role)} • {getTypeDisplay(party.type)}
                        {party.contact && <> • {party.contact}</>}
                      </div>
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleRemoveParty(party.id)}
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-sm text-muted-foreground py-8">
                لا يوجد أطراف. انقر على "إضافة طرف" لإضافة طرف جديد.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">المستندات</CardTitle>
            <Dialog open={showDocumentDialog} onOpenChange={setShowDocumentDialog}>
              <DialogTrigger asChild>
                <Button type="button" size="sm" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  إضافة مستندات
                </Button>
              </DialogTrigger>
              <DialogContent className="text-right">
                <DialogHeader>
                  <DialogTitle>إضافة مستند جديد</DialogTitle>
                  <DialogDescription>
                    أدخل معلومات المستند المراد إضافته للقضية
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="document-name">اسم المستند*</Label>
                    <Input 
                      id="document-name" 
                      value={newDocument.name}
                      onChange={e => setNewDocument({...newDocument, name: e.target.value})}
                      placeholder="أدخل اسم المستند" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="document-date">تاريخ المستند</Label>
                    <Input 
                      type="date"
                      id="document-date" 
                      value={newDocument.date}
                      onChange={e => setNewDocument({...newDocument, date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="document-description">وصف المستند</Label>
                    <Textarea 
                      id="document-description" 
                      value={newDocument.description || ''}
                      onChange={e => setNewDocument({...newDocument, description: e.target.value})}
                      placeholder="أدخل وصف المستند"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="document-file">ملف المستند (PDF, Word, الخ)</Label>
                    <Input 
                      id="document-file"
                      type="file"
                      onChange={handleFileChange}
                      className="cursor-pointer"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    />
                    {selectedFile && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedFile.name} ({Math.round(selectedFile.size / 1024)} كيلوبايت)
                      </p>
                    )}
                  </div>
                  {uploadError && (
                    <p className="text-xs text-red-500 mt-1">{uploadError}</p>
                  )}
                </div>
                <DialogFooter className="sm:justify-end">
                  <Button type="button" variant="outline" onClick={() => setShowDocumentDialog(false)}>
                    إلغاء
                  </Button>
                  <Button 
                    type="button" 
                    disabled={!newDocument.name || uploading} 
                    onClick={handleAddDocument}
                  >
                    {uploading ? "جاري الرفع..." : "إضافة"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {documents.length > 0 ? (
              <div className="space-y-4">
                {documents.map(doc => (
                  <div 
                    key={doc.id} 
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div>
                      <div className="font-medium">{doc.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(doc.date).toLocaleDateString('en-US')}
                        {doc.description && <> • {doc.description}</>}
                        {doc.file_name && <> • {doc.file_name}</>}
                      </div>
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleRemoveDocument(doc.id)}
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-sm text-muted-foreground py-8">
                لا توجد مستندات. انقر على "إضافة مستندات" لإضافة مستندات جديدة.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add hidden inputs to include parties and documents data in the form submission */}
        <input 
          type="hidden" 
          name="parties" 
          value={JSON.stringify(parties)} 
        />
        <input 
          type="hidden" 
          name="documents" 
          value={JSON.stringify(documents)} 
        />

        <div className="flex justify-end gap-4 mt-6">
          <Link href="/cases">
            <Button variant="outline" type="button">إلغاء</Button>
          </Link>
          <Button 
            type="submit" 
            disabled={isSubmitting || courts.length === 0}
            className="min-w-[120px]"
            onClick={() => {
              // Simple direct console log
              const titleField = document.getElementById('title') as HTMLInputElement;
              console.log("Title field value:", titleField?.value);
            }}
          >
            {isSubmitting ? (
              <>
                <span className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                جاري الحفظ...
              </>
            ) : "حفظ القضية"}
          </Button>
        </div>
      </form>
    </div>
  )
}
