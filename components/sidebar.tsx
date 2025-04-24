"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  BarChart3,
  Users,
  Briefcase,
  Users2,
  FileText,
  CheckSquare,
  Calendar,
  FileIcon as FileInvoice,
  Receipt,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface SidebarItemProps {
  icon: React.ReactNode
  label: string
  href: string
  active?: boolean
  hasSubmenu?: boolean
  submenuOpen?: boolean
  onClick?: () => void
}

function SidebarItem({
  icon,
  label,
  href,
  active = false,
  hasSubmenu = false,
  submenuOpen = false,
  onClick,
}: SidebarItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
        active ? "bg-secondary text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
      )}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
      {hasSubmenu && (
        <span className="mr-auto">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn("h-4 w-4 transition-transform", submenuOpen ? "rotate-180" : "")}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      )}
    </Link>
  )
}

export default function Sidebar() {
  const pathname = usePathname();
  const [clientsOpen, setClientsOpen] = useState(pathname.includes('/clients'));
  const [casesOpen, setCasesOpen] = useState(pathname.includes('/cases'));
  const [invoicesOpen, setInvoicesOpen] = useState(pathname.includes('/invoices'));

  return (
    <div className="w-64 border-l bg-background">
      <div className="flex flex-col gap-2 p-4">
        <SidebarItem 
          icon={<BarChart3 className="h-5 w-5" />} 
          label="لوحة التحكم" 
          href="/" 
          active={pathname === '/'} 
        />

        <SidebarItem
          icon={<Users className="h-5 w-5" />}
          label="العملاء"
          href="#"
          hasSubmenu
          submenuOpen={clientsOpen}
          active={pathname.includes('/clients')}
          onClick={() => setClientsOpen(!clientsOpen)}
        />

        {clientsOpen && (
          <div className="mr-4 flex flex-col gap-1 border-r pr-4">
            <SidebarItem 
              icon={<Users className="h-4 w-4" />} 
              label="قائمة العملاء" 
              href="/clients" 
              active={pathname === '/clients'} 
            />
            <SidebarItem 
              icon={<Users className="h-4 w-4" />} 
              label="إضافة عميل جديد" 
              href="/clients/new" 
              active={pathname === '/clients/new'} 
            />
            <SidebarItem 
              icon={<Settings className="h-4 w-4" />} 
              label="إعدادات العملاء" 
              href="/clients/settings" 
              active={pathname === '/clients/settings'} 
            />
          </div>
        )}

        <SidebarItem
          icon={<Briefcase className="h-5 w-5" />}
          label="القضايا"
          href="#"
          hasSubmenu
          submenuOpen={casesOpen}
          active={pathname.includes('/cases')}
          onClick={() => setCasesOpen(!casesOpen)}
        />

        {casesOpen && (
          <div className="mr-4 flex flex-col gap-1 border-r pr-4">
            <SidebarItem 
              icon={<Briefcase className="h-4 w-4" />} 
              label="قائمة القضايا" 
              href="/cases" 
              active={pathname === '/cases'} 
            />
            <SidebarItem 
              icon={<Calendar className="h-4 w-4" />} 
              label="الجلسات" 
              href="/cases/sessions" 
              active={pathname.includes('/sessions')} 
            />
            <SidebarItem 
              icon={<Briefcase className="h-4 w-4" />} 
              label="إضافة قضية جديدة" 
              href="/cases/new" 
              active={pathname === '/cases/new'} 
            />
            <SidebarItem 
              icon={<Settings className="h-4 w-4" />} 
              label="إعدادات القضايا" 
              href="/cases/settings" 
              active={pathname === '/cases/settings'} 
            />
          </div>
        )}

        <SidebarItem 
          icon={<FileText className="h-5 w-5" />} 
          label="المستندات" 
          href="/documents" 
          active={pathname === '/documents'} 
        />
        <SidebarItem 
          icon={<CheckSquare className="h-5 w-5" />} 
          label="قائمة المهام" 
          href="/todo" 
          active={pathname === '/todo'} 
        />
        <SidebarItem 
          icon={<Calendar className="h-5 w-5" />} 
          label="التقويم" 
          href="/calendar" 
          active={pathname === '/calendar'} 
        />
        <SidebarItem
          icon={<FileInvoice className="h-5 w-5" />}
          label="الفواتير"
          href="#"
          hasSubmenu
          submenuOpen={invoicesOpen}
          active={pathname.includes('/invoices')}
          onClick={() => setInvoicesOpen(!invoicesOpen)}
        />

        {invoicesOpen && (
          <div className="mr-4 flex flex-col gap-1 border-r pr-4">
            <SidebarItem 
              icon={<FileInvoice className="h-4 w-4" />} 
              label="إنشاء فاتورة" 
              href="/invoices" 
              active={pathname === '/invoices'} 
            />
            <SidebarItem 
              icon={<FileText className="h-4 w-4" />} 
              label="قائمة الفواتير" 
              href="/invoices/list" 
              active={pathname === '/invoices/list'} 
            />
          </div>
        )}

        <SidebarItem 
          icon={<Receipt className="h-5 w-5" />} 
          label="الإيصالات" 
          href="/bills" 
          active={pathname === '/bills'} 
        />
        <SidebarItem 
          icon={<Settings className="h-5 w-5" />} 
          label="الإعدادات" 
          href="/settings" 
          active={pathname === '/settings'} 
        />
      </div>
    </div>
  )
}
