export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return "Email is required";
  if (!emailRegex.test(email)) return "Invalid email format";
  return null; // no error
}

export function validatePhoneNumber(phone) {
  const phoneRegex = /^\+?[0-9\s-]{10,15}$/;
  if (!phone) return "Phone number is required";
  if (!phoneRegex.test(phone)) return "Invalid phone number format";
  return null; // no error
}