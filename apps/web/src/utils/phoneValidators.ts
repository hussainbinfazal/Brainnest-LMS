

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return false;
  if (!emailRegex.test(email)) return false;
  return true; // no error
}

export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?[0-9\s-]{10,15}$/;
  if (!phone) return false;
  if (!phoneRegex.test(phone)) return false;
  return true; // no error
} 