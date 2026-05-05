'use client';
import { useParams } from 'next/navigation';
import ModuleForm from '@/components/ModuleForm';

export default function EditNotification() {
  const { id } = useParams();
  return <ModuleForm moduleKey="notifications" mode="edit" id={id} />;
}
