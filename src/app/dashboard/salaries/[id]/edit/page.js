'use client';
import { use } from 'react';
import SalaryForm from '@/components/SalaryForm';

export default function EditSalary({ params }) {
  const { id } = use(params);
  return <SalaryForm mode="edit" id={id} />;
}
