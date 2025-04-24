"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Skeleton } from "@/components/ui/skeleton"

type Client = {
  id: string;
  client_type: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  national_id: string | null;
  notes: string | null;
}

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClientComponentClient();
  
  // Fetch client data
  useEffect(() => {
    async function fetchClient() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("clients")
          .select("*")
          .eq("id", clientId)
          .single();
          
        if (error) throw error;
        
        setClient(data);
      } catch (error) {
        console.error("Error fetching client:", error);
        setError("فشل في جلب بيانات العميل");
      } finally {
        setLoading(false);
      }
    }
    
    if (clientId) {
      fetchClient();
    }
  }, [clientId, supabase]);
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!client) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("clients")
        .update({
          client_type: client.client_type,
          first_name: client.first_name,
          last_name: client.last_name,
          email: client.email,
          phone: client.phone,
          company_name: client.company_name,
          address: client.address,
          city: client.city,
          postal_code: client.postal_code,
          national_id: client.national_id,
          notes: client.notes
        })
        .eq("id", clientId);
        
      if (error) throw error;
      
      toast.success("تم تحديث بيانات العميل بنجاح");
      router.push("/clients/settings");
    } catch (error) {
      console.error("Error updating client:", error);
      setError("فشل في تحديث بيانات العميل");
      toast.error("حدث خطأ أثناء تحديث البيانات");
    } finally {
      setSaving(false);
    }
  };
  
  const handleChange = (field: keyof Client, value: string | null) => {
    if (!client) return;
    
    setClient({
      ...client,
      [field]: value
    });
  };
  
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {Array(2).fill(0).map((_, j) => (
                  <div key={j} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (error || !client) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-right">تعديل بيانات العميل</h1>
        <Alert variant="destructive">
          <AlertDescription>{error || "لا يمكن العثور على العميل"}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => router.push('/clients/settings')}>
          العودة إلى إعدادات العملاء
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-right">تعديل بيانات العميل</h1>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">المعلومات الشخصية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="client-type">نوع العميل*</Label>
                <Select 
                  value={client.client_type} 
                  onValueChange={(value) => handleChange('client_type', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="فرد" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">فرد</SelectItem>
                    <SelectItem value="company">شركة</SelectItem>
                    <SelectItem value="government">جهة حكومية</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={client.email || ''} 
                  onChange={(e) => handleChange('email', e.target.value)}
                />
              </div>
            </div>

            {client.client_type === "company" && (
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">اسم الشركة*</Label>
                  <Input 
                    id="company-name" 
                    value={client.company_name || ''} 
                    onChange={(e) => handleChange('company_name', e.target.value)}
                    required={client.client_type === "company"}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first-name">الاسم الأول*</Label>
                <Input 
                  id="first-name" 
                  value={client.first_name} 
                  onChange={(e) => handleChange('first_name', e.target.value)}
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input 
                  id="phone" 
                  type="tel" 
                  value={client.phone || ''} 
                  onChange={(e) => handleChange('phone', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="last-name">اسم العائلة*</Label>
                <Input 
                  id="last-name" 
                  value={client.last_name} 
                  onChange={(e) => handleChange('last_name', e.target.value)}
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="national-id">الرقم الوطني</Label>
                <Input 
                  id="national-id" 
                  value={client.national_id || ''} 
                  onChange={(e) => handleChange('national_id', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">معلومات العنوان</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="address">العنوان</Label>
                <Input 
                  id="address" 
                  value={client.address || ''} 
                  onChange={(e) => handleChange('address', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">المدينة</Label>
                <Input 
                  id="city" 
                  value={client.city || ''} 
                  onChange={(e) => handleChange('city', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="postal-code">الرمز البريدي</Label>
                <Input 
                  id="postal-code" 
                  value={client.postal_code || ''} 
                  onChange={(e) => handleChange('postal_code', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">معلومات إضافية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea 
                id="notes" 
                rows={5}
                value={client.notes || ''}
                onChange={(e) => handleChange('notes', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 mt-6">
          <Link href="/clients/settings">
            <Button variant="outline" type="button">إلغاء</Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
          </Button>
        </div>
      </form>
    </div>
  )
} 