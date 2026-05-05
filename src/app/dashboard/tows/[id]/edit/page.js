'use client';
import { useParams } from 'next/navigation';
import ModuleForm from '@/components/ModuleForm';

export default function EditTow() {
  const { id } = useParams();
  return <ModuleForm moduleKey="tows" mode="edit" id={id} />;
}
