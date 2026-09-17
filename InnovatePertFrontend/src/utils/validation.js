// src/utils/validation.js

export const validatePersonName = (name) => {
  if (!name || !name.trim()) return "This field is required.";
  if (!/^[a-zA-Z]+( [a-zA-Z]+)*$/.test(name)) return "Name can contain letters and single spaces only.";
  return "";
};

export const validateEmail = (email) => {
  if (!email || !email.trim()) return "This field is required.";
  if (/\s/.test(email)) return "Email address cannot contain spaces.";
  if (!/^(?!\d+@)[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,6}$/.test(email)) return "Please enter a valid email address.";
  return "";
};

export const validatePassword = (password) => {
  if (!password || !password.trim()) return "This field is required.";
  if (password.length < 8 || password.length > 16) return "Password must be between 8 and 16 characters.";
  if (!/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@#$%^&+=!]).{8,16}$/.test(password)) {
    return "Password must contain uppercase, lowercase, number and special character.";
  }
  return "";
};

export const validateProjectName = (name) => {
  if (!name || !name.trim()) return "This field is required.";
  if (name.length < 2 || name.length > 100) return "Name must be between 2 and 100 characters.";
  if (!/^[a-zA-Z0-9 _&.()/#+\-]+$/.test(name)) return "Name contains invalid characters.";
  if (/  /.test(name)) return "Multiple consecutive spaces are not allowed.";
  return "";
};

export const validateDescription = (desc, required = false) => {
  if (!desc || !desc.trim()) return required ? "This field is required." : "";
  if (desc.length > 500) return "Description cannot exceed 500 characters.";
  if (/  /.test(desc)) return "Multiple consecutive spaces are not allowed.";
  return "";
};

export const validatePositiveNumber = (num, allowZero = true) => {
  if (num === "" || num === null || num === undefined) return "This field is required.";
  const val = Number(num);
  if (isNaN(val)) return "Please enter a valid number.";
  if (val < 0) return "Only positive numbers are allowed.";
  if (!allowZero && val === 0) return "Value must be greater than zero.";
  return "";
};

// --- Input Event Handlers to block invalid characters during typing/pasting ---

export const handleNameInput = (e) => {
  // Replace multiple spaces with single space
  let val = e.target.value.replace(/  +/g, ' ');
  // Allow only letters and spaces
  val = val.replace(/[^a-zA-Z ]/g, '');
  // No leading space
  if (val.startsWith(' ')) val = val.substring(1);
  e.target.value = val;
};

export const handleTextInput = (e) => {
  // Replace multiple spaces with single space
  let val = e.target.value.replace(/  +/g, ' ');
  // Allow letters, numbers, spaces, and valid special characters for projects
  val = val.replace(/[^a-zA-Z0-9 _&.()/#+\-]/g, '');
  // No leading space
  if (val.startsWith(' ')) val = val.substring(1);
  e.target.value = val;
};

export const handleNumberInput = (e) => {
  // Block non-numeric characters (allow . for decimals)
  let val = e.target.value.replace(/[^0-9.]/g, '');
  // Prevent multiple decimals
  const parts = val.split('.');
  if (parts.length > 2) {
    val = parts[0] + '.' + parts.slice(1).join('');
  }
  e.target.value = val;
};

export const blockInvalidNumberKeys = (e) => {
  if (['e', 'E', '+', '-'].includes(e.key)) {
    e.preventDefault();
  }
};
