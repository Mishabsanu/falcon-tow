'use client';
import { useParams } from 'next/navigation';
import InvoiceView from '@/components/InvoiceView';

export default function ViewInvoice() {
  const { id } = useParams();
  return <InvoiceView id={id} />;
}
