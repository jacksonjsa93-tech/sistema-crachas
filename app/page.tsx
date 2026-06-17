"use client";

import React, { useState, useRef } from 'react';

export default function PortalRH() {
  // ==========================================
  // ESTADOS DO PORTAL RH
  // ==========================================
  const [abaAtiva, setAbaAtiva] = useState('dashboard');

  const menuItens = [
    { id: 'dashboard', nome: 'Painel de Controlo', icone: 'fa-chart-pie' },
    { id: 'colaboradores', nome: 'Colaboradores', icone: 'fa-users' },
    { id: 'cadastro', nome: 'Cadastro Manual', icone: 'fa-user-plus' },
    { id: 'importacao', nome: 'Importação Excel', icone: 'fa-file-excel' },
    { id: 'emissao', nome: 'Emissão de Crachás', icone: 'fa-id-badge' },
    { id: 'qrcode', nome: 'Gestão QR Code', icone: 'fa-qrcode' },
    { id: 'configuracoes', nome: 'Configurações', icone: 'fa-cogs' },
  ];

  // ==========================================
  // ESTADOS E FUNÇÕES DA EMISSÃO DE CRACHÁS
  // ==========================================
  const [busca, setBusca] = useState('');
  const [colaborador, setColaborador] = useState<any>(null);
  const [erro, setErro] = useState('');
  const [cameraAtiva, setCameraAtiva] = useState(false);
  const [fotoCapturada, setFotoCapturada] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  const URL = "https://dpndtwutvkaxrxrkyeyw.supabase.co";
  const KEY = "sb_publishable_6Ss9lNdcbyeE2o3U5jcJ7w_qI61wmIr";

  const handleBusca = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      const response = await fetch(`${URL}/rest/v1/colaboradores?matricula=eq.${busca}&select=*`, {
        headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }
      });
      const data = await response.json();
      if (data && data.length > 0) {
        setColaborador(data[0]);
        setFotoCapturada(data[0].foto_url || null);
      } else {
        setColaborador(null);
        setErro('Matrícula não encontrada na base do sistema.');
      }
    } catch (error) {
      setErro('Erro ao conectar com o banco de dados.');
    } finally {
      setCarregando(false);
    }
  };

  const ligarCamera = async () => {
    setCameraAtiva(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 400 } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert("Erro ao acessar a câmera. Verifique as permissões.");
      setCameraAtiva(false);
    }
  };

  const tirarFoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, 400, 400);
        setFotoCapturada(canvas.toDataURL('image/jpeg'));
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        setCameraAtiva(false);
      }
    }
  };

  const handleUploadFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) setFotoCapturada(event.target.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const formatarNomeCurto = (nomeCompleto: string) => {
    if (!nomeCompleto) return "";
    const partes = nomeCompleto.trim().split(" ");
    if (partes.length === 1) return partes[0];
    return `${partes[0]} ${partes[partes.length - 1]}`;
  };

  const obterDataHoraAtual = () => {
    const data = new Date();
    const dataFormatada = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
    const horaFormatada = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${dataFormatada} ${horaFormatada}`;
  };

  // ==========================================
  // RENDERIZAÇÃO DO SISTEMA
  // ==========================================
  return (
    <div className="flex h-screen bg-[#eceff1] font-poppins text-[#263238] overflow-hidden screen-only">
      
      {/* --- MENU LATERAL (SIDEBAR) --- */}
      <aside className="w-64 flex flex-col shadow-xl z-20 hide-on-print" style={{ backgroundColor: '#023A58' }}>
        <div className="h-20 flex items-center justify-center border-b border-[#035B8B] px-4">
          <img src="/logodinamobranca.png" alt="Dínamo Engenharia" className="max-h-12 object-contain drop-shadow-md" />
        </div>

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

        <div className="p-4 border-t border-[#035B8B] text-center">
          <div className="text-[10px] text-slate-400 font-medium">SGSO Premium v2.0</div>
          <div className="text-[10px] text-slate-500">Regional Norte (PA)</div>
        </div>
      </aside>

      {/* --- ÁREA PRINCIPAL --- */}
      <main className="flex-1 flex flex-col relative overflow-hidden print-main-adjust">
        
        {/* CABEÇALHO */}
        <header className="h-20 bg-white shadow-sm border-b border-[#cfd8dc] flex items-center justify-between px-8 z-10 hide-on-print">
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

        {/* CONTEÚDO DINÂMICO DAS ABAS */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar print-padding-remove">
          
          {/* 1. ABA DASHBOARD */}
          {abaAtiva === 'dashboard' && (
            <div className="space-y-6 animation-fade-in hide-on-print">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-[#cfd8dc] shadow-sm flex items-center gap-5 border-l-4 border-l-[#023A58]">
                  <div className="w-14 h-14 rounded-full bg-[#e3f2fd] flex items-center justify-center text-[#023A58] text-2xl"><i className="fas fa-users"></i></div>
                  <div><p className="text-sm text-slate-500 font-semibold uppercase tracking-wide">Total na Base</p><h3 className="text-3xl font-bold text-[#263238]">0</h3></div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-[#cfd8dc] shadow-sm flex items-center gap-5 border-l-4 border-l-[#2ecc71]">
                  <div className="w-14 h-14 rounded-full bg-[#e8f5e9] flex items-center justify-center text-[#2ecc71] text-2xl"><i className="fas fa-id-card"></i></div>
                  <div><p className="text-sm text-slate-500 font-semibold uppercase tracking-wide">Crachás Emitidos</p><h3 className="text-3xl font-bold text-[#263238]">0</h3></div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-[#cfd8dc] shadow-sm flex items-center gap-5 border-l-4 border-l-[#f39c12]">
                  <div className="w-14 h-14 rounded-full bg-[#fff8e1] flex items-center justify-center text-[#f39c12] text-2xl"><i className="fas fa-link"></i></div>
                  <div><p className="text-sm text-slate-500 font-semibold uppercase tracking-wide">QR Codes Ativos</p><h3 className="text-3xl font-bold text-[#263238]">0</h3></div>
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

          {/* 2. ABA EMISSÃO DE CRACHÁS (O nosso módulo milimétrico) */}
          {abaAtiva === 'emissao' && (
            <div className="animation-fade-in max-w-6xl mx-auto">
              <form onSubmit={handleBusca} className="bg-white p-6 rounded-xl border border-[#cfd8dc] shadow-sm mb-8 flex gap-4 items-end hide-on-print">
                <div className="flex-1">
                  <label className="block text-sm font-bold mb-2 text-[#023A58]">Procurar Matrícula na Base</label>
                  <input type="text" placeholder="Ex: 6294" value={busca} onChange={(e) => setBusca(e.target.value)} className="w-full bg-[#f8f9fa] border border-[#b0bec5] rounded-lg px-4 py-3 text-[#263238] focus:outline-none focus:border-[#035B8B]" />
                </div>
                <button type="submit" disabled={carregando} className="bg-[#023A58] text-white font-bold px-8 py-3 rounded-lg hover:bg-[#035B8B] transition-all shadow-sm">
                  {carregando ? 'A procurar...' : 'Carregar Colaborador'}
                </button>
              </form>

              {erro && <p className="text-[#e74c3c] mb-6 bg-[#fdeced] p-4 rounded-lg border border-[#f5b7b1] font-medium hide-on-print">{erro}</p>}

              {colaborador && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  {/* Controlo de Câmara */}
                  <div className="bg-white p-6 rounded-xl border border-[#cfd8dc] shadow-sm flex flex-col items-center hide-on-print">
                    <h3 className="text-lg font-bold text-[#023A58] mb-4 w-full border-b border-[#eceff1] pb-2">Controlo da Fotografia</h3>
                    <div className="w-48 h-64 bg-[#f8f9fa] border-2 border-dashed border-[#b0bec5] rounded-lg overflow-hidden relative flex items-center justify-center mb-4">
                      {cameraAtiva ? (
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                      ) : fotoCapturada ? (
                        <img src={fotoCapturada} alt="Pré-visualização" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-slate-400 text-xs text-center px-4 font-medium">Nenhuma foto<br/>capturada.</span>
                      )}
                    </div>
                    <div className="w-full space-y-2">
                      {cameraAtiva ? (
                        <button onClick={tirarFoto} className="w-full bg-[#2ecc71] hover:bg-[#27ae60] text-white font-bold py-2 rounded-lg shadow-sm">Capturar Foto</button>
                      ) : (
                        <button onClick={ligarCamera} className="w-full bg-[#035B8B] hover:bg-[#023A58] text-white font-bold py-2 rounded-lg shadow-sm"><i className="fas fa-camera mr-2"></i> Ligar Câmara</button>
                      )}
                      <label className="block w-full bg-[#eceff1] hover:bg-[#cfd8dc] text-[#263238] text-center font-bold py-2 rounded-lg cursor-pointer transition-colors">
                        <i className="fas fa-upload mr-2"></i> Enviar Ficheiro
                        <input type="file" accept="image/*" onChange={handleUploadFoto} className="hidden" />
                      </label>
                    </div>
                  </div>

                  {/* Visualização de Impressão CR80 */}
                  <div className="xl:col-span-2 bg-white p-6 rounded-xl border border-[#cfd8dc] shadow-sm">
                    <div className="flex justify-between items-center mb-6 border-b border-[#eceff1] pb-4 hide-on-print">
                      <h3 className="text-lg font-bold text-[#023A58]">Visualização (Cartão CR80)</h3>
                      <button 
                        onClick={() => window.print()}
                        disabled={!fotoCapturada}
                        className={`font-bold px-6 py-2 rounded-lg transition-all shadow-sm ${fotoCapturada ? 'bg-[#023A58] hover:bg-[#035B8B] text-white' : 'bg-[#eceff1] text-[#90a4ae] cursor-not-allowed'}`}
                      >
                        <i className="fas fa-print mr-2"></i> Imprimir na Smart-51
                      </button>
                    </div>

                    <div className="flex flex-col md:flex-row gap-8 justify-center items-center bg-[#f8f9fa] p-8 rounded-lg overflow-x-auto print-container border border-[#eceff1]">
                      
                      {/* --- FRENTE --- */}
                      <div className="cracha-card w-[54mm] h-[86mm] bg-white relative flex flex-col items-center overflow-hidden box-border" style={{ border: '1px solid #ccc' }}>
                        <div className="mt-[4mm] w-[26mm] h-[35mm] flex items-center justify-center overflow-hidden z-10 border border-slate-300 bg-white">
                          {fotoCapturada && <img src={fotoCapturada} className="w-full h-full object-cover" alt="Foto" />}
                        </div>
                        <div className="mt-[2mm] text-center z-10 w-full px-2">
                          <div className="text-[#051e42] font-black text-[18px] leading-[1.0]" style={{ fontFamily: 'Arial, sans-serif' }}>
                            {formatarNomeCurto(colaborador.nome_completo).split(' ')[0]}<br/>
                            {formatarNomeCurto(colaborador.nome_completo).split(' ')[1] || ''}
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 w-full h-[32mm] z-0">
                           <img src="/Imagem1.png" className="w-full h-full object-fill" alt="Fundo" />
                        </div>
                        <div className="absolute bottom-[13mm] left-[1mm] z-10 w-[24mm] h-[8mm] flex items-center justify-start">
                          <img src="/dinamo.png" className="max-h-full max-w-full object-contain" alt="Dínamo" />
                        </div>
                      </div>

                      {/* --- VERSO --- */}
                      <div className="cracha-card w-[54mm] h-[86mm] bg-white relative p-[2mm] flex flex-col box-border" style={{ border: '1px solid #ccc' }}>
                        <div className="mt-[2mm] w-full flex flex-col gap-[3mm]">
                          <div className="relative border-[1.5px] border-black rounded-[4px] h-[7mm] flex items-center justify-center w-full">
                            <span className="absolute -top-[2.5mm] left-[2mm] bg-white px-[1mm] text-[6px] font-bold text-black leading-none">Nome</span>
                            <div className="text-[7.5px] text-black font-semibold uppercase">{colaborador.nome_completo}</div>
                          </div>
                          <div className="relative border-[1.5px] border-black rounded-[4px] h-[7mm] flex items-center justify-center w-full">
                            <span className="absolute -top-[2.5mm] left-[2mm] bg-white px-[1mm] text-[6px] font-bold text-black leading-none">CPF</span>
                            <div className="text-[8px] text-black font-semibold uppercase">{colaborador.cpf || '000.000.000-00'}</div>
                          </div>
                          <div className="flex w-full gap-[2mm] items-stretch h-[24mm]">
                             <div className="flex flex-col flex-1 justify-between">
                                <div className="relative border-[1.5px] border-black rounded-[4px] h-[7mm] flex items-center justify-center w-full">
                                  <span className="absolute -top-[2.5mm] left-[2mm] bg-white px-[1mm] text-[6px] font-bold text-black leading-none">Função</span>
                                  <div className="text-[7px] text-black font-semibold uppercase truncate px-1">{colaborador.desc_funcao}</div>
                                </div>
                                <div className="relative border-[1.5px] border-black rounded-[4px] h-[7mm] flex items-center justify-center w-full">
                                  <span className="absolute -top-[2.5mm] left-[2mm] bg-white px-[1mm] text-[6px] font-bold text-black leading-none">Car. Identidade</span>
                                  <div className="text-[8px] text-black font-semibold uppercase">{colaborador.rg || '0000000000'}</div>
                                </div>
                                <div className="relative border-[1.5px] border-black rounded-[4px] h-[7mm] flex items-center justify-center w-full">
                                  <span className="absolute -top-[2.5mm] left-[2mm] bg-white px-[1mm] text-[6px] font-bold text-black leading-none">Matrícula</span>
                                  <div className="text-[8px] text-black font-semibold uppercase">{String(colaborador.matricula).padStart(8, '0')}</div>
                                </div>
                             </div>
                             <div className="w-[21mm] flex-shrink-0 flex items-center justify-center border border-slate-100 p-[0.5mm] bg-white rounded-sm z-10">
                                <img 
                                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://sgso.dinamo.srv.br/colaborador/${colaborador.matricula}`} 
                                  className="w-full h-full object-contain"
                                  alt="QR Code"
                                />
                             </div>
                          </div>
                          <div className="relative border-[1.5px] border-black rounded-[4px] h-[7mm] flex items-center justify-center w-full">
                            <span className="absolute -top-[2.5mm] left-[2mm] bg-white px-[1mm] text-[6px] font-bold text-black leading-none">Empresa</span>
                            <div className="text-[8px] text-black font-semibold uppercase">DINAMO ENGENHARIA</div>
                          </div>
                        </div>
                        <div className="absolute bottom-[2mm] left-[2mm] right-[2mm] z-0 flex flex-col items-center">
                          <div className="text-[7px] text-black leading-[1.3] mb-[3mm] text-center font-medium w-[47mm]">
                            Em caso de extravio/perda, favor comunicar ao<br/>Departamento Pessoal.
                          </div>
                          <div className="text-center w-full mb-[1mm]">
                            <div className="text-[7.5px] font-bold text-black mb-[0.5mm]">www.dinamo.srv.br</div>
                            <div className="text-[6.5px] text-black">Pass Xingu, Coqueiro| Belém-PA |CEP 66823-335</div>
                          </div>
                          <div className="text-[5.5px] text-black font-bold text-right w-full mt-[1mm]">
                            Emitido em: {obterDataHoraAtual()}
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* OUTRAS ABAS (Placeholders) */}
          {['colaboradores', 'cadastro', 'importacao', 'qrcode', 'configuracoes'].includes(abaAtiva) && (
            <div className="bg-white p-10 rounded-xl border border-[#cfd8dc] shadow-sm text-center animation-fade-in flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-20 h-20 bg-[#e3f2fd] rounded-full flex items-center justify-center text-[#023A58] text-3xl mb-4">
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

      {/* --- ESTILOS GLOBAIS E DE IMPRESSÃO --- */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css');
        
        .font-poppins { font-family: 'Poppins', sans-serif; }

        .animation-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cfd8dc; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #b0bec5; }

        /* MÁGICA DA IMPRESSÃO: Esconde o menu e mostra só o crachá */
        @media print {
          body * { visibility: hidden; }
          .hide-on-print { display: none !important; }
          
          .print-container, .print-container * { visibility: visible; }
          
          @page {
            size: 54mm 86mm;
            margin: 0 !important;
          }

          html, body {
            width: 54mm !important;
            height: 86mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            overflow: hidden !important;
          }

          .print-main-adjust {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 54mm !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
          }

          .print-padding-remove {
            padding: 0 !important;
            overflow: visible !important;
          }

          .print-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 54mm !important;
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
            border: none !important;
          }

          .cracha-card {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            width: 54mm !important;
            height: 86mm !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
            page-break-after: always !important;
            overflow: hidden !important;
            float: none !important;
          }

          .cracha-card:last-of-type {
            page-break-after: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}
