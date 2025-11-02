import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Product } from '../pages/ProductMasterPage';
import { AccountingPhase, CartItem, DenominationCount } from '../pages/PosInstancePage';
import { DENOMINATIONS } from '../utils.ts';

type OperationAreaProps = {
  phase: AccountingPhase;
  setPhase: (phase: AccountingPhase) => void;
  onAddToCart: (product: Product) => void;
  totalPrice: number;
  cart: CartItem[];
  finalizeSale: (paidAmount: DenominationCount) => Promise<void>;
  changeToGive: DenominationCount;
  startNewTransaction: () => void;
  error: string | null;
  setError: (error: string | null) => void;
};

// --- ProductRegistration ---
const ProductRegistration: React.FC<Pick<OperationAreaProps, 'onAddToCart' | 'setPhase' | 'setError'> & { instanceId: string | undefined }> = ({ onAddToCart, setPhase, instanceId, setError }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const PRODUCTS_PER_PAGE = 9;

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/instances/${instanceId}/products`);
        if (!response.ok) throw new Error('Failed to fetch products.');
        setProducts(await response.json());
      } catch (err: any) { setError(err.message); }
      finally { setIsLoading(false); }
    };
    fetchProducts();
  }, [instanceId, setError]);

  const paginatedProducts = products.slice(page * PRODUCTS_PER_PAGE, (page + 1) * PRODUCTS_PER_PAGE);
  const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE);

  if (isLoading) return <div className="p-4 flex items-center justify-center h-full">Loading products...</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="px-4 py-2 bg-g1-700 rounded disabled:opacity-50">前へ</button>
        <span>ページ {page + 1} / {totalPages || 1}</span>
        <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="px-4 py-2 bg-g1-700 rounded disabled:opacity-50">次へ</button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {paginatedProducts.map(p => <button key={p.id} onClick={() => onAddToCart(p)} className="aspect-square bg-g0-800 hover:bg-g0-700 rounded-lg p-2 flex flex-col justify-center items-center text-center"><span className="text-sm">{p.name}</span><span className="text-xs text-g1-400">¥{p.price}</span></button>)}
        {Array.from({ length: PRODUCTS_PER_PAGE - paginatedProducts.length }).map((_, i) => <div key={`empty-${i}`} className="aspect-square bg-g0-900 rounded-lg"></div>)}
      </div>
      <div className="flex justify-end mt-4">
        <button onClick={() => setPhase('payment')} className="px-6 py-3 bg-g8-500 text-g0-1000 font-bold rounded-lg">完了</button>
      </div>
    </div>
  );
};

// --- PaymentInterface ---
const PaymentInterface: React.FC<Pick<OperationAreaProps, 'setPhase' | 'totalPrice' | 'finalizeSale' | 'error' | 'setError' | 'cart'>> = ({ setPhase, totalPrice, finalizeSale, error, setError, cart }) => {
  const [paidAmount, setPaidAmount] = useState<DenominationCount>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalPaid = useMemo(() => Object.entries(paidAmount).reduce((s, [d, c]) => s + (parseInt(d) * c), 0), [paidAmount]);
  const changeDue = totalPaid - totalPrice;

  const adjustDenom = (d: number, adj: number) => setPaidAmount(p => ({ ...p, [d]: Math.max(0, (p[d] || 0) + adj) }));

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    await finalizeSale(paidAmount);
    setIsSubmitting(false);
  };

  return (
    <div className="p-4 flex flex-col h-full">
      <h2 className="text-xl font-semibold mb-4">入金</h2>
      {error && <p className="bg-r8-700 text-r8-100 p-2 rounded mb-2 text-center">{error}</p>}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4 text-lg">
        <span className="text-g1-300">お会計:</span>
        <span className="text-right font-mono">¥{totalPrice.toLocaleString()}</span>
        <span className="text-g1-300">お預かり:</span>
        <span className="text-right font-mono">¥{totalPaid.toLocaleString()}</span>
        <span className="text-g1-300 border-t border-g1-700 pt-2">お釣り:</span>
        <span className={`text-right font-mono border-t border-g1-700 pt-2 ${changeDue < 0 ? 'text-r8-300' : 'text-t4b4-300'}`}>
          ¥{changeDue.toLocaleString()}
        </span>
      </div>
      <div className="flex-grow grid grid-cols-2 md:grid-cols-3 gap-2">
        {DENOMINATIONS.map(d => (
          <div key={d} className="bg-g0-800 rounded-lg p-2 flex flex-col items-center justify-center">
            <label className="text-sm text-g1-300">{d.toLocaleString()}円</label>
            <div className="flex items-center mt-1">
              <button onClick={() => adjustDenom(d, -1)} className="w-8 h-8 bg-g1-700 rounded-full text-lg">-</button>
              <span className="w-12 text-center font-mono text-xl">{paidAmount[d] || 0}</span>
              <button onClick={() => adjustDenom(d, 1)} className="w-8 h-8 bg-g1-700 rounded-full text-lg">+</button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-4">
        <button onClick={() => setPhase('registering')} className="px-6 py-3 bg-g1-700 text-g0-50 font-bold rounded-lg">戻る</button>
        <button onClick={() => setPaidAmount({})} className="px-6 py-3 bg-r8-700 text-g0-50 font-bold rounded-lg">クリア</button>
        <button onClick={handleSubmit} disabled={changeDue < 0 || isSubmitting || cart.length === 0} className="px-6 py-3 bg-g8-500 text-g0-1000 font-bold rounded-lg disabled:bg-g1-800 disabled:cursor-not-allowed">
          {isSubmitting ? '処理中...' : '入金完了'}
        </button>
      </div>
    </div>
  );
}

// --- ChangeInterface ---
const ChangeInterface: React.FC<Pick<OperationAreaProps, 'changeToGive' | 'startNewTransaction'>> = ({ changeToGive, startNewTransaction }) => {
  const totalChange = Object.entries(changeToGive).reduce((s, [d, c]) => s + (parseInt(d) * c), 0);
  return (
    <div className="p-4 flex flex-col h-full justify-between">
      <div>
        <h2 className="text-2xl font-semibold mb-4">お釣り</h2>
        <div className="text-center mb-6">
          <span className="text-5xl font-mono text-t4b4-300">¥{totalChange.toLocaleString()}</span>
        </div>
        <div className="space-y-2">
          {Object.entries(changeToGive).map(([denom, count]) => (
            <div key={denom} className="flex justify-between items-center bg-g0-800 p-3 rounded-lg">
              <span className="text-lg">{parseInt(denom).toLocaleString()}円 x</span>
              <span className="font-mono text-2xl">{count}</span>
            </div>
          ))}
        </div>
      </div>
      <button onClick={startNewTransaction} className="w-full mt-6 px-6 py-4 bg-g8-500 text-g0-1000 font-bold rounded-lg text-xl">出金完了 (次の取引へ)</button>
    </div>
  );
}

// --- Main OperationArea Component ---
const OperationArea: React.FC<OperationAreaProps> = (props) => {
  const { instanceId } = useParams<{ instanceId: string }>();
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (props.phase === 'registering') {
      setHasStarted(false);
    }
  }, [props.phase]);

  if (!hasStarted && props.phase === 'registering') {
    return (
      <div className="bg-g0-900 p-4 flex items-center justify-center h-full">
        <button onClick={() => { props.setError(null); setHasStarted(true); }} className="bg-t4b4-500 hover:bg-t4b4-400 text-g0-1000 font-bold py-4 px-8 rounded-lg text-xl transition-colors">商品登録開始</button>
      </div>
    );
  }

  switch (props.phase) {
    case 'registering':
      return <ProductRegistration {...props} instanceId={instanceId} />;
    case 'payment':
      return <PaymentInterface {...props} />;
    case 'change':
      return <ChangeInterface {...props} />;
    default:
      return <div>Error: Unknown phase</div>;
  }
};

export default OperationArea;
