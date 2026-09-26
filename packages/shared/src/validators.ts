
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?[0-9\s-]{10,15}$/;
  if (!phone) return false;
  if (!phoneRegex.test(phone)) return false;
  return true; // no error
} 