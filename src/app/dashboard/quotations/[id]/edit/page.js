'use client';
import ModuleForm from '@/components/ModuleForm';

export default function EditQuotation({ params }) {
  const { id } = params;
  return <ModuleForm moduleKey="quotations" id={id} isEdit={true} />;
}
