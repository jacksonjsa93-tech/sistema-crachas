/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useRef } from 'react';

export default function PortalRH() {
  const [abaAtiva, setAbaAtiva] = useState('lote');

  const menuItens = [
    { id: 'colaboradores', nome: 'Base de Colaboradores', icone: 'fa-users' },
    { id: 'emissao', nome: 'Emissão Individual', icone: 'fa-id-badge' },
    { id: 'lote', nome: 'Emissão em Lote', icone: 'fa-layer-group' },
    { id: 'qrcode', nome: 'Gestão QR Code', icone: 'fa-qrcode' },
    { id: 'cadastro', nome: 'Cadastro Manual', icone: 'fa-user-plus' },
    { id: 'configuracoes', nome: 'Configurações', icone: 'fa-cogs' },
  ];

  const URL = "https://dpndtwutvkaxrxrkyeyw.supabase.co";
  const KEY = "sb_publishable_6Ss9lNdcbyeE2o3U5jcJ7w_qI61wmIr";

  // ========================== ABA: COLABORADORES ==========================
  const [buscaTabela, setBuscaTabela] = useState('');
  const [resultadosBusca, setResultadosBusca] = useState<any[]>([]);
  const [carregandoLista, setCarregandoLista] = useState(false);
  const [pesquisaRealizada, setPesquisaRealizada] = useState(false);

  const handlePesquisaTabela = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buscaTabela.trim()) return;
    setCarregandoLista(true); setPesquisaRealizada(true);
    const isNum = /^\d+$/.test(buscaTabela.trim());
    let fetchUrl = `${URL}/rest/v1/colaboradores?select=*&limit=50`;
    if (isNum) fetchUrl += `&matricula=eq.${buscaTabela.trim()}`;
    else fetchUrl += `&nome_completo=ilike.*${buscaTabela.trim()}*`;

    try {
      const response = await fetch(fetchUrl, { headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` } });
      const data = await response.json();
      setResultadosBusca(data || []);
    } catch (error) { console.error("Erro na busca"); } 
    finally { setCarregandoLista(false); }
  };

  // ========================== ABA: EMISSÃO EM LOTE ==========================
  const [listaLote, setListaLote] = useState<any[]>([]);
  const [matriculaLote, setMatriculaLote] = useState('');
  const [carregandoLote, setCarregandoLote] = useState(false);
  const [erroLote, setErroLote] = useState('');

  const adicionarAoLote = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroLote('');
    if (!matriculaLote.trim()) return;
    
    if (listaLote.find(c => String(c.matricula) === String(matriculaLote.trim()))) {
      setErroLote('Este colaborador já está na fila de impressão.');
      setMatriculaLote(''); return;
    }

    setCarregandoLote(true);
    try {
      const response = await fetch(`${URL}/rest/v1/colaboradores?matricula=eq.${matriculaLote.trim()}&select=*`, {
        headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }
      });
      const data = await response.json();
      if (data && data.length > 0) {
        setListaLote([...listaLote, data[0]]);
        setMatriculaLote(''); 
      } else {
        setErroLote('Matrícula não encontrada na base.');
      }
    } catch (error) { setErroLote('Erro ao contactar a base.'); } 
    finally { setCarregandoLote(false); }
  };

  const removerDoLote = (matricula: string) => {
    setListaLote(listaLote.filter(c => String(c.matricula) !== String(matricula)));
  };

  // ========================== ABA: EMISSÃO INDIVIDUAL ==========================
  const [colaborador, setColaborador] = useState<any>(null);
  const [buscaEmissao, setBuscaEmissao] = useState('');
  const [carregandoEmissao, setCarregandoEmissao] = useState(false);
  const [erroEmissao, setErroEmissao] = useState('');
  const [cameraAtiva, setCameraAtiva] = useState(false);
  const [fotoCapturada, setFotoCapturada] = useState<string | null>(null);
  const [rawFoto, setRawFoto] = useState<string | null>(null); 
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [clarear, setClarear] = useState(false);
  const [salvandoFoto, setSalvandoFoto] = useState(false);
  const [msgFoto, setMsgFoto] = useState({ texto: '', tipo: '' });
  const videoRef = useRef<HTMLVideoElement>(null);

  const buscarColaboradorParaEmissao = async (matriculaAlvo: string) => {
    setErroEmissao(''); setMsgFoto({ texto: '', tipo: '' }); setRawFoto(null);
    setCarregandoEmissao(true); setBuscaEmissao(matriculaAlvo);
    try {
      const response = await fetch(`${URL}/rest/v1/colaboradores?matricula=eq.${matriculaAlvo}&select=*`, {
        headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }
      });
      const data = await response.json();
      if (data && data.length > 0) {
        setColaborador(data[0]); setFotoCapturada(data[0].foto_url || null); setAbaAtiva('emissao'); 
      } else {
        setColaborador(null); setErroEmissao('Matrícula não encontrada.');
      }
    } catch (error) { setErroEmissao('Erro de ligação.'); } 
    finally { setCarregandoEmissao(false); }
  };

  const ligarCamera = async () => {
    setCameraAtiva(true); setRawFoto(null); setMsgFoto({ texto: '', tipo: '' });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 600, height: 600, facingMode: 'user' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) { alert("Permissão negada."); setCameraAtiva(false); }
  };

  const tirarFoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas'); canvas.width = 600; canvas.height = 600; 
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, 600, 600);
        setRawFoto(canvas.toDataURL('image/jpeg', 1.0)); 
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop()); setCameraAtiva(false);
      }
    }
  };

  const handleUploadFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMsgFoto({ texto: '', tipo: '' });
      const reader = new FileReader();
      reader.onload = (event) => { if (event.target?.result) setRawFoto(event.target.result as string); };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const aplicarRecorte = () => {
    const canvas = document.createElement('canvas'); canvas.width = 260; canvas.height = 350; 
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new Image(); img.src = rawFoto as string;
    img.onload = () => {
      if (clarear) ctx.filter = 'brightness(1.25) contrast(1.15)';
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2; const cy = canvas.height / 2;
      const scaleFit = Math.max(canvas.width / img.width, canvas.height / img.height);
      const w = img.width * scaleFit; const h = img.height * scaleFit;
      ctx.translate(cx + panX, cy + panY); ctx.scale(zoom, zoom); 
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      setFotoCapturada(canvas.toDataURL('image/jpeg', 0.95)); setRawFoto(null); 
      setZoom(1); setPanX(0); setPanY(0); setClarear(false);
    };
  };

  const usarFotoOriginal = () => { setFotoCapturada(rawFoto); setRawFoto(null); };

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
      setMsgFoto({ texto: 'Guardado com sucesso!', tipo: 'sucesso' });
    } catch (err) { setMsgFoto({ texto: 'Erro ao guardar.', tipo: 'erro' }); } 
    finally { setSalvandoFoto(false); }
  };

  // ========================== HELPERS ==========================
  const formatarNomeCurto = (nomeCompleto: string) => {
    if (!nomeCompleto) return ""; const partes = nomeCompleto.trim().split(" ");
    return partes.length === 1 ? partes[0] : `${partes[0]} ${partes[partes.length - 1]}`;
  };

  const obterDataHoraAtual = () => {
    const data = new Date();
    return `${data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })} ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const colaboradoresParaImprimir = abaAtiva === 'lote' 
    ? listaLote 
    : (colaborador && abaAtiva === 'emissao' ? [{ ...colaborador, foto_url: fotoCapturada || colaborador.foto_url }] : []);

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

        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar print-padding-remove">

          {/* ABA LOTE */}
          {abaAtiva === 'lote' && (
            <div className="animation-fade-in max-w-6xl mx-auto hide-on-print flex flex-col h-full gap-6">
              <div className="bg-white p-6 rounded-xl border border-[#cfd8dc] shadow-sm flex flex-col md:flex-row gap-6 items-end">
                <div className="flex-1">
                  <h3 className="font-bold text-[#023A58] text-lg mb-1">Adicionar à Fila de Impressão</h3>
                  <p className="text-xs text-slate-500 mb-4">Insira a matrícula para validar os dados e colocar o colaborador na lista de impressão.</p>
                  <form onSubmit={adicionarAoLote} className="flex gap-4">
                    <input type="text" placeholder="Digite a Matrícula (Ex: 6294)" value={matriculaLote} onChange={(e) => setMatriculaLote(e.target.value)} className="w-full max-w-md bg-[#f8f9fa] border border-[#b0bec5] rounded-lg px-4 py-3 text-[#263238] focus:outline-none focus:border-[#035B8B]" />
                    <button type="submit" disabled={carregandoLote} className="bg-[#035B8B] text-white font-bold px-6 py-3 rounded-lg hover:bg-[#023A58] transition-all shadow-sm flex items-center gap-2">
                      {carregandoLote ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-plus"></i>} Adicionar
                    </button>
                  </form>
                  {erroLote && <p className="text-[#e74c3c] text-xs font-bold mt-2">{erroLote}</p>}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-[#cfd8dc] flex flex-col flex-1 overflow-hidden">
                <div className="p-4 border-b border-[#eceff1] flex justify-between items-center bg-[#fafafa]">
                  <h3 className="font-bold text-[#023A58]">Fila de Impressão Confirmada ({listaLote.length})</h3>
                  <button onClick={() => window.print()} disabled={listaLote.length === 0} className={`font-bold px-6 py-2 text-sm rounded-lg transition-all shadow-sm flex items-center gap-2 ${listaLote.length > 0 ? 'bg-[#2ecc71] hover:bg-[#27ae60] text-white' : 'bg-[#eceff1] text-slate-400 cursor-not-allowed'}`}>
                    <i className="fas fa-print"></i> Imprimir Lote
                  </button>
                </div>
                <div className="overflow-y-auto custom-scrollbar max-h-[500px]">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-[#f8f9fa] z-10 shadow-sm border-b border-[#eceff1]">
                      <tr className="text-xs uppercase tracking-wider text-slate-500 font-bold">
                        <th className="p-4 pl-6">Matrícula</th>
                        <th className="p-4">Nome do Colaborador</th>
                        <th className="p-4 text-center">Status Foto</th>
                        <th className="p-4 text-center">Status Link QR</th>
                        <th className="p-4 text-center">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {listaLote.length === 0 ? (
                        <tr><td colSpan={5} className="p-12 text-center text-slate-400 font-medium"><i className="fas fa-clipboard-list block text-4xl mb-4 opacity-50"></i>A fila de impressão está vazia.</td></tr>
                      ) : (
                        listaLote.map((colab) => (
                          <tr key={colab.matricula} className="border-b border-[#eceff1] hover:bg-[#f8f9fa] transition-colors">
                            <td className="p-4 pl-6 font-bold text-[#035B8B]">{colab.matricula}</td>
                            <td className="p-4 font-semibold text-[#263238]">{colab.nome_completo}</td>
                            <td className="p-4 text-center">
                              {colab.foto_url ? <span className="text-[#27ae60] font-bold text-xs"><i className="fas fa-check-circle"></i> OK</span> : <span className="text-[#c0392b] font-bold text-xs"><i className="fas fa-times-circle"></i> Pendente</span>}
                            </td>
                            <td className="p-4 text-center">
                              {colab.link_qrcode ? <span className="text-[#2980b9] font-bold text-xs"><i className="fas fa-link"></i> Vinculado</span> : <span className="text-[#7f8c8d] font-bold text-xs"><i className="fas fa-unlink"></i> Vazio</span>}
                            </td>
                            <td className="p-4 text-center">
                              <button onClick={() => removerDoLote(colab.matricula)} className="text-[#e74c3c] hover:text-[#c0392b] text-xl"><i className="fas fa-trash-alt"></i></button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ABA EMISSÃO INDIVIDUAL */}
          {abaAtiva === 'emissao' && (
            <div className="animation-fade-in max-w-6xl mx-auto hide-on-print">
              <form onSubmit={(e) => { e.preventDefault(); buscarColaboradorParaEmissao(buscaEmissao); }} className="bg-white p-6 rounded-xl border border-[#cfd8dc] shadow-sm mb-8 flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-bold mb-2 text-[#023A58]">Matrícula (Estúdio Manual)</label>
                  <input type="text" placeholder="Ex: 6294" value={buscaEmissao} onChange={(e) => setBuscaEmissao(e.target.value)} className="w-full bg-[#f8f9fa] border border-[#b0bec5] rounded-lg px-4 py-3 focus:outline-none focus:border-[#035B8B]" />
                </div>
                <button type="submit" disabled={carregandoEmissao} className="bg-[#023A58] text-white font-bold px-8 py-3 rounded-lg hover:bg-[#035B8B] shadow-sm">Buscar</button>
              </form>

              {erroEmissao && <p className="text-[#e74c3c] mb-6 bg-[#fdeced] p-4 rounded-lg font-medium">{erroEmissao}</p>}

              {colaborador && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  <div className="bg-white p-6 rounded-xl border border-[#cfd8dc] shadow-sm flex flex-col items-center">
                    <h3 className="text-lg font-bold text-[#023A58] mb-4 w-full border-b border-[#eceff1] pb-2">Controlo da Fotografia</h3>
                    {rawFoto ? (
                      <div className="flex flex-col items-center w-full animation-fade-in">
                        <div className="relative w-48 h-64 bg-slate-900 overflow-hidden mb-4 rounded-lg shadow-inner" style={{ filter: clarear ? 'brightness(1.25) contrast(1.15)' : 'none' }}>
                          <img src={rawFoto} alt="Raw" style={{ transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`, transformOrigin: 'center', width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div className="absolute inset-0 border-2 border-[#2ecc71] border-dashed pointer-events-none opacity-60"></div>
                        </div>
                        <div className="w-full space-y-3 bg-[#f8f9fa] p-3 rounded-lg border border-[#eceff1]">
                          <div><label className="text-xs font-bold text-[#546e7a] flex justify-between"><span>🔍 Zoom</span></label><input type="range" min="1" max="3" step="0.05" value={zoom} onChange={e => setZoom(Number(e.target.value))} className="w-full accent-[#035B8B]" /></div>
                          <div><label className="text-xs font-bold text-[#546e7a]">↔️ Esq / Dir</label><input type="range" min="-150" max="150" value={panX} onChange={e => setPanX(Number(e.target.value))} className="w-full accent-[#035B8B]" /></div>
                          <div><label className="text-xs font-bold text-[#546e7a]">↕️ Cima / Baixo</label><input type="range" min="-150" max="150" value={panY} onChange={e => setPanY(Number(e.target.value))} className="w-full accent-[#035B8B]" /></div>
                        </div>
                        <label className="flex items-center justify-center gap-2 mt-4 w-full bg-white border border-[#cfd8dc] p-3 rounded-lg cursor-pointer">
                          <input type="checkbox" checked={clarear} onChange={e => setClarear(e.target.checked)} className="w-4 h-4 accent-[#023A58]" />
                          <span className="text-sm font-bold text-[#023A58]">✨ Clarear Fundo</span>
                        </label>
                        <div className="flex gap-2 w-full mt-4">
                          <button onClick={usarFotoOriginal} className="flex-1 bg-[#3498db] text-white font-bold py-2 text-xs rounded-lg shadow-sm">Usar Original</button>
                          <button onClick={aplicarRecorte} className="flex-1 bg-[#2ecc71] text-white font-bold py-2 text-xs rounded-lg shadow-sm">Cortar</button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full flex flex-col items-center">
                        <div className="w-48 h-64 bg-[#f8f9fa] border-2 border-dashed border-[#b0bec5] rounded-lg overflow-hidden relative flex items-center justify-center mb-4">
                          {cameraAtiva ? <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" /> : fotoCapturada ? <img src={fotoCapturada} alt="Crachá" className="w-full h-full object-cover" /> : <span className="text-slate-400 text-xs text-center px-4 font-medium">Sem foto</span>}
                        </div>
                        <div className="w-full space-y-2">
                          {cameraAtiva ? (
                            <button onClick={tirarFoto} className="w-full bg-[#e74c3c] text-white font-bold py-3 rounded-lg shadow-sm"><i className="fas fa-camera mr-2"></i> Capturar</button>
                          ) : (
                            <button onClick={ligarCamera} className="w-full bg-[#035B8B] text-white font-bold py-3 rounded-lg shadow-sm"><i className="fas fa-camera mr-2"></i> Abrir Câmara</button>
                          )}
                          <label className="block w-full bg-[#eceff1] text-[#263238] text-center font-bold py-3 rounded-lg cursor-pointer">
                            <i className="fas fa-image mr-2"></i> Enviar Arquivo <input type="file" accept="image/*" onChange={handleUploadFoto} className="hidden" />
                          </label>
                        </div>
                        {fotoCapturada && (
                          <div className="w-full mt-6 border-t border-[#eceff1] pt-4">
                            <button onClick={salvarFotoNoSupabase} disabled={salvandoFoto} className="w-full bg-[#f39c12] text-white font-bold py-3 rounded-lg shadow-sm w-full">Guardar Foto</button>
                            {msgFoto.texto && <p className={`text-xs text-center mt-2 font-bold ${msgFoto.tipo === 'sucesso' ? 'text-[#27ae60]' : 'text-[#e74c3c]'}`}>{msgFoto.texto}</p>}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="xl:col-span-2 bg-white p-6 rounded-xl border border-[#cfd8dc] shadow-sm">
                    <div className="flex justify-between items-center mb-6 border-b border-[#eceff1] pb-4">
                      <h3 className="text-lg font-bold text-[#023A58]">Visualização do Crachá</h3>
                      <button onClick={() => window.print()} disabled={!fotoCapturada || !!rawFoto} className={`font-bold px-6 py-3 rounded-lg transition-all shadow-sm ${fotoCapturada && !rawFoto ? 'bg-[#023A58] hover:bg-[#035B8B] text-white' : 'bg-[#eceff1] text-[#90a4ae] cursor-not-allowed'}`}><i className="fas fa-print mr-2"></i> Imprimir na Smart-51</button>
                    </div>

                    <div className="flex flex-col md:flex-row gap-8 justify-center items-center bg-[#f8f9fa] p-8 rounded-lg overflow-x-auto border border-[#eceff1]">
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
                          <div className="flex w-full gap-[2mm]">
                            <div className="relative border-[1.5px] border-black rounded-[4px] h-[7mm] flex-1 flex items-center justify-center"><span className="absolute -top-[2.5mm] left-[2mm] bg-white px-[1mm] text-[6px] font-bold text-black leading-none">CPF</span><div className="text-[8px] text-black font-semibold uppercase">{colaborador.cpf || '000.000.000-00'}</div></div>
                            <div className="relative border-[1.5px] border-black rounded-[4px] h-[7mm] w-[14mm] flex items-center justify-center bg-[#ffebee] border-[#e74c3c]"><span className="absolute -top-[2.5mm] left-[1mm] bg-white px-[0.5mm] text-[5px] font-bold text-[#c0392b] leading-none">Tp. Sangue</span><div className="text-[8px] text-[#c0392b] font-black uppercase">{colaborador.tipo_sanguineo || 'O+'}</div></div>
                          </div>
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

          {/* ABA COLABORADORES */}
          {abaAtiva === 'colaboradores' && (
            <div className="animation-fade-in max-w-6xl mx-auto hide-on-print flex flex-col h-full">
              <form onSubmit={handlePesquisaTabela} className="bg-white p-6 rounded-xl border border-[#cfd8dc] shadow-sm mb-6 flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-bold mb-2 text-[#023A58]">Pesquisa Rápida</label>
                  <div className="relative">
                    <i className="fas fa-search absolute left-4 top-4 text-slate-400"></i>
                    <input type="text" placeholder="Digite a Matrícula ou Nome..." value={buscaTabela} onChange={(e) => setBuscaTabela(e.target.value)} className="w-full bg-[#f8f9fa] border border-[#b0bec5] rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-[#035B8B]" />
                  </div>
                </div>
                <button type="submit" disabled={carregandoLista} className="bg-[#023A58] text-white font-bold px-8 py-3 rounded-lg hover:bg-[#035B8B] shadow-sm">
                  {carregandoLista ? <i className="fas fa-spinner fa-spin"></i> : 'Localizar'}
                </button>
              </form>

              <div className="bg-white rounded-xl shadow-sm border border-[#cfd8dc] flex flex-col flex-1 overflow-hidden">
                <div className="p-4 border-b border-[#eceff1] bg-[#fafafa]">
                  <h3 className="font-bold text-[#023A58]">Resultados da Pesquisa {resultadosBusca.length > 0 && `(${resultadosBusca.length})`}</h3>
                </div>
                <div className="overflow-y-auto custom-scrollbar max-h-[500px]">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-[#f8f9fa] z-10 shadow-sm border-b border-[#eceff1]">
                      <tr className="text-xs uppercase tracking-wider text-slate-500 font-bold">
                        <th className="p-4 pl-6">Matrícula</th>
                        <th className="p-4">Nome</th>
                        <th className="p-4 text-center">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {!pesquisaRealizada ? (
                        <tr><td colSpan={3} className="p-12 text-center text-slate-400 font-medium">Faça uma busca para ver os colaboradores.</td></tr>
                      ) : resultadosBusca.length === 0 ? (
                        <tr><td colSpan={3} className="p-8 text-center text-slate-400">Nenhum registo encontrado.</td></tr>
                      ) : (
                        resultadosBusca.map((colab) => (
                          <tr key={colab.matricula} className="border-b border-[#eceff1] hover:bg-[#f8f9fa]">
                            <td className="p-4 pl-6 font-bold text-[#035B8B]">{colab.matricula}</td>
                            <td className="p-4 font-semibold text-[#263238]">{colab.nome_completo}</td>
                            <td className="p-4 text-center">
                              <button onClick={() => { setBuscaEmissao(colab.matricula); buscarColaboradorParaEmissao(colab.matricula); }} className="bg-white border border-[#cfd8dc] text-[#023A58] hover:bg-[#eceff1] px-4 py-2 text-xs font-bold rounded-lg shadow-sm">Ver Ficha</button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* OUTRAS ABAS */}
          {['cadastro', 'qrcode', 'configuracoes'].includes(abaAtiva) && (
            <div className="bg-white p-10 rounded-xl border border-[#cfd8dc] shadow-sm text-center animation-fade-in flex flex-col items-center justify-center min-h-[400px] hide-on-print">
              <div className="w-20 h-20 bg-[#e3f2fd] rounded-full flex items-center justify-center text-[#023A58] text-3xl mb-4"><i className={`fas ${menuItens.find(m => m.id === abaAtiva)?.icone}`}></i></div>
              <h2 className="text-2xl font-bold text-[#263238] mb-2">{abaAtiva === 'configuracoes' ? 'Gestão de Acessos' : abaAtiva === 'qrcode' ? 'Central de Links' : 'Módulo em Construção'}</h2>
            </div>
          )}

        </div>

        {/* ========================================================= */}
        {/* MOTOR DE IMPRESSÃO INVISÍVEL (LOTE E INDIVIDUAL)        */}
        {/* ========================================================= */}
        <div className="print-container hidden">
           {colaboradoresParaImprimir.map((c, index) => (
             <React.Fragment key={index}>
                {/* FRENTE */}
                <div className="cracha-card w-[54mm] h-[86mm] bg-white relative flex flex-col items-center overflow-hidden box-border" style={{ border: '1px solid #ccc' }}>
                  <div className="mt-[4mm] w-[26mm] h-[35mm] flex items-center justify-center overflow-hidden z-10 border border-slate-300 bg-white">
                    {c.foto_url && <img src={c.foto_url} className="w-full h-full object-cover" alt="Foto" />}
                  </div>
                  <div className="mt-[2mm] text-center z-10 w-full px-2">
                    <div className="text-[#051e42] font-black text-[18px] leading-[1.0]" style={{ fontFamily: 'Arial, sans-serif' }}>
                      {formatarNomeCurto(c.nome_completo).split(' ')[0]}<br/>{formatarNomeCurto(c.nome_completo).split(' ')[1] || ''}
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 w-full h-[32mm] z-0"><img src="/Imagem1.png" className="w-full h-full object-fill" alt="Fundo" /></div>
                  <div className="absolute bottom-[13mm] left-[1mm] z-10 w-[24mm] h-[8mm] flex items-center justify-start"><img src="/dinamo.png" className="max-h-full max-w-full object-contain" alt="Dínamo" /></div>
                </div>

                {/* VERSO COM TIPO SANGUÍNEO */}
                <div className="cracha-card w-[54mm] h-[86mm] bg-white relative p-[2mm] flex flex-col box-border" style={{ border: '1px solid #ccc' }}>
                  <div className="mt-[2mm] w-full flex flex-col gap-[3mm]">
                    <div className="relative border-[1.5px] border-black rounded-[4px] h-[7mm] flex items-center justify-center w-full"><span className="absolute -top-[2.5mm] left-[2mm] bg-white px-[1mm] text-[6px] font-bold text-black leading-none">Nome</span><div className="text-[7.5px] text-black font-semibold uppercase">{c.nome_completo}</div></div>
                    
                    <div className="flex w-full gap-[2mm]">
                      <div className="relative border-[1.5px] border-black rounded-[4px] h-[7mm] flex-1 flex items-center justify-center"><span className="absolute -top-[2.5mm] left-[2mm] bg-white px-[1mm] text-[6px] font-bold text-black leading-none">CPF</span><div className="text-[8px] text-black font-semibold uppercase">{c.cpf || '000.000.000-00'}</div></div>
                      <div className="relative border-[1.5px] border-black rounded-[4px] h-[7mm] w-[14mm] flex items-center justify-center bg-[#ffebee] border-[#e74c3c]"><span className="absolute -top-[2.5mm] left-[1mm] bg-white px-[0.5mm] text-[5px] font-bold text-[#c0392b] leading-none">Tp. Sangue</span><div className="text-[8px] text-[#c0392b] font-black uppercase">{c.tipo_sanguineo || 'O+'}</div></div>
                    </div>

                    <div className="flex w-full gap-[2mm] items-stretch h-[24mm]">
                        <div className="flex flex-col flex-1 justify-between">
                          <div className="relative border-[1.5px] border-black rounded-[4px] h-[7mm] flex items-center justify-center w-full"><span className="absolute -top-[2.5mm] left-[2mm] bg-white px-[1mm] text-[6px] font-bold text-black leading-none">Função</span><div className="text-[7px] text-black font-semibold uppercase truncate px-1">{c.desc_funcao}</div></div>
                          <div className="relative border-[1.5px] border-black rounded-[4px] h-[7mm] flex items-center justify-center w-full"><span className="absolute -top-[2.5mm] left-[2mm] bg-white px-[1mm] text-[6px] font-bold text-black leading-none">Car. Identidade</span><div className="text-[8px] text-black font-semibold uppercase">{c.rg || '0000000000'}</div></div>
                          <div className="relative border-[1.5px] border-black rounded-[4px] h-[7mm] flex items-center justify-center w-full"><span className="absolute -top-[2.5mm] left-[2mm] bg-white px-[1mm] text-[6px] font-bold text-black leading-none">Matrícula</span><div className="text-[8px] text-black font-semibold uppercase">{String(c.matricula).padStart(8, '0')}</div></div>
                        </div>
                        <div className="w-[21mm] flex-shrink-0 flex items-center justify-center border border-slate-100 p-[0.5mm] bg-white rounded-sm z-10">
                          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://sgso.dinamo.srv.br/colaborador/${c.matricula}`} className="w-full h-full object-contain" alt="QR Code" />
                        </div>
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
             </React.Fragment>
           ))}
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
          /* DESTRUIÇÃO TOTAL DO MENU: Em vez de ficar "invisível" ocupando espaço, agora ele simplesmente não existe no momento da impressão! */
          .hide-on-print { display: none !important; }
          
          html, body, .screen-only, main, .print-padding-remove { 
             width: 54mm !important;
             height: auto !important; 
             min-height: 100% !important;
             overflow: visible !important; 
             margin: 0 !important; 
             padding: 0 !important; 
             background: white !important; 
             display: block !important; 
          }
          
          .print-container { 
             display: block !important; 
             visibility: visible !important; 
             position: relative !important; 
             width: 54mm !important; 
             margin: 0 !important; 
             padding: 0 !important; 
          }
          .print-container * { visibility: visible !important; }
          
          @page { size: 54mm 86mm; margin: 0 !important; }
          
          .cracha-card { 
             -webkit-print-color-adjust: exact !important; 
             print-color-adjust: exact !important; 
             width: 54mm !important; 
             height: 86mm !important; 
             box-sizing: border-box !important; 
             margin: 0 !important; 
             border: none !important; 
             box-shadow: none !important; 
             page-break-after: always !important; 
             break-after: page !important;
             overflow: hidden !important; 
             position: relative !important;
             float: none !important;
             background-color: white !important;
          }
          .cracha-card:last-of-type { 
             page-break-after: auto !important; 
             break-after: auto !important;
          }
        }
      `}</style>
    </div>
  );
}
