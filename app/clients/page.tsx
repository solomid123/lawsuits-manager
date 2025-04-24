"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Search, SlidersHorizontal, RefreshCw, ExternalLink } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Skeleton } from "@/components/ui/skeleton"

type Client = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  created_at: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
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
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">إدارة العملاء</h1>
        <Link href="/clients/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            إضافة عميل جديد
          </Button>
        </Link>
      </div>

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
                  <TableHead className="text-right">البريد الإلكتروني</TableHead>
                  <TableHead className="text-right">رقم الهاتف</TableHead>
                  <TableHead className="text-right">الشركة</TableHead>
                  <TableHead className="text-right w-[100px]">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array(5).fill(0).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-5 w-[150px]" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-[180px]" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-[120px]" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-[150px]" /></TableCell>
                      <TableCell><Skeleton className="h-9 w-9 rounded-md" /></TableCell>
                    </TableRow>
                  ))
                ) : clients.length > 0 ? (
                  clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">
                        {client.first_name} {client.last_name}
                      </TableCell>
                      <TableCell>{client.email || "—"}</TableCell>
                      <TableCell dir="ltr" className="text-right">{client.phone || "—"}</TableCell>
                      <TableCell>{client.company_name || "—"}</TableCell>
                      <TableCell>
                        <Link href={`/clients/${client.id}`}>
                          <Button variant="ghost" size="icon">
                            <ExternalLink className="h-4 w-4" />
                            <span className="sr-only">عرض العميل</span>
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      لا يوجد عملاء
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  )
}
