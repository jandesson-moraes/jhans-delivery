import React from 'react';
import { Utensils } from 'lucide-react';
import { AppConfig } from '../types';

export const BrandLogo = ({ size = 'normal', dark = false, config }: { size?: 'small'|'normal'|'large', dark?: boolean, config?: AppConfig }) => {
    const sizeClasses = { small: 'text-lg', normal: 'text-2xl', large: 'text-4xl' };
    const iconSize = size === 'large' ? 48 : size === 'normal' ? 32 : 20;
    
    const appName = config?.appName || "Jhans Burgers";
    const appLogo = config?.appLogoUrl;

    return (
        <div className={`flex items-center gap-3 font-extrabold tracking-tight ${sizeClasses[size]} ${dark ? 'text-slate-800' : 'text-white'}`}>
            {appLogo ? (
                <div className={`rounded-xl flex items-center justify-center shadow-md overflow-hidden bg-slate-800 ${size === 'small' ? 'w-8 h-8' : size === 'normal' ? 'w-12 h-12' : 'w-20 h-20'} shrink-0`}>
                    <img src={appLogo} alt="Logo" className="w-full h-full object-cover"/>
                </div>
            ) : (
                <div className={`bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0 ${size === 'small' ? 'p-1.5' : 'p-2.5'}`}>
                    <Utensils className="text-white" size={iconSize} />
                </div>
            )}
            
            <div className="flex flex-col leading-none items-start">
                <span>{appName}</span>
                {size !== 'small' && <span className={`text-[0.4em] uppercase tracking-widest text-left ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Delivery System</span>}
            </div>
        </div>
    );
};

export function SidebarBtn({ icon, label, active, onClick, highlight }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 p-3.5 rounded-xl transition-all ${active ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/20' : highlight ? 'bg-white/5 text-white border border-white/10 hover:bg-white/10' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
      <div className={active ? 'text-white' : highlight ? 'text-amber-400' : 'text-current'}>{icon}</div>
      <span className="font-medium text-sm">{label}</span>
    </button>
  );
}

export function StatBox({label, value, icon, color, subtext}: any) {
   return (
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-lg flex items-center justify-between gap-4 hover:border-amber-500/30 transition-all duration-300">
         <div>
             <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mb-1 truncate">{label}</p>
             <p className="text-2xl font-extrabold text-white truncate leading-none">{value}</p>
             {subtext && <p className="text-[10px] text-slate-500 mt-2 truncate">{subtext}</p>}
         </div>
         <div className={`p-3 rounded-xl shrink-0 ${color || 'bg-slate-800 text-slate-400'}`}>{icon}</div>
      </div>
   )
}

export const Footer = () => (
    <div className="w-full py-8 flex flex-col items-center justify-center opacity-40 hover:opacity-100 transition-opacity duration-500 mt-auto">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
            Desenvolvido por <span className="text-amber-600/80">Jhan Houzer</span>
        </p>
        <p className="text-[9px] text-slate-600 mt-1 font-mono">
            © Todos os direitos reservados 2026
        </p>
    </div>
);