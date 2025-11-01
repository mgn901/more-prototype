import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Product } from '../pages/ProductMasterPage';

type AddDiscountFormProps = {
  products: Product[];
  onDiscountAdd: () => void;
};

const AddDiscountForm: React.FC<AddDiscountFormProps> = ({ products, onDiscountAdd }) => {
  const { instanceId } = useParams<{ instanceId: string }>();
  const [type, setType] = useState<'quantity_discount' | 'value_discount'>('quantity_discount');
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [requiredQuantity, setRequiredQuantity] = useState('');
  const [discountValue, setDiscountValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleProductSelect = (productId: number) => {
    setSelectedProductIds(prev => 
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProductIds.length === 0 || !requiredQuantity || !discountValue) {
      setError('All fields are required.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);

    const details = {
      product_ids: selectedProductIds,
      required_quantity: parseInt(requiredQuantity),
      [type === 'quantity_discount' ? 'discount_rate' : 'discount_value']: parseInt(discountValue),
    };

    try {
      const response = await fetch(`/api/instances/${instanceId}/discounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, details }),
      });
      if (!response.ok) {
        const res = await response.json();
        throw new Error(res.error || 'Failed to create discount.');
      }
      // Reset form and notify parent
      setType('quantity_discount');
      setSelectedProductIds([]);
      setRequiredQuantity('');
      setDiscountValue('');
      onDiscountAdd();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-G0-900 p-6 rounded-lg shadow-lg mb-8">
      <h3 className="text-xl font-semibold mb-4">新しい割引条件を追加</h3>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <p className="bg-R8-700 text-R8-100 p-3 rounded-md">{error}</p>}
        
        {/* Row 1: Type and Products */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <label htmlFor="discount-type" className="block mb-2 text-sm font-medium text-G1-300">割引種別</label>
            <select id="discount-type" value={type} onChange={e => setType(e.target.value as any)} className="w-full bg-G0-1000 border border-G1-700 rounded-md p-2.5">
              <option value="quantity_discount">個数割引 (%引き)</option>
              <option value="value_discount">個数値引 (円引き)</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block mb-2 text-sm font-medium text-G1-300">対象商品 (複数選択可)</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 bg-G0-1000 border border-G1-700 rounded-md p-2 max-h-32 overflow-y-auto">
              {products.map(p => (
                <label key={p.id} className="flex items-center space-x-2 p-1 rounded-md hover:bg-G1-800">
                  <input type="checkbox" checked={selectedProductIds.includes(p.id)} onChange={() => handleProductSelect(p.id)} className="form-checkbox bg-G0-1000 text-T4B4-500" />
                  <span>{p.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Quantity and Value */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
                <label htmlFor="req-quantity" className="block mb-2 text-sm font-medium text-G1-300">適用される購入数</label>
                <input type="number" id="req-quantity" value={requiredQuantity} onChange={e => setRequiredQuantity(e.target.value)} required min="1" className="w-full bg-G0-1000 border border-G1-700 rounded-md p-2.5" placeholder="例: 3" />
            </div>
            <div>
                <label htmlFor="discount-value" className="block mb-2 text-sm font-medium text-G1-300">
                  {type === 'quantity_discount' ? '割引率 (%)' : '値引額 (円)'}
                </label>
                <input type="number" id="discount-value" value={discountValue} onChange={e => setDiscountValue(e.target.value)} required min="1" className="w-full bg-G0-1000 border border-G1-700 rounded-md p-2.5" placeholder={type === 'quantity_discount' ? '例: 10' : '例: 100'} />
            </div>
        </div>

        <div className="text-right pt-2">
          <button type="submit" disabled={isSubmitting} className="bg-T4B4-500 hover:bg-T4B4-400 text-G0-1000 font-bold rounded-lg py-2.5 px-6 disabled:bg-G1-800">
            {isSubmitting ? '作成中...' : '割引を作成'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddDiscountForm;
