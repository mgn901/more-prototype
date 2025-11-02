import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MenuBar from '../components/MenuBar';

const denominations = [10000, 5000, 2000, 1000, 500, 100, 50, 10, 5, 1];
type Amount = { [key: number]: number };

const DenominationForm: React.FC<{ amount: Amount, setAmount: (amount: Amount) => void, readOnly?: boolean }> = ({ amount, setAmount, readOnly = false }) => {
  const handleCountChange = (denom: number, value: string) => {
    if (readOnly) return;
    const count = parseInt(value) || 0;
    setAmount({ ...amount, [denom]: count });
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {denominations.map(denom => (
        <div key={denom} className="flex flex-col">
          <label htmlFor={`denom-${denom}`} className="mb-1 text-sm text-G1-300">{denom.toLocaleString()}円</label>
          <input 
            id={`denom-${denom}`}
            type="number"
            min="0"
            readOnly={readOnly}
            value={amount[denom] || ''}
            onChange={e => handleCountChange(denom, e.target.value)}
            className={`bg-G0-1000 border border-G1-700 rounded p-2 w-full ${readOnly ? 'text-G1-400' : ''}`}
            placeholder="0"
          />
        </div>
      ))}
    </div>
  );
};

const PayoutSection: React.FC<{type: 'seller' | 'depositor', title: string, cta: string, color: string}> = ({ type, title, cta, color }) => {
  const { instanceId } = useParams<{ instanceId: string }>();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [payoutData, setPayoutData] = useState<{ totalAmount: number, suggestedPayout: Amount } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchPayout = async () => {
    if (!name) return;
    setIsLoading(true);
    setError(null);
    setPayoutData(null);
    try {
      const response = await fetch(`/api/instances/${instanceId}/payouts/${type}/${name}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch payout suggestion.');
      setPayoutData(data);
    } catch (err: any) { setError(err.message); }
    finally { setIsLoading(false); }
  };

  const handleWithdraw = async () => {
    if (!payoutData) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/instances/${instanceId}/ledger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          entry_type: 'withdrawal',
          data: { person: name, amount: payoutData.suggestedPayout }
        }),
      });
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to record withdrawal.');
      setSuccess('Withdrawal recorded successfully!');
      setTimeout(() => navigate(`/${instanceId}`), 1500);
    } catch (err: any) { setError(err.message); }
    finally { setIsLoading(false); }
  };

  return (
    <div className={`bg-G0-900 p-6 rounded-lg shadow-lg border-l-4 ${color}`}>
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      {error && <p className="bg-R8-800 text-R8-100 p-3 rounded-md mb-4">{error}</p>}
      {success && <p className="bg-G8-800 text-G8-100 p-3 rounded-md mb-4">{success}</p>}
      <div className="flex items-end space-x-4 mb-4">
        <div className="flex-grow">
          <label htmlFor={`${type}-name`} className="block mb-1 text-sm text-G1-300">{type === 'seller' ? '出品者名' : '入金者名'}</label>
          <input id={`${type}-name`} type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-G0-1000 border border-G1-700 rounded p-2" />
        </div>
        <button onClick={fetchPayout} disabled={isLoading || !name} className="bg-G1-700 hover:bg-G1-600 text-G0-50 font-bold rounded py-2 px-4 h-10 disabled:opacity-50">{cta}</button>
      </div>
      {payoutData && (
        <div>
          <p className="mb-2">合計: <span className="font-bold">¥{payoutData.totalAmount.toLocaleString()}</span></p>
          <p className="mb-2 text-sm text-G1-300">推奨出金パターン:</p>
          <DenominationForm amount={payoutData.suggestedPayout} setAmount={() => {}} readOnly={true} />
          <div className="text-right mt-4">
            <button onClick={handleWithdraw} disabled={isLoading} className="bg-T7B1-500 hover:bg-T7B1-400 text-G0-1000 font-bold rounded py-2 px-6">この内容で出金</button>
          </div>
        </div>
      )}
    </div>
  );
};

const ManualTransactionSection: React.FC = () => {
  const { instanceId } = useParams<{ instanceId: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [person, setPerson] = useState('');
  const [amount, setAmount] = useState<Amount>({});
  const [type, setType] = useState<'deposit' | 'withdrawal'>('deposit');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!person) {
      setError(`Name is required.`);
      return;
    }

    const filteredAmount = Object.entries(amount)
      .filter(([, count]) => count > 0)
      .reduce((acc, [denom, count]) => ({ ...acc, [denom]: count }), {});

    if (Object.keys(filteredAmount).length === 0) {
      setError('At least one denomination must have a count greater than zero.');
      return;
    }

    try {
      const response = await fetch(`/api/instances/${instanceId}/ledger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          entry_type: type,
          data: { person, amount: filteredAmount }
        }),
      });

      if (!response.ok) {
        const res = await response.json();
        throw new Error(res.error || `Failed to record ${type}.`);
      }

      setSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} recorded successfully!`);
      setPerson('');
      setAmount({});
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="bg-G0-900 p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4">手動での入金・出金</h2>
      {error && <p className="bg-R8-800 text-R8-100 p-3 rounded-md mb-4">{error}</p>}
      {success && <p className="bg-G8-800 text-G8-100 p-3 rounded-md mb-4">{success}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center space-x-4">
          <label className="block text-sm font-medium text-G1-300">操作種別</label>
          <div className="flex rounded-md bg-G0-800 p-1">
            <button type="button" onClick={() => setType('deposit')} className={`px-3 py-1 text-sm rounded-md ${type === 'deposit' ? 'bg-G4T4-500 text-G0-1000' : ''}`}>入金</button>
            <button type="button" onClick={() => setType('withdrawal')} className={`px-3 py-1 text-sm rounded-md ${type === 'withdrawal' ? 'bg-T7B1-500 text-G0-1000' : ''}`}>出金</button>
          </div>
        </div>
        <div>
          <label htmlFor="manual-person" className="block mb-1 text-sm text-G1-300">名前 (入金者・出金者)</label>
          <input id="manual-person" type="text" value={person} onChange={e => setPerson(e.target.value)} required className="w-full md:w-1/2 bg-G0-1000 border border-G1-700 rounded p-2" />
        </div>
        <DenominationForm amount={amount} setAmount={setAmount} />
        <div className="text-right">
          <button type="submit" className="bg-T4B4-500 hover:bg-T4B4-400 text-G0-1000 font-bold rounded py-2 px-6">実行</button>
        </div>
      </form>
    </div>
  );
};

const VirtualDrawerPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-G0-1000 text-G0-100 flex flex-col">
      <MenuBar />
      <div className="container mx-auto p-4 md:p-8">
        <h1 className="text-3xl font-bold text-T4B4-300 mb-6">仮想ドロワ入出金</h1>
        <div className="space-y-12">
          <PayoutSection type="seller" title="売上金の出金" cta="売上額を計算" color="border-T7B1-500" />
          <PayoutSection type="depositor" title="釣銭準備金の返金" cta="入金額を計算" color="border-G4T4-500" />
          <ManualTransactionSection />
        </div>
      </div>
    </div>
  );
};

export default VirtualDrawerPage;