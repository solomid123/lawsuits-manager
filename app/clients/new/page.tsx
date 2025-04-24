"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { addClient } from "@/app/actions/client-actions"
import { useFormState } from "react-dom"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"

// Define the proper type for the form state
type FormState = {
  error?: string;
  success?: boolean;
  clientId?: string;
}

const initialState: FormState = {
  error: undefined,
  success: false
}

export default function NewClientPage() {
  const router = useRouter();
  const [state, formAction] = useFormState<FormState, FormData>(addClient, initialState);
  const [clientType, setClientType] = useState<string>("individual");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Handle the server action response
  useEffect(() => {
    if (state.success) {
      toast.success("تم إضافة العميل بنجاح");
      router.push("/clients");
    }
  }, [state.success, router]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    setIsSubmitting(true);
    // The formAction will be called automatically
  };

  // Reset submitting state if there's an error
  useEffect(() => {
    if (state.error) {
      setIsSubmitting(false);
    }
  }, [state.error]);
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-right">إضافة عميل جديد</h1>

      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <form action={formAction} onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">المعلومات الشخصية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="client-type">نوع العميل*</Label>
                <Select 
                  name="client-type" 
                  value={clientType} 
                  onValueChange={(value) => setClientType(value)}
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
                <Input id="email" name="email" type="email" />
              </div>
            </div>

            {clientType === "company" && (
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">اسم الشركة*</Label>
                  <Input id="company-name" name="company-name" required />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first-name">الاسم الأول*</Label>
                <Input id="first-name" name="first-name" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input id="phone" name="phone" type="tel" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="last-name">اسم العائلة*</Label>
                <Input id="last-name" name="last-name" required />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="national-id">الرقم الوطني</Label>
                <Input id="national-id" name="national-id" />
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
                <Input id="address" name="address" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">المدينة</Label>
                <Input id="city" name="city" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="postal-code">الرمز البريدي</Label>
                <Input id="postal-code" name="postal-code" />
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
              <Textarea id="notes" name="notes" rows={5} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 mt-6">
          <Link href="/clients">
            <Button variant="outline" type="button">إلغاء</Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "جاري الحفظ..." : "حفظ العميل"}
          </Button>
        </div>
      </form>
    </div>
  )
}
