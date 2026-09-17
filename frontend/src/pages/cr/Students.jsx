import { useEffect, useState } from 'react';
import client, { API_BASE_URL } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const initialForm = { full_name: '', registration_number: '', password: '', year_of_study: '', course: '' };

export default function Students() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [loginImageUrl, setLoginImageUrl] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  async function loadStudents() {
    setLoading(true);
    try {
      const { data } = await client.get('/students');
      setStudents(data.students);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load the class roster.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadStudents(); }, []);

  useEffect(() => {
    async function loadImage() {
      try {
        const { data } = await client.get('/settings/login-image');
        if (data.url && data.url.startsWith('/public')) {
          setLoginImageUrl(`${API_BASE_URL}${data.url}`);
        } else {
          setLoginImageUrl(data.url);
        }
      } catch (err) {
        // ignore
      }
    }
    loadImage();
  }, []);

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed reading file'));
      reader.readAsDataURL(file);
    });
  }

  async function uploadImage() {
    if (!imageFile) return;
    setUploading(true);
    setUploadError('');
    try {
      const dataUrl = await fileToDataUrl(imageFile);
      const { data } = await client.post('/settings/login-image', { image_base64: dataUrl });
      if (data.url && data.url.startsWith('/public')) {
        setLoginImageUrl(`${API_BASE_URL}${data.url}`);
      } else {
        setLoginImageUrl(data.url);
      }
      setImageFile(null);
    } catch (err) {
      setUploadError(err.response?.data?.error || err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function addStudent(event) {
    event.preventDefault();
    setError('');
    setSuccess(null);
    setSubmitting(true);
    try {
      const { data } = await client.post('/students', form);
      setStudents((current) => [...current, data.student].sort((a, b) => a.full_name.localeCompare(b.full_name)));
      setSuccess({ registration_number: data.student.registration_number, password: form.password });
      setForm(initialForm);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not add this student. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-accent text-xs font-semibold uppercase tracking-[0.18em] mb-2">Class register</p>
        <h1 className="font-display text-2xl font-semibold">Students</h1>
        <p className="text-mist text-sm mt-1">This roster is limited to {user?.course || 'your assigned course'}.</p>
      </div>

      <section className="card p-5 mb-6 max-w-4xl" aria-labelledby="add-student-title">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 id="add-student-title" className="font-display text-lg font-semibold">Add a student</h2>
            <p className="text-sm text-mist mt-1">They will use these details to sign in for attendance.</p>
          </div>
          <span className="pill bg-accent/15 text-accent shrink-0">{user?.course || 'Your course'}</span>
        </div>
        <form onSubmit={addStudent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block text-xs font-medium text-mist">Full name
            <input name="full_name" className="input-field mt-1.5" placeholder="e.g. Amina Wanjiku" value={form.full_name} onChange={updateField} required />
          </label>
          <label className="block text-xs font-medium text-mist">Registration number
            <input name="registration_number" className="input-field mt-1.5" placeholder="e.g. CR-2023-014" value={form.registration_number} onChange={updateField} required />
          </label>
          <label className="block text-xs font-medium text-mist">Temporary password
            <input name="password" type="password" minLength="6" className="input-field mt-1.5" placeholder="At least 6 characters" value={form.password} onChange={updateField} required />
          </label>
          <label className="block text-xs font-medium text-mist">Year of study
            <input name="year_of_study" type="number" min="1" max="10" step="1" className="input-field mt-1.5" placeholder="e.g. 3" value={form.year_of_study} onChange={updateField} required />
          </label>
          {user?.role === 'admin' && (
            <label className="block text-xs font-medium text-mist">Course
              <input name="course" className="input-field mt-1.5" placeholder="e.g. CS-2023" value={form.course} onChange={updateField} required />
            </label>
          )}
          <div className="md:col-span-2 flex flex-wrap items-center gap-3 pt-1">
            <button className="btn-primary" disabled={submitting}>{submitting ? 'Adding student…' : 'Add student'}</button>
            {error && <p className="text-sm text-danger" role="alert">{error}</p>}
          </div>
        </form>
        {success && (
          <div className="mt-5 border border-accent/30 bg-accent/10 rounded-xl px-4 py-3 text-sm" role="status">
            <p className="font-medium text-accent">Student added successfully.</p>
            <p className="text-mist mt-1">Sign-in: <span className="text-white">{success.registration_number}</span> · Temporary password: <span className="text-white">{success.password}</span>. Share these securely.</p>
          </div>
        )}
      </section>

      <section className="card p-5 mb-6 max-w-4xl" aria-labelledby="login-image-title">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 id="login-image-title" className="font-display text-lg font-semibold">Login panel image</h2>
            <p className="text-sm text-mist mt-1">Upload an image to display on the login page left panel.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-60 h-36 bg-white/5 rounded-lg flex items-center justify-center overflow-hidden">
            {loginImageUrl ? <img src={loginImageUrl} alt="login" className="w-full h-full object-cover" />
              : <div className="text-mist/60">No image set</div>}
          </div>
          <div className="flex-1">
            <input type="file" accept="image/*" onChange={(e) => { setImageFile(e.target.files?.[0] || null); setUploadError(''); }} />
            <div className="mt-3 flex items-center gap-3">
              <button type="button" className="btn-primary" disabled={uploading || !imageFile} onClick={uploadImage}>{uploading ? 'Uploading…' : 'Upload image'}</button>
              {uploadError && <p className="text-sm text-danger">{uploadError}</p>}
            </div>
            <p className="text-xs text-mist mt-2">Recommended size: 1200×800px. Smaller images may be scaled.</p>
          </div>
        </div>
      </section>

      <section className="card overflow-hidden" aria-labelledby="roster-title">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 id="roster-title" className="font-display text-lg font-semibold">Class roster</h2>
            <p className="text-xs text-mist mt-0.5">{loading ? 'Loading students…' : `${students.length} student${students.length === 1 ? '' : 's'} registered`}</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[620px]">
            <thead className="bg-white/[0.03] text-mist text-xs uppercase tracking-wide">
              <tr><th className="text-left px-5 py-3">Full name</th><th className="text-left px-5 py-3">Registration number</th><th className="text-left px-5 py-3">Year</th><th className="text-left px-5 py-3">Course</th></tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? <tr><td colSpan="4" className="text-center text-mist py-10">Loading class roster…</td></tr>
                : students.length === 0 ? <tr><td colSpan="4" className="text-center text-mist py-10">No students yet. Add the first student above.</td></tr>
                : students.map((student) => <tr key={student.id} className="hover:bg-white/[0.025] transition"><td className="px-5 py-3.5 font-medium">{student.full_name}</td><td className="px-5 py-3.5 text-mist">{student.registration_number}</td><td className="px-5 py-3.5"><span className="pill bg-white/5 text-mist">Year {student.year_of_study}</span></td><td className="px-5 py-3.5 text-mist">{student.course}</td></tr>)}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
