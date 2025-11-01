import React from 'react';
import { Link, NavLink, useParams } from 'react-router-dom';

const MenuBar: React.FC = () => {
  const { instanceId } = useParams<{ instanceId: string }>();
  const base = `/${instanceId}`;

  const linkClass = "px-3 py-2 rounded-md text-sm font-medium";
  const activeClass = "bg-G0-800 text-white";
  const inactiveClass = "text-G1-300 hover:bg-G0-700 hover:text-white";

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) => 
    `${linkClass} ${isActive ? activeClass : inactiveClass}`;

  return (
    <div className="bg-G0-900 text-G0-100 p-4 shadow-md flex justify-between items-center">
      <div className="flex space-x-4 items-center">
        <Link to="/" className="font-bold text-xl text-T4B4-300 hover:text-T4B4-200">HMPOS</Link>
        <nav className="flex space-x-2">
            <NavLink to={base} end className={getNavLinkClass}>メイン</NavLink>
            <NavLink to={`${base}/master`} className={getNavLinkClass}>商品マスタ</NavLink>
            <NavLink to={`${base}/ledger`} className={getNavLinkClass}>台帳</NavLink>
        </nav>
      </div>
      <div>
        <Link to="/" className="text-sm text-G1-400 hover:text-G1-200">ホームに戻る</Link>
      </div>
    </div>
  );
};

export default MenuBar;
