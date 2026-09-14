import { redirect } from 'next/navigation';

export default function RegisterPage() {
  // Registration is managed by administrators only.
  // Redirect to login page.
  redirect('/login');
}
