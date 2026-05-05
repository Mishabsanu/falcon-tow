'use client';
import { useParams } from 'next/navigation';
import ModuleForm from '@/components/ModuleForm';

export default function EditUser() {
  const { id } = useParams();
  return <ModuleForm moduleKey="users" mode="edit" id={id} />;
}
