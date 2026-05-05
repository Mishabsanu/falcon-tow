import QuotationView from '@/components/QuotationView';

export default function ViewQuotation({ params }) {
  const { id } = params;
  return <QuotationView id={id} />;
}
