'use client';
import { useParams } from 'next/navigation';
import TowJobView from '@/components/TowJobView';

export default function ViewTow() {
  const { id } = useParams();
  return <TowJobView id={id} />;
}
