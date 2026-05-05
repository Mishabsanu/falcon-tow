'use client';
import { useParams } from 'next/navigation';
import ModuleView from '@/components/ModuleView';

export default function ViewNotification() {
  const { id } = useParams();
  return <ModuleView moduleKey="notifications" id={id} />;
}
