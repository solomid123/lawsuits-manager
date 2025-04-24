# File Upload System for Lawsuits Manager

This document provides instructions for setting up and configuring the file upload system for the Lawsuits Manager application.

## Overview

The application allows users to upload and manage documents associated with legal cases. Files are stored in Supabase Storage and metadata is stored in the database.

## Prerequisites

Before setting up the file upload system, make sure you have:

1. A Supabase project set up
2. Your Supabase URL and API key configured in your `.env.local` file
3. Admin access to your Supabase project (for creating buckets and policies)

## Setup Instructions

### 1. Prepare the Database

Make sure your `case_documents` table includes the following columns:

```sql
ALTER TABLE "case_documents" 
ADD COLUMN IF NOT EXISTS "file_path" VARCHAR,
ADD COLUMN IF NOT EXISTS "file_name" VARCHAR,
ADD COLUMN IF NOT EXISTS "file_type" VARCHAR,
ADD COLUMN IF NOT EXISTS "file_size" INTEGER;
```

You can run this SQL in the Supabase SQL Editor or include it in your database migrations.

### 2. Create Storage Bucket (Manual Setup)

Due to permission issues with the automated script, you need to create the storage bucket manually:

1. Log in to your [Supabase Dashboard](https://app.supabase.io)
2. Select your project
3. Navigate to the **Storage** tab
4. Click **Create bucket**
5. Enter bucket name: `case-documents`
6. Check **Public bucket** to make files publicly accessible
7. Click **Create bucket**

### 3. Configure Storage Policies

After creating the bucket, you need to configure policies:

1. In the Supabase dashboard, go to Storage > Policies
2. Select the `case-documents` bucket
3. Create policies for the bucket:

#### Read Policy (Select):
- Policy name: `Allow public read access`
- Policy definition: `true` (allows anyone to read files)

#### Write Policy (Insert):
- Policy name: `Allow authenticated uploads`
- Policy definition: `auth.role() = 'authenticated'`

#### Delete Policy:
- Policy name: `Allow authenticated deletes`
- Policy definition: `auth.role() = 'authenticated'`

### 4. Install Required Dependencies

Make sure you have the uuid package installed:

```bash
npm install uuid @types/uuid --save --legacy-peer-deps
```

## Usage

### Uploading Files

The `uploadFile` function in `lib/supabase-file-upload.ts` handles file uploads to Supabase Storage:

```typescript
import { uploadFile } from "@/lib/supabase-file-upload";

// Example usage
const { path, error } = await uploadFile(file, 'case-documents');
```

### Getting File URLs

Use the `getFileUrl` function to get a public URL for a file:

```typescript
import { getFileUrl } from "@/lib/supabase-file-upload";

const url = getFileUrl(filePath, 'case-documents');
```

### Deleting Files

Use the `deleteFile` function to remove a file from storage:

```typescript
import { deleteFile } from "@/lib/supabase-file-upload";

const { success, error } = await deleteFile(filePath, 'case-documents');
```

### Displaying Documents

Use the DocumentViewer component to display uploaded files:

```tsx
import DocumentViewer from "@/app/components/DocumentViewer";

<DocumentViewer
  filePath={document.file_path}
  fileName={document.file_name}
  fileType={document.file_type}
  fileSize={document.file_size}
/>
```

## Troubleshooting

### Common Issues:

1. **"Storage bucket not found" error**:
   - Make sure the bucket exists in your Supabase project
   - Check if the bucket name matches exactly (`case-documents`)

2. **"Not authorized" error when uploading**:
   - Check your storage policies in the Supabase dashboard
   - Ensure the authenticated role has insert permissions

3. **Files upload but can't be accessed**:
   - Verify that your bucket has public read access enabled
   - Check the file path being stored is correct

4. **File size errors**:
   - The default file size limit is set in the bucket settings
   - You can increase this in the bucket settings (Storage > Buckets > case-documents > Settings)

## Important Security Notes

- The current setup allows public read access to uploaded files
- For more sensitive documents, consider using authenticated access policies
- Always validate file types and sizes on both client and server side 