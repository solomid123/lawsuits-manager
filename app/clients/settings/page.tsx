"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, RefreshCw, Pencil, Trash2, AlertTriangle } from "lucide-react"
import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type Client = {
  id: string;
  client_type: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  created_at: string;
}

export default function ClientSettingsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const supabase = createClientComponentClient();
  
  const fetchClients = async (search = "") => {
    setLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,company_name.ilike.%${search}%`);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      setClients(data || []);
    } catch (err) {
      console.error("Error fetching clients:", err);
      setError("فشل في جلب العملاء. الرجاء المحاولة مرة أخرى لاحقاً.");
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchClients();
  }, []);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchClients(searchQuery);
  };

  const deleteClient = async (id: string) => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('تم حذف العميل بنجاح');
      setClients(clients.filter(client => client.id !== id));
      setOpenDeleteDialog(false);
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('حدث خطأ أثناء حذف العميل');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteClick = (client: Client) => {
    setSelectedClient(client);
    setOpenDeleteDialog(true);
  };

  const getClientTypeDisplay = (type: string) => {
    switch (type) {
      case 'individual': return 'فرد';
      case 'company': return 'شركة';
      case 'government': return 'جهة حكومية';
      default: return type;
    }
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-right">إعدادات العملاء</h1>

      <form onSubmit={handleSearch} className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="البحث عن عميل..." 
            className="pl-10 text-right" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button type="submit" variant="default">بحث</Button>
        <Button variant="outline" size="icon" onClick={() => fetchClients()}>
          <RefreshCw className="h-4 w-4" />
          <span className="sr-only">تحديث</span>
        </Button>
      </form>

      {error ? (
        <div className="rounded-md border p-8 text-center">
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button variant="outline" size="sm" onClick={() => fetchClients()}>
            إعادة المحاولة
          </Button>
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">النوع</TableHead>
                  <TableHead className="text-right">البريد الإلكتروني</TableHead>
                  <TableHead className="text-right">رقم الهاتف</TableHead>
                  <TableHead className="text-right">الشركة</TableHead>
                  <TableHead className="text-right w-[120px]">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array(5).fill(0).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-5 w-[150px]" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-[180px]" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-[120px]" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-[150px]" /></TableCell>
                      <TableCell><Skeleton className="h-9 w-20 rounded-md" /></TableCell>
                    </TableRow>
                  ))
                ) : clients.length > 0 ? (
                  clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">
                        {client.first_name} {client.last_name}
                      </TableCell>
                      <TableCell>{getClientTypeDisplay(client.client_type)}</TableCell>
                      <TableCell>{client.email || "—"}</TableCell>
                      <TableCell dir="ltr" className="text-right">{client.phone || "—"}</TableCell>
                      <TableCell>{client.company_name || "—"}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2 justify-end">
                          <Link href={`/clients/${client.id}/edit`}>
                            <Button variant="ghost" size="icon" title="تعديل">
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">تعديل</span>
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteClick(client)}
                            title="حذف"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                            <span className="sr-only">حذف</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      لا يوجد عملاء
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent className="text-right">
          <DialogHeader>
            <DialogTitle className="text-right flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 ml-2" />
              تأكيد الحذف
            </DialogTitle>
            <DialogDescription>
              هل أنت متأكد من رغبتك في حذف العميل 
              {selectedClient && (
                <span className="font-bold mx-1">
                  {selectedClient.first_name} {selectedClient.last_name}
                </span>
              )}؟
              <br />
              <span className="text-red-500">لا يمكن التراجع عن هذا الإجراء.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-end gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setOpenDeleteDialog(false)}
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedClient && deleteClient(selectedClient.id)}
              disabled={isDeleting}
            >
              {isDeleting ? "جاري الحذف..." : "حذف"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 