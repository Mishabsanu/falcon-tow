'use client';
import { use } from 'react';
import ModuleForm from '@/components/ModuleForm';

export default function EditExpense({ params }) {
  const { id } = use(params);
  return <ModuleForm moduleKey="expenses" mode="edit" id={id} />;
}
