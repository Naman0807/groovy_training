import { useState } from 'react';
import { useRouter } from 'next/router';

export default function StudentForm({ initialData, onSubmit, submitLabel = 'Save' }) {
  const router = useRouter();
  const [name, setName] = useState(initialData?.name || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [rollNumber, setRollNumber] = useState(initialData?.roll_number || '');
  const [studentClass, setStudentClass] = useState(initialData?.class || '');
  const [age, setAge] = useState(initialData?.age || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Name is required.');
      return;
    }

    if (!email.trim()) {
      setError('Email is required.');
      return;
    }

    if (!rollNumber.trim()) {
      setError('Roll Number is required.');
      return;
    }

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
    } catch (err) {
      setError(err.message || 'Something went wrong.');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card" style={{ maxWidth: '600px' }}>
      <div className="form-group">
        <label htmlFor="name">Name</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Student name"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="student@example.com"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="rollNumber">Roll Number</label>
        <input
          id="rollNumber"
          type="text"
          value={rollNumber}
          onChange={(e) => setRollNumber(e.target.value)}
          placeholder="Roll number"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="class">Class</label>
        <input
          id="class"
          type="text"
          value={studentClass}
          onChange={(e) => setStudentClass(e.target.value)}
          placeholder="Class (optional)"
        />
      </div>

      <div className="form-group">
        <label htmlFor="age">Age</label>
        <input
          id="age"
          type="number"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          placeholder="Age (optional)"
        />
      </div>

      <div className="form-group">
        <label htmlFor="phone">Phone</label>
        <input
          id="phone"
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone (optional)"
        />
      </div>

      <div className="form-group">
        <label htmlFor="address">Address</label>
        <textarea
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Address (optional)"
        />
      </div>

      {error && <p className="form-error mb-2">{error}</p>}

      <div>
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
