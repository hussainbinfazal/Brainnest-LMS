
export function validateEmail(email: string): string | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return "Email is required";
  if (!emailRegex.test(email)) return "Invalid email format";
  return null; // no error
}

export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?[0-9\s-]{10,15}$/;
  if (!phone) return false;
  if (!phoneRegex.test(phone)) return false;
  return true; // no error
} 