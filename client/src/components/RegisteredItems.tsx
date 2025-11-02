import React, { useMemo } from 'react';
import { CartItem } from '../pages/PosInstancePage';
import { DiscountCondition } from '../pages/ProductMasterPage';

type RegisteredItemsProps = {
  cart: CartItem[];
  discounts: DiscountCondition[];
};

type AggregatedCartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
};

type AppliedDiscount = {
  id: number;
  description: string;
  amount: number;
};

const RegisteredItems: React.FC<RegisteredItemsProps> = ({ cart, discounts }) => {

  const aggregatedCart = useMemo(() => {
    const map = new Map<number, AggregatedCartItem>();
    for (const item of cart) {
      if (map.has(item.id)) {
        map.get(item.id)!.quantity++;
      } else {
        map.set(item.id, { ...item, quantity: 1 });
      }
    }
    return Array.from(map.values());
  }, [cart]);

  const { finalPrice, appliedDiscounts } = useMemo(() => {
    const subtotal = cart.reduce((total, item) => total + item.price, 0);
    let totalDiscountAmount = 0;
    const applied: AppliedDiscount[] = [];

    if (discounts && discounts.length > 0) {
      for (const discount of discounts) {
        const details = JSON.parse(discount.details);
        const applicableItemsCount = cart.filter(item => details.product_ids.includes(item.id)).length;
        
        if (applicableItemsCount >= details.required_quantity) {
          const timesToApply = Math.floor(applicableItemsCount / details.required_quantity);
          let discountAmount = 0;
          let description = '';

          if (discount.type === 'value_discount') {
            discountAmount = timesToApply * details.discount_value;
            description = `個数値引: ${timesToApply * details.discount_value}円引き`;
          } else if (discount.type === 'quantity_discount') {
            // Apply percentage discount only to the items that form the discount units
            const itemsToDiscount = cart
              .filter(item => details.product_ids.includes(item.id))
              .slice(0, timesToApply * details.required_quantity);
            
            const totalValueOfDiscountedItems = itemsToDiscount.reduce((sum, item) => sum + item.price, 0);
            discountAmount = Math.floor(totalValueOfDiscountedItems * (details.discount_rate / 100));
            description = `個数割引: ${details.discount_rate}% オフ`;
          }

          if (discountAmount > 0) {
            totalDiscountAmount += discountAmount;
            applied.push({ id: discount.id, description, amount: discountAmount });
          }
        }
      }
    }

    return {
      finalPrice: subtotal - totalDiscountAmount,
      appliedDiscounts: applied,
    };
  }, [cart, discounts]);

  const subtotal = cart.reduce((total, item) => total + item.price, 0);

  return (
    <div className="bg-g0-1000 p-4 flex-grow flex flex-col">
      <h2 className="text-lg font-semibold mb-4 border-b border-g1-800 pb-2">登録商品一覧</h2>
      {cart.length === 0 ? (
        <div className="flex-grow flex items-center justify-center">
          <p className="text-g1-500">商品はまだ登録されていません</p>
        </div>
      ) : (
        <div className="flex-grow overflow-y-auto">
          {aggregatedCart.map(item => (
            <div key={item.id} className="grid grid-cols-4 gap-2 items-center mb-2">
              <span className="col-span-2">{item.name}</span>
              <span className="text-g1-400 text-sm">x{item.quantity}</span>
              <span className="text-right font-mono">¥{(item.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
      <div className="border-t border-g1-600 pt-4 mt-4 space-y-2">
        {appliedDiscounts.length > 0 && (
          <>
            <div className="flex justify-between items-center text-g1-300">
              <span>小計:</span>
              <span className="font-mono">¥{subtotal.toLocaleString()}</span>
            </div>
            {appliedDiscounts.map(d => (
              <div key={d.id} className="flex justify-between items-center text-g8-300">
                <span>{d.description}</span>
                <span className="font-mono">- ¥{d.amount.toLocaleString()}</span>
              </div>
            ))}
          </>
        )}
        <div className="flex justify-between items-center font-bold text-2xl">
          <span>合計:</span>
          <span className="font-mono">¥{finalPrice.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export default RegisteredItems;
