import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import MenuBar from '../components/MenuBar';
import RegisteredItems from '../components/RegisteredItems';
import OperationArea from '../components/OperationArea';
import VirtualDrawer from '../components/VirtualDrawer';

const PosInstancePage: React.FC = () => {
  const { instanceId } = useParams<{ instanceId: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [instanceExists, setInstanceExists] = useState(false);

  useEffect(() => {
    const verifyInstance = async () => {
      if (!instanceId) return;
      setIsLoading(true);
      try {
        const response = await fetch(`/api/instances/${instanceId}`);
        if (response.ok) {
          setInstanceExists(true);
        } else if (response.status === 404) {
          setError('POS instance not found.');
        } else {
          throw new Error('Failed to verify POS instance.');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    verifyInstance();
  }, [instanceId]);

  if (isLoading) {
    return <div className="min-h-screen bg-G0-1000 text-G0-0 flex items-center justify-center">Loading...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-G0-1000 text-G0-0 flex flex-col items-center justify-center">
        <div className="bg-R8-800 text-R8-100 p-4 rounded-md mb-4">Error: {error}</div>
        <Link to="/" className="text-T4B4-300 hover:underline">Return to Home</Link>
      </div>
    );
  }

  if (!instanceExists) {
    // This case should ideally be covered by the error state, but as a fallback:
    return <div className="min-h-screen bg-G0-1000 text-G0-0 flex items-center justify-center">Instance not found.</div>;
  }

  return (
    <div className="min-h-screen bg-G0-1000 text-G0-100 flex flex-col">
      <MenuBar />
      <div className="flex-grow flex flex-col md:flex-row">
        <main className="flex-grow flex flex-col w-full md:w-2/3">
          <RegisteredItems />
          <OperationArea />
        </main>
        <aside className="w-full md:w-1/3 flex flex-col">
          <VirtualDrawer />
        </aside>
      </div>
    </div>
  );
};

export default PosInstancePage;
