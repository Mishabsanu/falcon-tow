'use client';
import { useParams } from 'next/navigation';
import ModuleForm from '@/components/ModuleForm';

export default function EditInvoice() {
  const { id } = useParams();
  return <ModuleForm moduleKey="invoices" mode="edit" id={id} />;
}
