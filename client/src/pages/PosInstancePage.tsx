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

  const totalPrice = useMemo(() => {
    // This will be recalculated inside RegisteredItems with discounts
    return cart.reduce((total, item) => total + item.price, 0);
  }, [cart]);

  const fetchData = useCallback(async () => {
    if (!instanceId) return;
    setIsLoading(true);
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
        throw new Error('Failed to fetch discounts.');
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [instanceId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddToCart = (product: Product) => {
    setCart(prevCart => [...prevCart, { ...product, cartId: Date.now() + Math.random() }]);
  };

  const handleFinalizeSale = async (paidAmount: DenominationCount) => {
    // ... (implementation remains the same)
  };

  const handleNewTransaction = () => {
    setCart([]);
    setChangeToGive({});
    setError(null);
    setPhase('registering');
  };

  if (isLoading) { /* ... */ return <p>Loading...</p>}
  if (error && !instanceExists) { /* ... */ return <p>Error: {error}</p>}
  if (!instanceExists) { /* ... */ return <p>Not found</p>}

  return (
    <div className="min-h-screen bg-G0-1000 text-G0-100 flex flex-col">
      <MenuBar />
      <div className="flex-grow flex flex-col md:flex-row">
        <main className="flex-grow flex flex-col w-full md:w-2/3">
          <RegisteredItems cart={cart} discounts={discounts} />
          <OperationArea 
            phase={phase} 
            setPhase={setPhase} 
            onAddToCart={handleAddToCart} 
            totalPrice={totalPrice} // This will be the pre-discount price
            cart={cart}
            finalizeSale={handleFinalizeSale}
            changeToGive={changeToGive}
            startNewTransaction={handleNewTransaction}
            error={error}
            setError={setError}
          />
        </main>
        <aside className="w-full md:w-1/3 flex flex-col">
          <VirtualDrawer />
        </aside>
      </div>
    </div>
  );
};

export default PosInstancePage;
