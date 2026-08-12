import { useState } from 'react';
import { api } from '../hooks/useApi';
import { X, Upload, Users } from 'lucide-react';

interface BulkImportModalProps {
  centerId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkImportModal({ centerId, onClose, onSuccess }: BulkImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('center_id', centerId);

    try {
      await api.post('/timetable/users/bulk_import/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to import users');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />
        <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Bulk Import Users</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-500">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-6 py-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Upload CSV File</label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col w-full h-32 border-4 border-dashed hover:bg-gray-100 hover:border-gray-300">
                    <div className="flex flex-col items-center justify-center pt-7">
                      <Upload className="w-8 h-8 text-gray-400" />
                      <p className="pt-1 text-sm tracking-wider text-gray-400 group-hover:text-gray-600">
                        {file ? file.name : 'Attach a file'}
                      </p>
                    </div>
                    <input type="file" onChange={handleFileChange} accept=".csv" className="opacity-0" />
                  </label>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  The CSV file should have columns: `name`, `email`, `role` (`teacher`, `student`, or `staff`), and `phone_number`.
                </p>
              </div>
            </div>
            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={loading || !file}
              >
                <Users className="w-4 h-4" />
                {loading ? 'Importing...' : 'Import Users'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
