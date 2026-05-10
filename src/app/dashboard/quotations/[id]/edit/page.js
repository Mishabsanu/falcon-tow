'use client';
import { useParams } from 'next/navigation';
import ModuleForm from '@/components/ModuleForm';

export default function EditQuotation() {
  const { id } = useParams();
  return <ModuleForm moduleKey="quotations" mode="edit" id={id} />;
}
