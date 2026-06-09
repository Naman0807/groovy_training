import { useState } from 'react';
import { useRouter } from 'next/router';

function validateField(name, value) {
  const trimmed = (value || '').trim();
  switch (name) {
    case 'name':
      if (!trimmed) return 'Name is required.';
      if (trimmed.length < 2) return 'Name must be at least 2 characters.';
      return '';
    case 'email':
      if (!trimmed) return 'Email is required.';
      if (!trimmed.includes('@') || !trimmed.includes('.')) return 'Please enter a valid email address.';
      return '';
    case 'roll_number':
      if (!trimmed) return 'Roll Number is required.';
      if (trimmed.length < 2) return 'Roll Number must be at least 2 characters.';
      return '';
    default:
      return '';
  }
}

const FIELD_AUTOCOMPLETE = {
  name: 'name',
  email: 'email',
  rollNumber: 'off',
  class: 'organization',
  age: 'off',
  phone: 'tel',
  address: 'street-address',
};

export default function StudentForm({ initialData, onSubmit, submitLabel = 'Save', onSuccess }) {
  const router = useRouter();
  const [name, setName] = useState(initialData?.name || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [rollNumber, setRollNumber] = useState(initialData?.roll_number || '');
  const [studentClass, setStudentClass] = useState(initialData?.class || '');
  const [age, setAge] = useState(initialData?.age || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const clearError = (field) => {
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleBlur = (field) => (e) => {
    const error = validateField(field, e.target.value);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleChange = (field, setter) => (e) => {
    setter(e.target.value);
    if (errors[field]) clearError(field);
    if (apiError) setApiError('');
  };

  const validateAll = () => {
    const newErrors = {
      name: validateField('name', name),
      email: validateField('email', email),
      roll_number: validateField('roll_number', rollNumber),
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (!validateAll()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        email: email.trim(),
        roll_number: rollNumber.trim(),
        class: studentClass.trim(),
        age: age ? Number(age) : null,
        phone: phone.trim(),
        address: address.trim(),
      });
      if (onSuccess) onSuccess();
    } catch (err) {
      setApiError(err.message || 'Something went wrong.');
      setSubmitting(false);
    }
  };

  const fields = [
    { key: 'name', label: 'Name', value: name, setter: setName, required: true, type: 'text', placeholder: 'Student name' },
    { key: 'email', label: 'Email', value: email, setter: setEmail, required: true, type: 'email', placeholder: 'student@example.com' },
    { key: 'rollNumber', label: 'Roll Number', value: rollNumber, setter: setRollNumber, required: true, type: 'text', placeholder: 'e.g. STU-001' },
    { key: 'class', label: 'Class', value: studentClass, setter: setStudentClass, required: false, type: 'text', placeholder: 'e.g. Grade 10 (optional)' },
    { key: 'age', label: 'Age', value: age, setter: setAge, required: false, type: 'number', placeholder: 'Age (optional)' },
    { key: 'phone', label: 'Phone', value: phone, setter: setPhone, required: false, type: 'text', placeholder: 'Phone number (optional)' },
  ];

  return (
    <form onSubmit={handleSubmit} className="card form-card" noValidate>
      {fields.map(({ key, label, value, setter, required, type, placeholder }) => {
        const errorKey = key === 'rollNumber' ? 'roll_number' : key;
        const hasError = !!errors[errorKey];

        return (
          <div key={key} className={`form-group${hasError ? ' has-error' : ''}`}>
            <label htmlFor={key} className="form-label">
              {label}
              {required && <span className="required-mark" aria-hidden="true">*</span>}
              {required && <span className="sr-only" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>(required)</span>}
            </label>
            <input
              id={key}
              className="form-input"
              type={type}
              value={value}
              onChange={handleChange(errorKey, setter)}
              onBlur={handleBlur(errorKey)}
              placeholder={placeholder}
              autoComplete={FIELD_AUTOCOMPLETE[key]}
              aria-invalid={hasError || undefined}
              aria-describedby={hasError ? `${key}-error` : undefined}
            />
            {hasError && (
              <div className="field-error" id={`${key}-error`} role="alert">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path d="M8 1a7 7 0 100 14A7 7 0 008 1zM7 5a1 1 0 012 0v3a1 1 0 01-2 0V5zm1 6a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
                {errors[errorKey]}
              </div>
            )}
          </div>
        );
      })}

      <div className="form-group">
        <label htmlFor="address" className="form-label">Address</label>
        <textarea
          id="address"
          className="form-textarea"
          value={address}
          onChange={handleChange('address', setAddress)}
          onBlur={handleBlur('address')}
          placeholder="Address (optional)"
          autoComplete={FIELD_AUTOCOMPLETE.address}
        />
      </div>

      {apiError && (
        <div className="form-error mb-2" role="alert">
          <svg className="form-error-icon" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8 1a7 7 0 100 14A7 7 0 008 1zM7 5a1 1 0 012 0v3a1 1 0 01-2 0V5zm1 6a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
          {apiError}
        </div>
      )}

      <div className="btn-group">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving...' : submitLabel}
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => router.back()}>
          Cancel
        </button>
      </div>
    </form>
  );
}
