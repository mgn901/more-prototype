import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const [instanceId, setInstanceId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleCreateInstance = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/instances', {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to create instance. Please try again.');
      }
      const data = await response.json();
      navigate(`/${data.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToInstance = (e: React.FormEvent) => {
    e.preventDefault();
    if (instanceId.trim()) {
      navigate(`/${instanceId.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-g0-1000 text-g0-0 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-g0-900 rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-t4b4-300 mb-2">高機動モバイル販売管理システム</h1>
        <p className="text-center text-g1-300 mb-8">High-Mobility Mobile POS System</p>

        {error && <p className="bg-r8-800 text-r8-100 p-3 rounded-md mb-6 text-center">{error}</p>}

        <div className="space-y-6">
          <button
            onClick={handleCreateInstance}
            disabled={isLoading}
            className="w-full bg-t4b4-500 hover:bg-t4b4-400 text-g0-1000 font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out disabled:bg-g1-800 disabled:cursor-not-allowed"
          >
            {isLoading ? '作成中...' : '新しいPOSインスタンスを作成'}
          </button>

          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-g1-700"></div>
            </div>
            <div className="relative bg-g0-900 px-4 text-g1-400">または</div>
          </div>

          <form onSubmit={handleGoToInstance} className="flex flex-col space-y-4">
            <label htmlFor="instanceId" className="text-g1-200">既存のIDを入力</label>
            <input
              id="instanceId"
              type="text"
              value={instanceId}
              onChange={(e) => setInstanceId(e.target.value)}
              placeholder="POSインスタンスID"
              className="bg-g0-1000 border border-g1-700 text-g0-50 rounded-lg p-3 focus:ring-2 focus:ring-t4b4-500 focus:outline-none"
            />
            <button
              type="submit"
              className="w-full bg-g1-700 hover:bg-g1-600 text-g0-50 font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out"
            >
              移動
            </button>
          </form>
        </div>
      </div>
       <footer className="text-center text-g1-500 mt-8">
          <p>&copy; 2025</p>
        </footer>
    </div>
  );
};

export default HomePage;
