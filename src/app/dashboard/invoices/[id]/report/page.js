'use client';
import { useParams } from 'next/navigation';
import InvoiceReport from '@/components/InvoiceReport';

export default function ViewInvoiceReport() {
  const { id } = useParams();
  return <InvoiceReport id={id} />;
}
