import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MenuBar from '../components/MenuBar';

const denominations = [10000, 5000, 2000, 1000, 500, 100, 50, 10, 5, 1];

type Amount = { [key: number]: number };

const DenominationForm: React.FC<{ amount: Amount, setAmount: (amount: Amount) => void }> = ({ amount, setAmount }) => {
  const handleCountChange = (denom: number, value: string) => {
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
            value={amount[denom] || ''}
            onChange={e => handleCountChange(denom, e.target.value)}
            className="bg-G0-1000 border border-G1-700 rounded p-2 w-full"
            placeholder="0"
          />
        </div>
      ))}
    </div>
  );
};

const VirtualDrawerPage: React.FC = () => {
  const { instanceId } = useParams<{ instanceId: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Deposit state
  const [depositPerson, setDepositPerson] = useState('');
  const [depositAmount, setDepositAmount] = useState<Amount>({});

  // Withdrawal state
  const [withdrawalPerson, setWithdrawalPerson] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState<Amount>({});

  const handleSubmit = async (e: React.FormEvent, type: 'deposit' | 'withdrawal') => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const person = type === 'deposit' ? depositPerson : withdrawalPerson;
    const amount = type === 'deposit' ? depositAmount : withdrawalAmount;

    if (!person) {
      setError(`Name is required for ${type}.`);
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
      // Reset forms
      setDepositPerson('');
      setDepositAmount({});
      setWithdrawalPerson('');
      setWithdrawalAmount({});
      setTimeout(() => navigate(`/${instanceId}`), 1500);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-G0-1000 text-G0-100 flex flex-col">
      <MenuBar />
      <div className="container mx-auto p-4 md:p-8">
        <h1 className="text-3xl font-bold text-T4B4-300 mb-6">仮想ドロワ入出金</h1>

        {error && <p className="bg-R8-800 text-R8-100 p-3 rounded-md mb-6">{error}</p>}
        {success && <p className="bg-G8-800 text-G8-100 p-3 rounded-md mb-6">{success}</p>}

        {/* Deposit Form */}
        <div className="bg-G0-900 p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-xl font-semibold mb-4 text-G4T4-300">釣銭準備金を入金</h2>
          <form onSubmit={(e) => handleSubmit(e, 'deposit')} className="space-y-4">
            <div>
              <label htmlFor="deposit-person" className="block mb-1 text-sm text-G1-300">入金者名</label>
              <input id="deposit-person" type="text" value={depositPerson} onChange={e => setDepositPerson(e.target.value)} required className="w-full md:w-1/2 bg-G0-1000 border border-G1-700 rounded p-2" />
            </div>
            <DenominationForm amount={depositAmount} setAmount={setDepositAmount} />
            <div className="text-right">
              <button type="submit" className="bg-G4T4-500 hover:bg-G4T4-400 text-G0-1000 font-bold rounded py-2 px-6">入金する</button>
            </div>
          </form>
        </div>

        {/* Withdrawal Form */}
        <div className="bg-G0-900 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-T7B1-300">売上を出金</h2>
          <form onSubmit={(e) => handleSubmit(e, 'withdrawal')} className="space-y-4">
            <div>
              <label htmlFor="withdrawal-person" className="block mb-1 text-sm text-G1-300">出金者名 (出品者名など)</label>
              <input id="withdrawal-person" type="text" value={withdrawalPerson} onChange={e => setWithdrawalPerson(e.target.value)} required className="w-full md:w-1/2 bg-G0-1000 border border-G1-700 rounded p-2" />
            </div>
            <DenominationForm amount={withdrawalAmount} setAmount={setWithdrawalAmount} />
            <div className="text-right">
              <button type="submit" className="bg-T7B1-500 hover:bg-T7B1-400 text-G0-1000 font-bold rounded py-2 px-6">出金する</button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};

export default VirtualDrawerPage;
