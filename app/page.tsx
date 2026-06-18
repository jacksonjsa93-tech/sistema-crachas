/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';

export default function PortalRH() {
  const [abaAtiva, setAbaAtiva] = useState('emissao'); // Inicia na aba de emissão para testar o telemóvel

  const menuItens = [
    { id: 'dashboard', nome: 'Painel de Controlo', icone: 'fa-chart-pie' },
    { id: 'colaboradores', nome: 'Colaboradores', icone: 'fa-users' },
    { id: 'cadastro', nome: 'Cadastro Manual', icone: 'fa-user-plus' },
    { id: 'importacao', nome: 'Importação Excel', icone: 'fa-file-excel' },
    { id: 'emissao', nome: 'Emissão de Crachás', icone: 'fa-id-badge' },
    { id: 'qrcode', nome: 'Gestão QR Code', icone: 'fa-qrcode' },
    { id: 'configuracoes', nome: 'Configurações', icone: 'fa-cogs' },
  ];

  // Estados Gerais
  const [busca, setBusca] = useState('');
  const [colaborador, setColaborador] = useState<any>(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  // Estados do Estúdio de Fotografia (Câmara e Edição)
  const [cameraAtiva, setCameraAtiva] = useState(false);
  const [fotoCapturada, setFotoCapturada] = useState<string | null>(null);
  const [rawFoto, setRawFoto] = useState<string | null>(null); // A foto bruta antes do recorte
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [clarear, setClarear] = useState(false);
  const [salvandoFoto, setSalvandoFoto] = useState(false);
  const [msgFoto, setMsgFoto] = useState({ texto: '', tipo: '' });

  // Estados da Importação Excel
  const [ficheiroExcel, setFicheiroExcel] = useState<File | null>(null);
  const [arrastando, setArrastando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [resultadoMsg, setResultadoMsg] = useState({ tipo: '', texto: '' });

  const videoRef = useRef<HTMLVideoElement>(null);

  const URL = "https://dpndtwutvkaxrxrkyeyw.supabase.co";
  const KEY = "sb_publishable_6Ss9lNdcbyeE2o3U5jcJ7w_qI61wmIr";

  // ==========================================
  // LÓGICA DE IMPORTAÇÃO EXCEL (Mantida e Funcional)
  // ==========================================
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setArrastando(true); };
  const handleDragLeave = () => setArrastando(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setArrastando(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) { setFicheiroExcel(e.dataTransfer.files[0]); setResultadoMsg({ tipo: '', texto: '' }); }
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) { setFicheiroExcel(e.target.files[0]); setResultadoMsg({ tipo: '', texto: '' }); }
  };

  const processarFicheiro = async () => {
    if (!ficheiroExcel) return;
    setImportando(true); setResultadoMsg({ tipo: 'loading', texto: 'A ler ficheiro Excel...' });
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const json: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        if (json.length === 0) { setResultadoMsg({ tipo: 'erro', texto: 'O ficheiro está vazio.' }); setImportando(false); return; }
        
        setResultadoMsg({ tipo: 'loading', texto: `A enviar ${json.length} registos para a base de dados...` });
        const payload = json.map((row) => ({
          matricula: String(row['Matricula'] || row['MATRICULA'] || '').trim(),
          nome_completo: String(row['Nome completo'] || row['NOME COMPLETO'] || row['Nome Completo'] || '').trim().toUpperCase(),
          cpf: String(row['CPF'] || '').trim(),
          rg: String(row['RG'] || '').trim(),
          desc_funcao: String(row['Desc.Funcao'] || row['DESC.FUNCAO'] || row['Desc. Funcao'] || '').trim().toUpperCase(),
        })).filter(row => row.matricula && row.nome_completo);

        const response = await fetch(`${URL}/rest/v1/colaboradores`, {
          method: 'POST',
          headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates' },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Falha no servidor.');
        setResultadoMsg({ tipo: 'sucesso', texto: `${payload.length} colaboradores importados com sucesso!` });
        setTimeout(() => setFicheiroExcel(null), 3000);
      } catch (error) {
        setResultadoMsg({ tipo: 'erro', texto: 'Erro ao importar os dados.' });
      } finally { setImportando(false); }
    };
    reader.readAsArrayBuffer(ficheiroExcel);
  };

  // ==========================================
  // LÓGICA DE BUSCA
  // ==========================================
  const handleBusca = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(''); setMsgFoto({ texto: '', tipo: '' }); setRawFoto(null);
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
    } catch (error) { setErro('Erro de ligação à base de dados.'); } 
    finally { setCarregando(false); }
  };

  // ==========================================
  // ESTÚDIO DE FOTOGRAFIA E RECORTE (MOBILE & PC)
  // ==========================================
  const ligarCamera = async () => {
    setCameraAtiva(true); setRawFoto(null); setMsgFoto({ texto: '', tipo: '' });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 600, height: 600, facingMode: 'user' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert("Permissão de câmara negada ou dispositivo não encontrado.");
      setCameraAtiva(false);
    }
  };

  const tirarFoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 600; canvas.height = 600; // Alta resolução para permitir zoom sem perder qualidade
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, 600, 600);
        setRawFoto(canvas.toDataURL('image/jpeg', 1.0)); // Guarda a foto bruta no editor
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        setCameraAtiva(false);
      }
    }
  };

  const handleUploadFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMsgFoto({ texto: '', tipo: '' });
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) setRawFoto(event.target.result as string); // Envia para o editor
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // O MÁGICO APLICADOR DE RECORTE
  const aplicarRecorte = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 260; // 26mm (Proporção do crachá)
    canvas.height = 350; // 35mm
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = new Image();
    img.src = rawFoto as string;
    img.onload = () => {
      // Aplica o filtro de clarear a parede se estiver ativo
      if (clarear) ctx.filter = 'brightness(1.25) contrast(1.15)';
      
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      
      ctx.translate(cx, cy);
      ctx.scale(zoom, zoom);
      ctx.translate(-cx + panX, -cy + panY);

      const scaleFit = Math.max(canvas.width / img.width, canvas.height / img.height);
      const w = img.width * scaleFit;
      const h = img.height * scaleFit;

      ctx.drawImage(img, -w/2, -h/2, w, h);

      const finalImg = canvas.toDataURL('image/jpeg', 0.95);
      setFotoCapturada(finalImg); // Aplica no crachá
      setRawFoto(null); // Fecha o editor
      setZoom(1); setPanX(0); setPanY(0); setClarear(false);
    };
  };

  // GUARDAR DEFINITIVAMENTE NO SUPABASE
  const salvarFotoNoSupabase = async () => {
    if (!fotoCapturada || !colaborador) return;
    setSalvandoFoto(true); setMsgFoto({ texto: 'A guardar fotografia na nuvem...', tipo: 'loading' });
    try {
      const response = await fetch(`${URL}/rest/v1/colaboradores?matricula=eq.${colaborador.matricula}`, {
        method: 'PATCH',
        headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify({ foto_url: fotoCapturada })
      });
      if (!response.ok) throw new Error('Erro ao salvar');
      setMsgFoto({ texto: 'Fotografia guardada com sucesso na Base de Dados!', tipo: 'sucesso' });
    } catch (err) {
      setMsgFoto({ texto: 'Erro de ligação ao guardar fotografia.', tipo: 'erro' });
    } finally { setSalvandoFoto(false); }
  };

  const formatarNomeCurto = (nomeCompleto: string) => {
    if (!nomeCompleto) return ""; const partes = nomeCompleto.trim().split(" ");
    return partes.length === 1 ? partes[0] : `${partes[0]} ${partes[partes.length - 1]}`;
  };

  const obterDataHoraAtual = () => {
    const data = new Date();
    return `${data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })} ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="flex h-screen bg-[#eceff1] font-poppins text-[#263238] overflow-hidden screen-only">
      
      {/* MENU LATERAL */}
      <aside className="w-64 flex flex-col shadow-xl z-20 hide-on-print" style={{ backgroundColor: '#023A58' }}>
        <div className="h-20 flex items-center justify-center border-b border-[#035B8B] px-4">
          <img src="/logodinamobranca.png" alt="Dínamo" className="max-h-12 object-contain drop-shadow-md" />
        </div>
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-2 custom-scrollbar">
          <div className="text-[#90a4ae] text-xs font-bold uppercase tracking-wider mb-4 px-3">Gestão Operacional</div>
          {menuItens.map((item) => (
            <button key={item.id} onClick={() => setAbaAtiva(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium text-sm
                ${abaAtiva === item.id ? 'bg-[#035B8B] text-white shadow-md transform translate-x-1' : 'text-slate-300 hover:bg-[#035B8B]/50 hover:text-white'}`}>
              <i className={`fas ${item.icone} w-5 text-center text-lg`}></i> {item.nome}
            </button>
          ))}
        </nav>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 flex flex-col relative overflow-hidden print-main-adjust">
        
        {/* HEADER */}
        <header className="h-20 bg-white shadow-sm border-b border-[#cfd8dc] flex items-center justify-between px-8 z-10 hide-on-print">
          <h2 className="text-xl font-bold text-[#023A58] flex items-center gap-2">
            <i className={`fas ${menuItens.find(m => m.id === abaAtiva)?.icone} text-[#035B8B]`}></i> {menuItens.find(m => m.id === abaAtiva)?.nome}
          </h2>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 bg-[#f8f9fa] px-4 py-2 rounded-full border border-[#eceff1]">
              <div className="w-8 h-8 rounded-full bg-[#035B8B] flex items-center justify-center text-white font-bold shadow-sm">JA</div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[#023A58] leading-tight">Jackson Abreu</span>
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Coord. Operacional</span>
              </div>
            </div>
          </div>
        </header>

        {/* CONTEÚDO DAS ABAS */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar print-padding-remove">
          
          {/* IMPORTAÇÃO (Resumida para poupar espaço visual aqui) */}
          {abaAtiva === 'importacao' && (
            <div className="animation-fade-in max-w-4xl mx-auto hide-on-print">
              <div className="bg-white rounded-xl border border-[#cfd8dc] shadow-sm overflow-hidden">
                <div className="p-6 border-b border-[#eceff1] bg-[#fafafa]">
                  <h3 className="font-bold text-[#023A58] text-lg"><i className="fas fa-upload mr-2"></i> Importação de Colaboradores em Lote</h3>
                  <p className="text-sm text-slate-500 mt-1">Carregue a base de dados do sistema principal (XLSX, CSV) para atualizar o SGSO Premium automaticamente.</p>
                </div>
                <div className="p-8">
                  <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-all cursor-pointer ${arrastando ? 'border-[#2ecc71] bg-[#e8f5e9]' : 'border-[#b0bec5] bg-[#f8f9fa] hover:bg-[#eceff1]'}`}>
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-[#035B8B] text-4xl shadow-sm mb-4"><i className="fas fa-file-excel"></i></div>
                    <h4 className="text-lg font-bold text-[#023A58] mb-2">Arraste e solte a planilha Excel aqui</h4>
                    <label className="bg-[#023A58] text-white px-8 py-3 rounded-lg font-bold hover:bg-[#035B8B] transition-colors shadow-sm cursor-pointer mt-4">
                      Procurar Ficheiro <input type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={handleFileSelect} />
                    </label>
                  </div>
                  {ficheiroExcel && (
                    <div className="mt-8 p-4 bg-[#e8f5e9] border border-[#2ecc71] rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-4"><i className="fas fa-check-circle text-[#2ecc71] text-2xl"></i><div><p className="font-bold text-[#263238]">{ficheiroExcel.name}</p></div></div>
                      <div className="flex gap-3">
                        <button onClick={() => {setFicheiroExcel(null); setResultadoMsg({tipo: '', texto: ''})}} disabled={importando} className="px-4 py-2 text-sm font-bold text-[#e74c3c] hover:bg-[#ffebee] rounded-lg">Remover</button>
                        <button onClick={processarFicheiro} disabled={importando} className="px-6 py-2 text-sm font-bold bg-[#2ecc71] text-white rounded-lg hover:bg-[#27ae60] flex items-center gap-2">
                          {importando ? <><i className="fas fa-spinner fa-spin"></i> Processando...</> : <><i className="fas fa-database"></i> Enviar Base</>}
                        </button>
                      </div>
                    </div>
                  )}
                  {resultadoMsg.texto && (<div className={`mt-6 p-4 rounded-lg font-medium border ${resultadoMsg.tipo === 'sucesso' ? 'bg-[#e8f5e9] text-[#27ae60] border-[#2ecc71]' : resultadoMsg.tipo === 'erro' ? 'bg-[#fdeced] text-[#c0392b] border-[#e74c3c]' : 'bg-[#e3f2fd] text-[#035B8B] border-[#3498db]'}`}>{resultadoMsg.texto}</div>)}
                </div>
              </div>
            </div>
          )}

          {/* ABA EMISSÃO (COM ESTÚDIO DE FOTOGRAFIA MOBILE) */}
          {abaAtiva === 'emissao' && (
            <div className="animation-fade-in max-w-6xl mx-auto">
              <form onSubmit={handleBusca} className="bg-white p-6 rounded-xl border border-[#cfd8dc] shadow-sm mb-8 flex gap-4 items-end hide-on-print">
                <div className="flex-1">
                  <label className="block text-sm font-bold mb-2 text-[#023A58]">Procurar Matrícula na Base</label>
                  <input type="number" placeholder="Ex: 6294" value={busca} onChange={(e) => setBusca(e.target.value)} className="w-full bg-[#f8f9fa] border border-[#b0bec5] rounded-lg px-4 py-3 text-[#263238] focus:outline-none focus:border-[#035B8B]" />
                </div>
                <button type="submit" disabled={carregando} className="bg-[#023A58] text-white font-bold px-8 py-3 rounded-lg hover:bg-[#035B8B] transition-all shadow-sm">
                  {carregando ? 'A procurar...' : 'Carregar'}
                </button>
              </form>

              {erro && <p className="text-[#e74c3c] mb-6 bg-[#fdeced] p-4 rounded-lg border border-[#f5b7b1] font-medium hide-on-print">{erro}</p>}

              {colaborador && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  
                  {/* COLUNA ESQUERDA: CONTROLO E ESTÚDIO */}
                  <div className="bg-white p-6 rounded-xl border border-[#cfd8dc] shadow-sm flex flex-col items-center hide-on-print">
                    <h3 className="text-lg font-bold text-[#023A58] mb-4 w-full border-b border-[#eceff1] pb-2">Controlo da Fotografia</h3>
                    
                    {/* SE ESTIVER NO MODO ESTÚDIO (Foto Bruta Carregada) */}
                    {rawFoto ? (
                      <div className="flex flex-col items-center w-full animation-fade-in">
                        <div className="text-xs font-bold text-[#e74c3c] mb-2 w-full text-center bg-[#ffebee] py-1 rounded">Modo de Recorte Ativo</div>
                        
                        {/* Máscara de Pré-visualização do Recorte */}
                        <div className="relative w-48 h-64 bg-slate-900 overflow-hidden mb-4 rounded-lg shadow-inner" style={{ filter: clarear ? 'brightness(1.25) contrast(1.15)' : 'none' }}>
                          <img 
                            src={rawFoto} alt="Raw" 
                            style={{ 
                              transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`, 
                              transformOrigin: 'center', width: '100%', height: '100%', objectFit: 'cover'
                            }} 
                          />
                          {/* Guias visuais de enquadramento */}
                          <div className="absolute inset-0 border-2 border-[#2ecc71] border-dashed pointer-events-none opacity-60"></div>
                        </div>

                        {/* Controlos Deslizantes (Sliders Tácteis) */}
                        <div className="w-full space-y-3 bg-[#f8f9fa] p-3 rounded-lg border border-[#eceff1]">
                          <div>
                            <label className="text-xs font-bold text-[#546e7a] flex justify-between"><span>🔍 Zoom</span> <span>{Math.round(zoom * 100)}%</span></label>
                            <input type="range" min="1" max="3" step="0.05" value={zoom} onChange={e => setZoom(Number(e.target.value))} className="w-full accent-[#035B8B]" />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-[#546e7a]">↔️ Esquerda / Direita</label>
                            <input type="range" min="-150" max="150" value={panX} onChange={e => setPanX(Number(e.target.value))} className="w-full accent-[#035B8B]" />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-[#546e7a]">↕️ Cima / Baixo</label>
                            <input type="range" min="-150" max="150" value={panY} onChange={e => setPanY(Number(e.target.value))} className="w-full accent-[#035B8B]" />
                          </div>
                        </div>

                        {/* Botão Mágico Clarear Fundo */}
                        <label className="flex items-center justify-center gap-2 mt-4 w-full bg-white border border-[#cfd8dc] p-3 rounded-lg cursor-pointer hover:bg-[#eceff1] transition-colors">
                          <input type="checkbox" checked={clarear} onChange={e => setClarear(e.target.checked)} className="w-4 h-4 accent-[#023A58]" />
                          <span className="text-sm font-bold text-[#023A58]">✨ Clarear Fundo (Parede Branca)</span>
                        </label>

                        {/* Ação Final do Editor */}
                        <div className="flex gap-2 w-full mt-4">
                          <button onClick={() => setRawFoto(null)} className="flex-1 bg-[#eceff1] text-[#546e7a] font-bold py-3 rounded-lg hover:bg-[#cfd8dc]">Cancelar</button>
                          <button onClick={aplicarRecorte} className="flex-1 bg-[#2ecc71] hover:bg-[#27ae60] text-white font-bold py-3 rounded-lg shadow-sm"><i className="fas fa-crop-alt mr-2"></i> Aplicar Recorte</button>
                        </div>
                      </div>
                    ) : (
                      /* SE NÃO ESTIVER NO ESTÚDIO (Câmara ou Foto já Pronta) */
                      <div className="w-full flex flex-col items-center">
                        <div className="w-48 h-64 bg-[#f8f9fa] border-2 border-dashed border-[#b0bec5] rounded-lg overflow-hidden relative flex items-center justify-center mb-4">
                          {cameraAtiva ? <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" /> : fotoCapturada ? <img src={fotoCapturada} alt="Crachá" className="w-full h-full object-cover" /> : <span className="text-slate-400 text-xs text-center px-4 font-medium">Nenhuma foto.<br/>Use o telemóvel para capturar.</span>}
                        </div>
                        
                        <div className="w-full space-y-2">
                          {cameraAtiva ? (
                            <button onClick={tirarFoto} className="w-full bg-[#e74c3c] hover:bg-[#c0392b] text-white font-bold py-3 rounded-lg shadow-sm"><i className="fas fa-camera mr-2"></i> Capturar</button>
                          ) : (
                            <button onClick={ligarCamera} className="w-full bg-[#035B8B] hover:bg-[#023A58] text-white font-bold py-3 rounded-lg shadow-sm"><i className="fas fa-camera mr-2"></i> Abrir Câmara (Telemóvel)</button>
                          )}
                          <label className="block w-full bg-[#eceff1] hover:bg-[#cfd8dc] text-[#263238] text-center font-bold py-3 rounded-lg cursor-pointer transition-colors">
                            <i className="fas fa-image mr-2"></i> Escolher da Galeria
                            <input type="file" accept="image/*" onChange={handleUploadFoto} className="hidden" />
                          </label>
                        </div>

                        {/* BOTÃO DE GUARDAR NO SUPABASE (Aparece apenas quando há foto no crachá) */}
                        {fotoCapturada && (
                          <div className="w-full mt-6 border-t border-[#eceff1] pt-4">
                            <button onClick={salvarFotoNoSupabase} disabled={salvandoFoto} className="w-full bg-[#f39c12] hover:bg-[#d35400] text-white font-bold py-3 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                              {salvandoFoto ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-cloud-upload-alt"></i>}
                              Guardar Foto na Base
                            </button>
                            {msgFoto.texto && (
                              <p className={`text-xs text-center mt-2 font-bold ${msgFoto.tipo === 'sucesso' ? 'text-[#27ae60]' : msgFoto.tipo === 'erro' ? 'text-[#e74c3c]' : 'text-[#035B8B]'}`}>{msgFoto.texto}</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* COLUNA DIREITA: VISUALIZAÇÃO E IMPRESSÃO (PC) */}
                  <div className="xl:col-span-2 bg-white p-6 rounded-xl border border-[#cfd8dc] shadow-sm">
                    <div className="flex justify-between items-center mb-6 border-b border-[#eceff1] pb-4 hide-on-print">
                      <h3 className="text-lg font-bold text-[#023A58]">Visualização (Impressão PC)</h3>
                      <button onClick={() => window.print()} disabled={!fotoCapturada || !!rawFoto} className={`font-bold px-6 py-3 rounded-lg transition-all shadow-sm ${fotoCapturada && !rawFoto ? 'bg-[#023A58] hover:bg-[#035B8B] text-white' : 'bg-[#eceff1] text-[#90a4ae] cursor-not-allowed'}`}><i className="fas fa-print mr-2"></i> Imprimir na Smart-51</button>
                    </div>

                    <div className="flex flex-col md:flex-row gap-8 justify-center items-center bg-[#f8f9fa] p-8 rounded-lg overflow-x-auto print-container border border-[#eceff1]">
                      
                      {/* FRENTE */}
                      <div className="cracha-card w-[54mm] h-[86mm] bg-white relative flex flex-col items-center overflow-hidden box-border" style={{ border: '1px solid #ccc' }}>
                        <div className="mt-[4mm] w-[26mm] h-[35mm] flex items-center justify-center overflow-hidden z-10 border border-slate-300 bg-white">
                          {fotoCapturada && <img src={fotoCapturada} className="w-full h-full object-cover" alt="Foto" />}
                        </div>
                        <div className="mt-[2mm] text-center z-10 w-full px-2">
                          <div className="text-[#051e42] font-black text-[18px] leading-[1.0]" style={{ fontFamily: 'Arial, sans-serif' }}>
                            {formatarNomeCurto(colaborador.nome_completo).split(' ')[0]}<br/>{formatarNomeCurto(colaborador.nome_completo).split(' ')[1] || ''}
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 w-full h-[32mm] z-0"><img src="/Imagem1.png" className="w-full h-full object-fill" alt="Fundo" /></div>
                        <div className="absolute bottom-[13mm] left-[1mm] z-10 w-[24mm] h-[8mm] flex items-center justify-start"><img src="/dinamo.png" className="max-h-full max-w-full object-contain" alt="Dínamo" /></div>
                      </div>

                      {/* VERSO */}
                      <div className="cracha-card w-[54mm] h-[86mm] bg-white relative p-[2mm] flex flex-col box-border" style={{ border: '1px solid #ccc' }}>
                        <div className="mt-[2mm] w-full flex flex-col gap-[3mm]">
                          <div className="relative border-[1.5px] border-black rounded-[4px] h-[7mm] flex items-center justify-center w-full"><span className="absolute -top-[2.5mm] left-[2mm] bg-white px-[1mm] text-[6px] font-bold text-black leading-none">Nome</span><div className="text-[7.5px] text-black font-semibold uppercase">{colaborador.nome_completo}</div></div>
                          <div className="relative border-[1.5px] border-black rounded-[4px] h-[7mm] flex items-center justify-center w-full"><span className="absolute -top-[2.5mm] left-[2mm] bg-white px-[1mm] text-[6px] font-bold text-black leading-none">CPF</span><div className="text-[8px] text-black font-semibold uppercase">{colaborador.cpf || '000.000.000-00'}</div></div>
                          <div className="flex w-full gap-[2mm] items-stretch h-[24mm]">
                             <div className="flex flex-col flex-1 justify-between">
                                <div className="relative border-[1.5px] border-black rounded-[4px] h-[7mm] flex items-center justify-center w-full"><span className="absolute -top-[2.5mm] left-[2mm] bg-white px-[1mm] text-[6px] font-bold text-black leading-none">Função</span><div className="text-[7px] text-black font-semibold uppercase truncate px-1">{colaborador.desc_funcao}</div></div>
                                <div className="relative border-[1.5px] border-black rounded-[4px] h-[7mm] flex items-center justify-center w-full"><span className="absolute -top-[2.5mm] left-[2mm] bg-white px-[1mm] text-[6px] font-bold text-black leading-none">Car. Identidade</span><div className="text-[8px] text-black font-semibold uppercase">{colaborador.rg || '0000000000'}</div></div>
                                <div className="relative border-[1.5px] border-black rounded-[4px] h-[7mm] flex items-center justify-center w-full"><span className="absolute -top-[2.5mm] left-[2mm] bg-white px-[1mm] text-[6px] font-bold text-black leading-none">Matrícula</span><div className="text-[8px] text-black font-semibold uppercase">{String(colaborador.matricula).padStart(8, '0')}</div></div>
                             </div>
                             <div className="w-[21mm] flex-shrink-0 flex items-center justify-center border border-slate-100 p-[0.5mm] bg-white rounded-sm z-10"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://sgso.dinamo.srv.br/colaborador/${colaborador.matricula}`} className="w-full h-full object-contain" alt="QR Code" /></div>
                          </div>
                          <div className="relative border-[1.5px] border-black rounded-[4px] h-[7mm] flex items-center justify-center w-full"><span className="absolute -top-[2.5mm] left-[2mm] bg-white px-[1mm] text-[6px] font-bold text-black leading-none">Empresa</span><div className="text-[8px] text-black font-semibold uppercase">DINAMO ENGENHARIA</div></div>
                        </div>
                        <div className="absolute bottom-[2mm] left-[2mm] right-[2mm] z-0 flex flex-col items-center p-b[2mm]">
                          <div className="text-[7px] text-black leading-[1.3] mb-[3mm] text-center font-medium w-[47mm]">Em caso de extravio/perda, favor comunicar ao<br/>Departamento Pessoal.</div>
                          <div className="text-center w-full mb-[1mm]">
                            <div className="text-[7.5px] font-bold text-black mb-[0.5mm]">www.dinamo.srv.br</div>
                            <div className="text-[6.5px] text-black">Pass Xingu, Coqueiro| Belém-PA |CEP 66823-335</div>
                          </div>
                          <div className="text-[5.5px] text-black font-bold text-right w-full mt-[1mm]">Emitido em: {obterDataHoraAtual()}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* OUTRAS ABAS (Placeholders) */}
          {['dashboard', 'colaboradores', 'cadastro', 'qrcode', 'configuracoes'].includes(abaAtiva) && (
            <div className="bg-white p-10 rounded-xl border border-[#cfd8dc] shadow-sm text-center animation-fade-in flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-20 h-20 bg-[#e3f2fd] rounded-full flex items-center justify-center text-[#023A58] text-3xl mb-4"><i className={`fas ${menuItens.find(m => m.id === abaAtiva)?.icone}`}></i></div>
              <h2 className="text-2xl font-bold text-[#263238] mb-2">Módulo em Construção</h2>
              <p className="text-slate-500 max-w-md">O ecrã de <strong>{menuItens.find(m => m.id === abaAtiva)?.nome}</strong> será integrado em breve.</p>
            </div>
          )}

        </div>
      </main>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css');
        
        .font-poppins { font-family: 'Poppins', sans-serif; }
        .animation-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cfd8dc; border-radius: 20px; }

        @media print {
          body * { visibility: hidden; }
          .hide-on-print { display: none !important; }
          .print-container, .print-container * { visibility: visible; }
          @page { size: 54mm 86mm; margin: 0 !important; }
          html, body { width: 54mm !important; height: 86mm !important; margin: 0 !important; padding: 0 !important; background: white !important; overflow: hidden !important; }
          .print-main-adjust { position: absolute !important; left: 0 !important; top: 0 !important; width: 54mm !important; padding: 0 !important; margin: 0 !important; overflow: visible !important; }
          .print-padding-remove { padding: 0 !important; overflow: visible !important; }
          .print-container { position: absolute !important; left: 0 !important; top: 0 !important; width: 54mm !important; display: block !important; padding: 0 !important; margin: 0 !important; background: transparent !important; border: none !important; }
          .cracha-card { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; width: 54mm !important; height: 86mm !important; box-sizing: border-box !important; margin: 0 !important; border: none !important; box-shadow: none !important; page-break-inside: avoid !important; page-break-after: always !important; overflow: hidden !important; float: none !important; }
          .cracha-card:last-of-type { page-break-after: avoid !important; }
        }
      `}</style>
    </div>
  );
}
