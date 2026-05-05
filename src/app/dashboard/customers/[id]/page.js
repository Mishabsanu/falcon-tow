'use client';
import { useParams } from 'next/navigation';
import CustomerView from '@/components/CustomerView';

export default function ViewCustomer() {
  const { id } = useParams();
  return <CustomerView id={id} />;
}
