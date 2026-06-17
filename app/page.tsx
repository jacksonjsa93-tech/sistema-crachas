"use client";

import React, { useState } from 'react';

export default function PortalRH() {
  // Estado para controlar qual aba (ecrã) está visível
  const [abaAtiva, setAbaAtiva] = useState('dashboard');

  // Menu de navegação dinâmico
  const menuItens = [
    { id: 'dashboard', nome: 'Painel de Controlo', icone: 'fa-chart-pie' },
    { id: 'colaboradores', nome: 'Colaboradores', icone: 'fa-users' },
    { id: 'cadastro', nome: 'Cadastro Manual', icone: 'fa-user-plus' },
    { id: 'importacao', nome: 'Importação Excel', icone: 'fa-file-excel' },
    { id: 'emissao', nome: 'Emissão de Crachás', icone: 'fa-id-badge' },
    { id: 'qrcode', nome: 'Gestão QR Code', icone: 'fa-qrcode' },
    { id: 'configuracoes', nome: 'Configurações', icone: 'fa-cogs' },
  ];

  return (
    <div className="flex h-screen bg-[#eceff1] font-poppins text-[#263238] overflow-hidden">
      
      {/* --- MENU LATERAL (SIDEBAR) --- */}
      <aside className="w-64 flex flex-col shadow-xl z-20" style={{ backgroundColor: '#023A58' }}>
        
        {/* Logo Área */}
        <div className="h-20 flex items-center justify-center border-b border-[#035B8B] px-4">
          <img src="/logodinamobranca.png" alt="Dínamo Engenharia" className="max-h-12 object-contain drop-shadow-md" />
        </div>

        {/* Navegação */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-2 custom-scrollbar">
          <div className="text-[#90a4ae] text-xs font-bold uppercase tracking-wider mb-4 px-3">
            Gestão Operacional
          </div>
          
          {menuItens.map((item) => (
            <button
              key={item.id}
              onClick={() => setAbaAtiva(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium text-sm
                ${abaAtiva === item.id 
                  ? 'bg-[#035B8B] text-white shadow-md transform translate-x-1' 
                  : 'text-slate-300 hover:bg-[#035B8B]/50 hover:text-white'
                }`}
            >
              <i className={`fas ${item.icone} w-5 text-center text-lg`}></i>
              {item.nome}
            </button>
          ))}
        </nav>

        {/* Rodapé do Menu */}
        <div className="p-4 border-t border-[#035B8B] text-center">
          <div className="text-[10px] text-slate-400 font-medium">SGSO Premium v2.0</div>
          <div className="text-[10px] text-slate-500">Regional Norte (PA)</div>
        </div>
      </aside>

      {/* --- ÁREA PRINCIPAL --- */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* Cabeçalho (Header) */}
        <header className="h-20 bg-white shadow-sm border-b border-[#cfd8dc] flex items-center justify-between px-8 z-10">
          <div>
            <h2 className="text-xl font-bold text-[#023A58] flex items-center gap-2">
              <i className={`fas ${menuItens.find(m => m.id === abaAtiva)?.icone} text-[#035B8B]`}></i>
              {menuItens.find(m => m.id === abaAtiva)?.nome}
            </h2>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 bg-[#f8f9fa] px-4 py-2 rounded-full border border-[#eceff1]">
              <div className="w-8 h-8 rounded-full bg-[#035B8B] flex items-center justify-center text-white font-bold shadow-sm">
                JA
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[#023A58] leading-tight">Jackson Abreu</span>
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Coord. Operacional</span>
              </div>
            </div>
            
            <button className="text-slate-400 hover:text-[#e74c3c] transition-colors text-xl" title="Sair do Sistema">
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </header>

        {/* Conteúdo Dinâmico das Abas */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          
          {/* ABA: DASHBOARD */}
          {abaAtiva === 'dashboard' && (
            <div className="space-y-6 animation-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="bg-white p-6 rounded-xl border border-[#cfd8dc] shadow-sm flex items-center gap-5 border-l-4 border-l-[#023A58] hover:shadow-md transition-shadow">
                  <div className="w-14 h-14 rounded-full bg-[#e3f2fd] flex items-center justify-center text-[#023A58] text-2xl">
                    <i className="fas fa-users"></i>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-semibold uppercase tracking-wide">Total na Base</p>
                    <h3 className="text-3xl font-bold text-[#263238]">0</h3>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-[#cfd8dc] shadow-sm flex items-center gap-5 border-l-4 border-l-[#2ecc71] hover:shadow-md transition-shadow">
                  <div className="w-14 h-14 rounded-full bg-[#e8f5e9] flex items-center justify-center text-[#2ecc71] text-2xl">
                    <i className="fas fa-id-card"></i>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-semibold uppercase tracking-wide">Crachás Emitidos</p>
                    <h3 className="text-3xl font-bold text-[#263238]">0</h3>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-[#cfd8dc] shadow-sm flex items-center gap-5 border-l-4 border-l-[#f39c12] hover:shadow-md transition-shadow">
                  <div className="w-14 h-14 rounded-full bg-[#fff8e1] flex items-center justify-center text-[#f39c12] text-2xl">
                    <i className="fas fa-link"></i>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-semibold uppercase tracking-wide">QR Codes Ativos</p>
                    <h3 className="text-3xl font-bold text-[#263238]">0</h3>
                  </div>
                </div>

              </div>

              <div className="bg-white p-6 rounded-xl border border-[#cfd8dc] shadow-sm">
                <div className="flex justify-between items-center mb-4 border-b border-[#eceff1] pb-4">
                  <h3 className="font-bold text-[#023A58] text-lg">Últimas Movimentações</h3>
                  <button className="text-sm text-[#035B8B] font-semibold hover:underline">Ver Histórico Completo</button>
                </div>
                <div className="text-center py-10 text-slate-400">
                  <i className="fas fa-inbox text-4xl mb-3 opacity-50"></i>
                  <p>Nenhuma movimentação registada no momento.</p>
                </div>
              </div>
            </div>
          )}

          {/* ABA: COLABORADORES */}
          {abaAtiva === 'colaboradores' && (
            <div className="bg-white rounded-xl border border-[#cfd8dc] shadow-sm overflow-hidden animation-fade-in">
              <div className="p-6 border-b border-[#eceff1] bg-[#fafafa] flex justify-between items-center">
                <div className="flex gap-4 items-center w-1/2">
                  <div className="relative w-full">
                    <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"></i>
                    <input type="text" placeholder="Procurar por Nome, Matrícula ou CPF..." 
                           className="w-full pl-12 pr-4 py-2 border border-[#b0bec5] rounded-lg focus:outline-none focus:border-[#023A58] transition-colors" />
                  </div>
                </div>
                <button className="bg-[#023A58] text-white px-5 py-2 rounded-lg font-semibold hover:bg-[#035B8B] transition-colors shadow-sm">
                  <i className="fas fa-filter mr-2"></i> Filtros
                </button>
              </div>
              <div className="p-10 text-center text-slate-500">
                <p>A lista de colaboradores irá aparecer aqui com a ligação ao Supabase.</p>
              </div>
            </div>
          )}

          {/* OUTRAS ABAS (Placeholders temporários) */}
          {['cadastro', 'importacao', 'emissao', 'qrcode', 'configuracoes'].includes(abaAtiva) && (
            <div className="bg-white p-10 rounded-xl border border-[#cfd8dc] shadow-sm text-center animation-fade-in flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-20 h-20 bg-[#eceff1] rounded-full flex items-center justify-center text-[#023A58] text-3xl mb-4">
                <i className={`fas ${menuItens.find(m => m.id === abaAtiva)?.icone}`}></i>
              </div>
              <h2 className="text-2xl font-bold text-[#263238] mb-2">Módulo em Construção</h2>
              <p className="text-slate-500 max-w-md">
                O ecrã de <strong>{menuItens.find(m => m.id === abaAtiva)?.nome}</strong> será integrado em breve nesta área, seguindo o padrão visual do SGSO Premium.
              </p>
            </div>
          )}

        </div>
      </main>

      {/* --- ESTILOS GLOBAIS E IMPORTAÇÃO DE FONTES/ÍCONES --- */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css');
        
        .font-poppins {
          font-family: 'Poppins', sans-serif;
        }

        .animation-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Estilização da barra de rolagem (Scrollbar) para ficar Premium */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cfd8dc;
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #b0bec5;
        }
      `}</style>
    </div>
  );
}
