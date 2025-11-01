import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import MenuBar from '../components/MenuBar';
import RegisteredItems from '../components/RegisteredItems';
import OperationArea from '../components/OperationArea';
import VirtualDrawer from '../components/VirtualDrawer';
import { Product, DiscountCondition } from './ProductMasterPage'; // Reuse types

export type CartItem = Product & { cartId: number };
export type AccountingPhase = 'registering' | 'payment' | 'change';
export type DenominationCount = { [key: number]: number };

const PosInstancePage: React.FC = () => {
  const { instanceId } = useParams<{ instanceId: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [instanceExists, setInstanceExists] = useState(false);
  const [discounts, setDiscounts] = useState<DiscountCondition[]>([]);

  // State for the current transaction
  const [cart, setCart] = useState<CartItem[]>([]);
  const [phase, setPhase] = useState<AccountingPhase>('registering');
  const [changeToGive, setChangeToGive] = useState<DenominationCount>({});

  // This is a pre-discount total, passed to OperationArea for the payment screen.
  // The actual final price is calculated in RegisteredItems.
  const totalPrice = useMemo(() => {
    return cart.reduce((total, item) => total + item.price, 0);
  }, [cart]);

  const fetchData = useCallback(async () => {
    if (!instanceId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [instanceRes, discountsRes] = await Promise.all([
        fetch(`/api/instances/${instanceId}`),
        fetch(`/api/instances/${instanceId}/discounts`)
      ]);

      if (instanceRes.ok) {
        setInstanceExists(true);
      } else if (instanceRes.status === 404) {
        throw new Error('POS instance not found.');
      } else {
        throw new Error('Failed to verify POS instance.');
      }

      if (discountsRes.ok) {
        setDiscounts(await discountsRes.json());
      } else {
        console.error('Could not fetch discounts, proceeding without them.');
        setDiscounts([]); // Proceed without discounts if they fail to load
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [instanceId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddToCart = (product: Product) => {
    if (phase === 'registering') {
      setCart(prevCart => [...prevCart, { ...product, cartId: Date.now() + Math.random() }]);
    }
  };

  const handleFinalizeSale = async (paidAmount: DenominationCount) => {
    setError(null);
    try {
      const response = await fetch(`/api/instances/${instanceId}/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart, paidAmount }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Sale failed.');
      }
      setChangeToGive(data.changeGiven);
      setPhase('change');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleNewTransaction = () => {
    setCart([]);
    setChangeToGive({});
    setError(null);
    setPhase('registering');
    // We don't set hasStarted to false here, allowing immediate new registration
  };

  if (isLoading) {
    return <div className="min-h-screen bg-G0-1000 text-G0-0 flex items-center justify-center">Loading POS instance...</div>;
  }

  if (error && !instanceExists) {
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
      <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
        <main className="flex-grow flex flex-col w-full md:w-2/3 h-full">
          <RegisteredItems cart={cart} discounts={discounts} />
          <OperationArea 
            phase={phase} 
            setPhase={setPhase} 
            onAddToCart={handleAddToCart} 
            totalPrice={totalPrice} // This is the pre-discount price
            cart={cart}
            finalizeSale={handleFinalizeSale}
            changeToGive={changeToGive}
            startNewTransaction={handleNewTransaction}
            error={error}
            setError={setError}
          />
        </main>
        <aside className="w-full md:w-1/3 flex flex-col h-full">
          <VirtualDrawer />
        </aside>
      </div>
    </div>
  );
};

export default PosInstancePage;