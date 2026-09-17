import { useState } from "react";
import { FaEye, FaEyeSlash, FaLock } from "react-icons/fa";

/**
 * Password field with a show/hide eye toggle.
 * The eye icon appears as soon as the field is clicked (focused) and stays
 * visible while typing — click it to reveal / mask the password.
 */
function PasswordInput({
  value = "",
  onChange,
  placeholder,
  name,
  autoComplete,
  className = "",
  required = false,
  disabled = false,
  lockClassName = "text-slate-400",
  ...rest
}) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);

  // Reveal the eye once the field is focused or has content (while typing).
  const showToggle = focused || String(value ?? "").length > 0;

  return (
    <div className="relative">
      <FaLock
        className={`absolute left-4 top-1/2 -translate-y-1/2 text-sm ${lockClassName}`}
      />
      <input
        type={show ? "text" : "password"}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        required={required}
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={className}
        {...rest}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        tabIndex={showToggle ? 0 : -1}
        aria-label={show ? "Hide password" : "Show password"}
        title={show ? "Hide password" : "Show password"}
        className={`
          absolute right-3.5 top-1/2 flex h-7 w-7 -translate-y-1/2
          items-center justify-center rounded-full
          transition-all duration-200 cursor-pointer
          ${
            showToggle
              ? "opacity-100"
              : "pointer-events-none opacity-0"
          }
          ${
            show
              ? "bg-sky-100 text-sky-600"
              : "text-slate-400 hover:bg-slate-100 hover:text-sky-600"
          }
        `}
      >
        {show ? <FaEye size={14} /> : <FaEyeSlash size={14} />}
      </button>
    </div>
  );
}

export default PasswordInput;
