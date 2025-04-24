"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { TodoTask } from "./Todo"

interface CaseOption {
  id: string
  title: string
}

interface UserOption {
  id: string
  name: string
}

interface TodoFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentTask: Partial<TodoTask>
  onTaskChange: (task: Partial<TodoTask>) => void
  onSave: () => void
  isEditing: boolean
  cases: CaseOption[]
  users: UserOption[]
}

export default function TodoForm({
  open,
  onOpenChange,
  currentTask,
  onTaskChange,
  onSave,
  isEditing,
  cases,
  users
}: TodoFormProps) {
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onTaskChange({...currentTask, title: e.target.value})
  }

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onTaskChange({...currentTask, description: e.target.value})
  }

  const handlePriorityChange = (value: string) => {
    onTaskChange({...currentTask, priority: value as any})
  }
  
  const handleStatusChange = (value: string) => {
    onTaskChange({...currentTask, status: value as any})
  }

  const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onTaskChange({...currentTask, due_date: e.target.value || null})
  }

  const handleCaseChange = (value: string) => {
    onTaskChange({...currentTask, case_id: value === "none" ? null : value})
  }

  const handleAssigneeChange = (value: string) => {
    onTaskChange({...currentTask, assigned_to: value === "none" ? null : value})
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'تعديل المهمة' : 'إضافة مهمة جديدة'}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">عنوان المهمة*</Label>
            <Input
              id="title"
              value={currentTask.title || ''}
              onChange={handleTitleChange}
              placeholder="أدخل عنوان المهمة"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">الوصف</Label>
            <Textarea
              id="description"
              value={currentTask.description || ''}
              onChange={handleDescriptionChange}
              placeholder="أدخل وصف المهمة"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">الأولوية</Label>
              <Select
                value={currentTask.priority || 'medium'}
                onValueChange={handlePriorityChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الأولوية" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">منخفضة</SelectItem>
                  <SelectItem value="medium">متوسطة</SelectItem>
                  <SelectItem value="high">عالية</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">الحالة</Label>
              <Select
                value={currentTask.status || 'todo'}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">المهام الجديدة</SelectItem>
                  <SelectItem value="in-progress">قيد التنفيذ</SelectItem>
                  <SelectItem value="done">مكتملة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="due_date">تاريخ الاستحقاق</Label>
            <Input
              id="due_date"
              type="date"
              value={currentTask.due_date ? new Date(currentTask.due_date).toISOString().split('T')[0] : ''}
              onChange={handleDueDateChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="case_id">القضية المرتبطة</Label>
            <Select
              value={currentTask.case_id || 'none'}
              onValueChange={handleCaseChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر القضية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">بدون قضية</SelectItem>
                {cases.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="assigned_to">المسؤول</Label>
            <Select
              value={currentTask.assigned_to || 'none'}
              onValueChange={handleAssigneeChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر المسؤول" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">غير معين</SelectItem>
                {users.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={onSave}>
            {isEditing ? 'تحديث' : 'إضافة'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 