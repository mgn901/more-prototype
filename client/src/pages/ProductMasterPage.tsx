import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import MenuBar from '../components/MenuBar';
import AddDiscountForm from '../components/AddDiscountForm';

// Type definitions
export type Product = {
  id: number;
  name: string;
  price: number;
  seller_name: string | null;
};

export type DiscountCondition = {
  id: number;
  type: 'quantity_discount' | 'value_discount';
  details: string; // JSON string
};

const ProductMasterPage: React.FC = () => {
  const { instanceId } = useParams<{ instanceId: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [discounts, setDiscounts] = useState<DiscountCondition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for "Add Product" form
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductSeller, setNewProductSeller] = useState('');

  // State for "Edit Product" modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [productsRes, discountsRes] = await Promise.all([
        fetch(`/api/instances/${instanceId}/products`),
        fetch(`/api/instances/${instanceId}/discounts`),
      ]);
      if (!productsRes.ok) throw new Error('Failed to fetch products.');
      if (!discountsRes.ok) throw new Error('Failed to fetch discounts.');
      setProducts(await productsRes.json());
      setDiscounts(await discountsRes.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [instanceId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await fetch(`/api/instances/${instanceId}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newProductName, 
          price: parseInt(newProductPrice), 
          seller_name: newProductSeller || null 
        }),
      });
      if (!response.ok) throw new Error('Failed to add product.');
      setNewProductName('');
      setNewProductPrice('');
      setNewProductSeller('');
      fetchData(); // Refresh all data
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        const response = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete product.');
        fetchData(); // Refresh all data
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(JSON.parse(JSON.stringify(product))); // Deep copy to avoid mutation issues
    setIsEditModalOpen(true);
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      const response = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingProduct.name,
          price: editingProduct.price,
          seller_name: editingProduct.seller_name,
        }),
      });
      if (!response.ok) throw new Error('Failed to update product.');
      setIsEditModalOpen(false);
      setEditingProduct(null);
      fetchData(); // Refresh all data
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteDiscount = async (discountId: number) => {
    if (window.confirm('Are you sure you want to delete this discount condition?')) {
      try {
        const response = await fetch(`/api/discounts/${discountId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete discount.');
        fetchData(); // Refresh all data
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-g0-1000 text-g0-100 flex flex-col">
      <MenuBar />
      <div className="container mx-auto p-4 md:p-8">
        <h1 className="text-3xl font-bold text-t4b4-300 mb-6">商品・価格マスタ管理</h1>

        {error && <p className="bg-r8-800 text-r8-100 p-3 rounded-md mb-6">{error}</p>}

        {/* Add Product Form */}
        <div className="bg-g0-900 p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">新しい商品を追加</h2>
          <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="flex flex-col">
              <label htmlFor="name" className="mb-1 text-sm text-g1-300">商品名</label>
              <input id="name" type="text" value={newProductName} onChange={e => setNewProductName(e.target.value)} required className="bg-g0-1000 border border-g1-700 rounded p-2" />
            </div>
            <div className="flex flex-col">
              <label htmlFor="price" className="mb-1 text-sm text-g1-300">価格 (円)</label>
              <input id="price" type="number" value={newProductPrice} onChange={e => setNewProductPrice(e.target.value)} required className="bg-g0-1000 border border-g1-700 rounded p-2" />
            </div>
            <div className="flex flex-col">
              <label htmlFor="seller" className="mb-1 text-sm text-g1-300">出品者 (任意)</label>
              <input id="seller" type="text" value={newProductSeller} onChange={e => setNewProductSeller(e.target.value)} className="bg-g0-1000 border border-g1-700 rounded p-2" />
            </div>
            <button type="submit" className="bg-t4b4-500 hover:bg-t4b4-400 text-g0-1000 font-bold rounded p-2 h-10">追加</button>
          </form>
        </div>

        {/* Products List */}
        <div className="bg-g0-900 rounded-lg shadow-lg overflow-hidden mb-12">
          {isLoading ? <p className="p-4">Loading products...</p> : (
            <table className="w-full">
              <thead className="bg-g0-800">
                <tr>
                  <th className="p-3 text-left text-sm font-semibold text-g1-300">商品名</th>
                  <th className="p-3 text-right text-sm font-semibold text-g1-300">価格</th>
                  <th className="p-3 text-left text-sm font-semibold text-g1-300">出品者</th>
                  <th className="p-3 text-center text-sm font-semibold text-g1-300">操作</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id} className="border-b border-g0-800">
                    <td className="p-3">{product.name}</td>
                    <td className="p-3 text-right">¥{product.price.toLocaleString()}</td>
                    <td className="p-3 text-g1-400">{product.seller_name || 'N/A'}</td>
                    <td className="p-3 text-center space-x-2">
                      <button onClick={() => openEditModal(product)} className="text-y8-300 hover:text-y8-200">編集</button>
                      <button onClick={() => handleDeleteProduct(product.id)} className="text-r8-300 hover:text-r8-200">削除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Discount Management Section */}
        <div>
            <h2 className="text-2xl font-bold text-t4b4-300 mb-6">値割引条件の管理</h2>
            <AddDiscountForm products={products} onDiscountAdd={fetchData} />
            <div className="bg-g0-900 rounded-lg shadow-lg overflow-hidden">
              {isLoading ? <p className="p-4">Loading discounts...</p> : (
                <table className="w-full">
                  <thead className="bg-g0-800">
                    <tr>
                      <th className="p-3 text-left text-sm font-semibold text-g1-300">割引内容</th>
                      <th className="p-3 text-center text-sm font-semibold text-g1-300">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {discounts.map(d => {
                      const details = JSON.parse(d.details);
                      const productNames = details.product_ids.map((id: number) => products.find(p => p.id === id)?.name || 'Unknown').join(', ');
                      const description = d.type === 'quantity_discount'
                        ? `${productNames} を ${details.required_quantity}個購入で ${details.discount_rate}% 割引`
                        : `${productNames} を ${details.required_quantity}個購入で ${details.discount_value}円 値引`;

                      return (
                        <tr key={d.id} className="border-b border-g0-800">
                          <td className="p-3">{description}</td>
                          <td className="p-3 text-center space-x-2">
                            <button onClick={() => handleDeleteDiscount(d.id)} className="text-r8-300 hover:text-r8-200">削除</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
        </div>
      </div>

      {/* Edit Product Modal */}
      {isEditModalOpen && editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-g0-900 p-8 rounded-lg shadow-2xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6">商品を編集</h2>
            <form onSubmit={handleUpdateProduct} className="space-y-4">
               <div>
                  <label htmlFor="edit-name" className="block mb-1 text-sm text-g1-300">商品名</label>
                  <input id="edit-name" type="text" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} required className="w-full bg-g0-1000 border border-g1-700 rounded p-2" />
               </div>
               <div>
                  <label htmlFor="edit-price" className="block mb-1 text-sm text-g1-300">価格 (円)</label>
                  <input id="edit-price" type="number" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: parseInt(e.target.value) || 0})} required className="w-full bg-g0-1000 border border-g1-700 rounded p-2" />
               </div>
               <div>
                  <label htmlFor="edit-seller" className="block mb-1 text-sm text-g1-300">出品者 (任意)</label>
                  <input id="edit-seller" type="text" value={editingProduct.seller_name || ''} onChange={e => setEditingProduct({...editingProduct, seller_name: e.target.value})} className="w-full bg-g0-1000 border border-g1-700 rounded p-2" />
               </div>
               <div className="flex justify-end space-x-4 pt-4">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="bg-g1-700 hover:bg-g1-600 text-g0-50 font-bold rounded py-2 px-4">キャンセル</button>
                  <button type="submit" className="bg-t4b4-500 hover:bg-t4b4-400 text-g0-1000 font-bold rounded py-2 px-4">更新</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductMasterPage;
