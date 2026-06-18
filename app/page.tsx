/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useRef, useEffect } from 'react';

export default function PortalRH() {
  // ========================== ESTADOS DE AUTENTICAÇÃO (LOGIN) ==========================
  const [usuarioAutenticado, setUsuarioAutenticado] = useState<any>(null); // NULL significa que está na tela de login
  const [loginInput, setLoginInput] = useState('');
  const [senhaInput, setSenhaInput] = useState('');
  const [carregandoLogin, setCarregandoLogin] = useState(false);
  const [erroLogin, setErroLogin] = useState('');

  const [abaAtiva, setAbaAtiva] = useState('colaboradores');
  const [menuAberto, setMenuAberto] = useState(false); 
  const [cameraTraseira, setCameraTraseira] = useState(true); 

  const URL = "https://dpndtwutvkaxrxrkyeyw.supabase.co";
  const KEY = "sb_publishable_6Ss9lNdcbyeE2o3U5jcJ7w_qI61wmIr";

  // ========================== FUNÇÃO DE LOGIN REAL ==========================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroLogin('');
    if (!loginInput || !senhaInput) { setErroLogin('Preencha login e senha.'); return; }
    
    setCarregandoLogin(true);
    try {
      const response = await fetch(`${URL}/rest/v1/usuarios_sistema?login=eq.${loginInput}&senha=eq.${senhaInput}&select=*`, {
        headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }
      });
      const data = await response.json();
      
      if (data && data.length > 0) {
        const usuario = data[0];
        setUsuarioAutenticado(usuario);
        // Define a aba inicial com base no perfil
        setAbaAtiva(usuario.perfil === 'ADM' ? 'configuracoes' : 'colaboradores');
        setLoginInput(''); setSenhaInput('');
      } else {
        setErroLogin('Credenciais inválidas. Verifique o seu login e senha.');
      }
    } catch (error) {
      setErroLogin('Erro de ligação ao servidor.');
    } finally {
      setCarregandoLogin(false);
    }
  };

  const handleLogout = () => {
    setUsuarioAutenticado(null);
    setAbaAtiva('colaboradores');
  };

  const menuItens = [
    { id: 'colaboradores', nome: 'Base de Colaboradores', icone: 'fa-users' },
    { id: 'emissao', nome: 'Emissão Individual', icone: 'fa-id-badge' },
    { id: 'lote', nome: 'Emissão em Lote', icone: 'fa-layer-group' },
    { id: 'cadastro', nome: 'Cadastro Manual', icone: 'fa-user-plus' },
    { id: 'configuracoes', nome: 'Gestão de Acessos', icone: 'fa-shield-alt' },
  ];

  // ========================== ABA: HUB CENTRAL (COLABORADORES) ==========================
  const [buscaTabela, setBuscaTabela] = useState('');
  const [resultadosBusca, setResultadosBusca] = useState<any[]>([]);
  const [carregandoLista, setCarregandoLista] = useState(false);
  const [pesquisaRealizada, setPesquisaRealizada] = useState(false);
  const [colaboradorEditando, setColaboradorEditando] = useState<any>(null);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  const handlePesquisaTabela = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!buscaTabela.trim() && !pesquisaRealizada) return; 
    setCarregandoLista(true); setPesquisaRealizada(true);
    const isNum = /^\d+$/.test(buscaTabela.trim());
    let fetchUrl = `${URL}/rest/v1/colaboradores?select=*&limit=50`;
    if (buscaTabela.trim()) {
      if (isNum) fetchUrl += `&matricula=eq.${buscaTabela.trim()}`;
      else fetchUrl += `&nome_completo=ilike.*${buscaTabela.trim()}*`;
    }
    try {
      const response = await fetch(fetchUrl, { headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` } });
      const data = await response.json();
      setResultadosBusca(data || []);
    } catch (error) { console.error("Erro na busca"); } 
    finally { setCarregandoLista(false); }
  };

  const abrirEdicao = (colab: any) => { setColaboradorEditando({ ...colab }); };

  const salvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault(); if (!colaboradorEditando) return; setSalvandoEdicao(true);
    try {
      const response = await fetch(`${URL}/rest/v1/colaboradores?matricula=eq.${colaboradorEditando.matricula}`, {
        method: 'PATCH',
        headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify({
          tipo_sanguineo: colaboradorEditando.tipo_sanguineo || null,
          link_qrcode: colaboradorEditando.link_qrcode || null
        })
      });
      if (!response.ok) throw new Error('Erro');
      setColaboradorEditando(null); handlePesquisaTabela(); 
      alert("Informações atualizadas com sucesso!");
    } catch (err) { alert("Erro ao salvar alterações."); } finally { setSalvandoEdicao(false); }
  };

  // ========================== ABA: EMISSÃO EM LOTE ==========================
  const [listaLote, setListaLote] = useState<any[]>([]);
  const [matriculaLote, setMatriculaLote] = useState('');
  const [carregandoLote, setCarregandoLote] = useState(false);
  const [erroLote, setErroLote] = useState('');

  const adicionarAoLote = async (e: React.FormEvent) => {
    e.preventDefault(); setErroLote(''); if (!matriculaLote.trim()) return;
    if (listaLote.find(c => String(c.matricula) === String(matriculaLote.trim()))) { setErroLote('Já está na fila.'); setMatriculaLote(''); return; }
    setCarregandoLote(true);
    try {
      const response = await fetch(`${URL}/rest/v1/colaboradores?matricula=eq.${matriculaLote.trim()}&select=*`, { headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` } });
      const data = await response.json();
      if (data && data.length > 0) { 
        const novoColab = data[0]; setListaLote([...listaLote, novoColab]); setMatriculaLote(''); 
        if (!novoColab.foto_url) { alert(`⚠️ ATENÇÃO: O colaborador ${novoColab.nome_completo} não possui foto no sistema!`); }
      } else { setErroLote('Matrícula não encontrada.'); }
    } catch (error) { setErroLote('Erro na base.'); } finally { setCarregandoLote(false); }
  };
  const removerDoLote = (matricula: string) => { setListaLote(listaLote.filter(c => String(c.matricula) !== String(matricula))); };

  // ========================== ABA: EMISSÃO INDIVIDUAL ==========================
  const [colaborador, setColaborador] = useState<any>(null);
  const [buscaEmissao, setBuscaEmissao] = useState('');
  const [carregandoEmissao, setCarregandoEmissao] = useState(false);
  const [erroEmissao, setErroEmissao] = useState('');
  const [cameraAtiva, setCameraAtiva] = useState(false);
  const [fotoCapturada, setFotoCapturada] = useState<string | null>(null);
  const [rawFoto, setRawFoto] = useState<string | null>(null); 
  const [zoom, setZoom] = useState(1); const [panX, setPanX] = useState(0); const [panY, setPanY] = useState(0); const [clarear, setClarear] = useState(false);
  const [salvandoFoto, setSalvandoFoto] = useState(false); const [msgFoto, setMsgFoto] = useState({ texto: '', tipo: '' });
  const videoRef = useRef<HTMLVideoElement>(null);
  const fotoAlterada = fotoCapturada && fotoCapturada !== colaborador?.foto_url;

  const buscarColaboradorParaEmissao = async (matriculaAlvo: string) => {
    setErroEmissao(''); setMsgFoto({ texto: '', tipo: '' }); setRawFoto(null); setCarregandoEmissao(true); setBuscaEmissao(matriculaAlvo);
    try {
      const response = await fetch(`${URL}/rest/v1/colaboradores?matricula=eq.${matriculaAlvo}&select=*`, { headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` } });
      const data = await response.json();
      if (data && data.length > 0) { setColaborador(data[0]); setFotoCapturada(data[0].foto_url || null); setAbaAtiva('emissao'); } else { setColaborador(null); setErroEmissao('Matrícula não encontrada.'); }
    } catch (error) { setErroEmissao('Erro de ligação.'); } finally { setCarregandoEmissao(false); }
  };

  const ligarCameraMobile = async (usarTraseira: boolean) => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setCameraAtiva(true); setRawFoto(null); setMsgFoto({ texto: '', tipo: '' });
    try { 
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 600, height: 600, facingMode: usarTraseira ? 'environment' : 'user' } }); 
      if (videoRef.current) videoRef.current.srcObject = stream; 
    } catch (err) { alert("Permissão negada ou câmara indisponível."); setCameraAtiva(false); }
  };

  const alternarCamera = () => { const novaDirecao = !cameraTraseira; setCameraTraseira(novaDirecao); if (cameraAtiva) ligarCameraMobile(novaDirecao); };

  const tirarFoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas'); canvas.width = 600; canvas.height = 600; const ctx = canvas.getContext('2d');
      if (ctx) { ctx.drawImage(videoRef.current, 0, 0, 600, 600); setRawFoto(canvas.toDataURL('image/jpeg', 1.0)); const stream = videoRef.current.srcObject as MediaStream; stream.getTracks().forEach(track => track.stop()); setCameraAtiva(false); }
    }
  };

  const handleUploadFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) { setMsgFoto({ texto: '', tipo: '' }); const reader = new FileReader(); reader.onload = (event) => { if (event.target?.result) setRawFoto(event.target.result as string); }; reader.readAsDataURL(e.target.files[0]); }
  };

  const aplicarRecorte = () => {
    const canvas = document.createElement('canvas'); canvas.width = 260; canvas.height = 350; const ctx = canvas.getContext('2d'); if (!ctx) return;
    const img = new Image(); img.src = rawFoto as string;
    img.onload = () => {
      if (clarear) ctx.filter = 'brightness(1.25) contrast(1.15)'; ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2; const cy = canvas.height / 2; const scaleFit = Math.max(canvas.width / img.width, canvas.height / img.height); const w = img.width * scaleFit; const h = img.height * scaleFit;
      ctx.translate(cx + panX, cy + panY); ctx.scale(zoom, zoom); ctx.drawImage(img, -w / 2, -h / 2, w, h);
      setFotoCapturada(canvas.toDataURL('image/jpeg', 0.95)); setRawFoto(null); setZoom(1); setPanX(0); setPanY(0); setClarear(false);
    };
  };

  const usarFotoOriginal = () => { setFotoCapturada(rawFoto); setRawFoto(null); };

  const salvarFotoNoSupabase = async () => {
    if (!fotoCapturada || !colaborador) return; setSalvandoFoto(true); setMsgFoto({ texto: 'A guardar...', tipo: 'loading' });
    try {
      const response = await fetch(`${URL}/rest/v1/colaboradores?matricula=eq.${colaborador.matricula}`, { method: 'PATCH', headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' }, body: JSON.stringify({ foto_url: fotoCapturada }) });
      if (!response.ok) throw new Error('Erro ao salvar'); 
      setColaborador({ ...colaborador, foto_url: fotoCapturada }); setMsgFoto({ texto: 'Guardado com sucesso!', tipo: 'sucesso' });
    } catch (err) { setMsgFoto({ texto: 'Erro ao guardar.', tipo: 'erro' }); } finally { setSalvandoFoto(false); }
  };

  // ========================== ABA: CADASTRO MANUAL ==========================
  const [formCadastro, setFormCadastro] = useState({ matricula: '', nome_completo: '', cpf: '', rg: '', desc_funcao: '' });
  const [salvandoCadastro, setSalvandoCadastro] = useState(false);
  const [msgCadastro, setMsgCadastro] = useState({ texto: '', tipo: '' });

  const handleCadastroManual = async (e: React.FormEvent) => {
    e.preventDefault(); setMsgCadastro({ texto: '', tipo: '' });
    if (!formCadastro.matricula || !formCadastro.nome_completo) { setMsgCadastro({ texto: 'Matrícula e Nome são obrigatórios.', tipo: 'erro' }); return; }
    setSalvandoCadastro(true);
    try {
      const response = await fetch(`${URL}/rest/v1/colaboradores`, { method: 'POST', headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' }, body: JSON.stringify(formCadastro) });
      if (!response.ok) { if(response.status === 409) { throw new Error('Matrícula já cadastrada.'); } throw new Error('Erro ao cadastrar na base.'); }
      setMsgCadastro({ texto: 'Colaborador cadastrado!', tipo: 'sucesso' }); setFormCadastro({ matricula: '', nome_completo: '', cpf: '', rg: '', desc_funcao: '' });
    } catch (err: any) { setMsgCadastro({ texto: err.message || 'Erro.', tipo: 'erro' }); } finally { setSalvandoCadastro(false); }
  };

  // ========================== ABA: CONFIGURAÇÕES (GERENCIAMENTO) ==========================
  const [listaUsuarios, setListaUsuarios] = useState<any[]>([]);
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(false);
  const [formUsuario, setFormUsuario] = useState({ nome: '', login: '', senha: '', perfil: 'RH' });
  const [salvandoUsuario, setSalvandoUsuario] = useState(false);
  const [msgUsuario, setMsgUsuario] = useState({ texto: '', tipo: '' });

  const carregarUsuarios = async () => {
    setCarregandoUsuarios(true);
    try {
      const response = await fetch(`${URL}/rest/v1/usuarios_sistema?select=*&order=created_at.desc`, { headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` } });
      const data = await response.json(); setListaUsuarios(data || []);
    } catch (error) { console.error("Erro ao carregar"); } finally { setCarregandoUsuarios(false); }
  };

  useEffect(() => { 
    if (usuarioAutenticado?.perfil === 'ADM' && abaAtiva === 'configuracoes') carregarUsuarios(); 
  }, [abaAtiva, usuarioAutenticado]);

  const handleCriarUsuario = async (e: React.FormEvent) => {
    e.preventDefault(); setMsgUsuario({ texto: '', tipo: '' });
    if (!formUsuario.nome || !formUsuario.login || !formUsuario.senha) { setMsgUsuario({ texto: 'Preencha todos os campos.', tipo: 'erro' }); return; }
    setSalvandoUsuario(true);
    try {
      const response = await fetch(`${URL}/rest/v1/usuarios_sistema`, {
        method: 'POST',
        headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify(formUsuario)
      });
      if (!response.ok) {
         const errData = await response.json().catch(() => ({}));
         if(response.status === 409) throw new Error('Login já em uso.');
         throw new Error(errData.message || errData.details || `Erro ${response.status}: Verifique a estrutura da tabela.`);
      }
      setMsgUsuario({ texto: 'Utilizador criado!', tipo: 'sucesso' }); setFormUsuario({ nome: '', login: '', senha: '', perfil: 'RH' }); carregarUsuarios();
    } catch (err: any) { setMsgUsuario({ texto: err.message, tipo: 'erro' }); } finally { setSalvandoUsuario(false); }
  };

  const excluirUsuario = async (id: string, login: string) => {
    if(login === 'admin') { alert("O Administrador principal não pode ser excluído."); return; }
    if(!window.confirm("Deseja excluir este acesso?")) return;
    try { await fetch(`${URL}/rest/v1/usuarios_sistema?id=eq.${id}`, { method: 'DELETE', headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` } }); carregarUsuarios(); } catch (err) { alert("Erro ao excluir."); }
  };

  const formatarNomeCurto = (nomeCompleto: string) => { if (!nomeCompleto) return ""; const partes = nomeCompleto.trim().split(" "); return partes.length === 1 ? partes[0] : `${partes[0]} ${partes[partes.length - 1]}`; };
  const obterDataHoraAtual = () => { const data = new Date(); return `${data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })} ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`; };
  const colaboradoresParaImprimir = abaAtiva === 'lote' ? listaLote : (colaborador && abaAtiva === 'emissao' ? [{ ...colaborador, foto_url: fotoCapturada || colaborador.foto_url }] : []);
  const navegarPara = (id: string) => { setAbaAtiva(id); setMenuAberto(false); };

  // ========================== TELA DE LOGIN (FASE 4) ==========================
  if (!usuarioAutenticado) {
    return (
      <div className="flex h-screen bg-[#f4f7f6] font-poppins items-center justify-center relative overflow-hidden">
        {/* Fundo Decorativo */}
        <div className="absolute top-0 left-0 w-full h-1/2 bg-[#023A58]"></div>
        
        <div className="z-10 w-full max-w-md p-8 animation-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-10 flex flex-col items-center border-b border-slate-100 bg-slate-50">
              <img src="/logodinamobranca.png" alt="Dínamo" className="max-h-14 mb-4 object-contain brightness-0 filter" style={{ filter: 'brightness(0) saturate(100%) invert(18%) sepia(50%) saturate(2250%) hue-rotate(180deg) brightness(95%) contrast(98%)' }} />
              <h2 className="text-2xl font-black text-[#023A58] tracking-tight">Portal Operacional</h2>
              <p className="text-sm text-slate-500 font-medium mt-1">Sessão restrita a colaboradores autorizados</p>
            </div>
            
            <form onSubmit={handleLogin} className="p-8 flex flex-col gap-6 bg-white">
              {erroLogin && (
                <div className="bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-xl text-sm font-bold flex items-start gap-3">
                  <i className="fas fa-exclamation-triangle mt-0.5"></i> <span>{erroLogin}</span>
                </div>
              )}
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Utilizador</label>
                <div className="relative">
                  <i className="fas fa-user absolute left-4 top-[14px] text-slate-400"></i>
                  <input type="text" value={loginInput} onChange={(e) => setLoginInput(e.target.value.toLowerCase().replace(/\s/g, ''))} placeholder="Seu login..." className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a84ff] focus:border-transparent font-bold text-slate-800 transition-all lowercase" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Senha Segura</label>
                <div className="relative">
                  <i className="fas fa-lock absolute left-4 top-[14px] text-slate-400"></i>
                  <input type="password" value={senhaInput} onChange={(e) => setSenhaInput(e.target.value)} placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a84ff] focus:border-transparent font-bold text-slate-800 transition-all" />
                </div>
              </div>

              <button type="submit" disabled={carregandoLogin} className="w-full bg-[#0a84ff] text-white font-bold py-4 rounded-xl hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/30 flex justify-center items-center gap-2 mt-2">
                {carregandoLogin ? <i className="fas fa-spinner fa-spin text-lg"></i> : 'Acessar Sistema'}
              </button>
            </form>
          </div>
          <div className="text-center mt-6 text-white/80 text-xs font-medium">
            &copy; 2026 Dínamo Engenharia. Todos os direitos reservados.
          </div>
        </div>
      </div>
    );
  }

  // ========================== DASHBOARD PRINCIPAL (PÓS-LOGIN) ==========================
  return (
    <div className="flex h-screen bg-[#f4f7f6] font-poppins text-slate-800 overflow-hidden screen-only relative">
      
      {/* OVERLAY MOBILE PARA O MENU */}
      {menuAberto && <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden transition-opacity" onClick={() => setMenuAberto(false)}></div>}

      {/* MENU LATERAL PREMIUM */}
      <aside className={`${menuAberto ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:relative z-50 w-72 h-full flex flex-col shadow-2xl transition-transform duration-300 ease-out hide-on-print border-r border-[#035B8B]/20`} style={{ backgroundColor: '#023A58' }}>
        <div className="h-24 flex items-center justify-between md:justify-center border-b border-white/10 px-6">
          <img src="/logodinamobranca.png" alt="Dínamo" className="max-h-12 object-contain drop-shadow-lg" />
          <button className="md:hidden text-white/70 hover:text-white text-2xl" onClick={() => setMenuAberto(false)}><i className="fas fa-times"></i></button>
        </div>
        <nav className="flex-1 overflow-y-auto py-8 px-4 space-y-2 custom-scrollbar">
          <div className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-4 px-4">Menu Principal</div>
          {menuItens.map((item) => (
            <button key={item.id} onClick={() => navegarPara(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 font-semibold text-sm outline-none
                ${abaAtiva === item.id ? 'bg-[#0a84ff] text-white shadow-lg shadow-[#0a84ff]/30 transform translate-x-1' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${abaAtiva === item.id ? 'bg-white/20' : 'bg-white/5'}`}>
                 <i className={`fas ${item.icone} text-center`}></i>
              </div>
              {item.nome}
            </button>
          ))}
        </nav>
        {/* BOTÃO DE LOGOUT NO RODAPÉ DO MENU */}
        <div className="p-4 border-t border-white/10">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/5 text-white/70 hover:bg-rose-500 hover:text-white rounded-xl transition-all font-bold text-sm">
             <i className="fas fa-sign-out-alt"></i> Encerrar Sessão
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 flex flex-col relative overflow-hidden print-main-adjust bg-[#f8fafc]">
        
        {/* HEADER MODERNO */}
        <header className="h-24 bg-white shadow-sm border-b border-slate-200 flex items-center justify-between px-6 md:px-10 z-10 hide-on-print relative">
          <div className="flex items-center gap-4">
            <button className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg bg-slate-100 text-[#023A58] hover:bg-slate-200 transition-colors" onClick={() => setMenuAberto(true)}>
              <i className="fas fa-bars text-lg"></i>
            </button>
            <h2 className="text-xl md:text-2xl font-black text-[#023A58] hidden sm:flex items-center gap-3 tracking-tight">
              <i className={`fas ${menuItens.find(m => m.id === abaAtiva)?.icone} text-[#0a84ff]`}></i> {menuItens.find(m => m.id === abaAtiva)?.nome}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-slate-50 px-2 pr-4 py-2 rounded-full border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#023A58] to-[#0a84ff] flex items-center justify-center text-white font-black text-sm shadow-md uppercase">
                {usuarioAutenticado.nome.substring(0, 2)}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black text-slate-800 leading-tight">{usuarioAutenticado.nome}</span>
                <span className={`text-[9px] font-black uppercase tracking-widest ${usuarioAutenticado.perfil === 'ADM' ? 'text-[#0a84ff]' : usuarioAutenticado.perfil === 'SESMT' ? 'text-orange-500' : 'text-emerald-500'}`}>
                   Perfil: {usuarioAutenticado.perfil}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 custom-scrollbar print-padding-remove">

          {/* ========================================================================= */}
          {/* ABA 1: BASE DE COLABORADORES                                              */}
          {/* ========================================================================= */}
          {abaAtiva === 'colaboradores' && (
            <div className="animation-fade-in max-w-7xl mx-auto hide-on-print flex flex-col h-full gap-6">
              
              <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
                <form onSubmit={handlePesquisaTabela} className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 w-full">
                    <label className="block text-sm font-bold text-[#023A58] mb-2">Pesquisa Inteligente</label>
                    <div className="relative">
                      <i className="fas fa-search absolute left-4 top-[14px] text-slate-400 text-lg"></i>
                      <input type="text" placeholder="Digite a Matrícula ou Nome do colaborador..." value={buscaTabela} onChange={(e) => setBuscaTabela(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a84ff] focus:border-transparent transition-all font-medium text-slate-700" />
                    </div>
                  </div>
                  <button type="submit" disabled={carregandoLista} className="w-full md:w-auto bg-[#023A58] text-white font-bold px-8 py-3.5 rounded-xl hover:bg-[#035B8B] shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2">
                    {carregandoLista ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-search"></i>} Localizar
                  </button>
                </form>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col flex-1 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="font-bold text-[#023A58] text-lg">Resultados {resultadosBusca.length > 0 && <span className="text-[#0a84ff] bg-blue-50 px-2 py-0.5 rounded-md text-sm ml-2">{resultadosBusca.length}</span>}</h3>
                </div>
                <div className="overflow-x-auto overflow-y-auto custom-scrollbar max-h-[600px]">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm border-b border-slate-200">
                      <tr className="text-[11px] uppercase tracking-wider text-slate-500 font-black">
                        <th className="p-4 pl-6">Colaborador</th>
                        <th className="p-4">Matrícula</th>
                        <th className="p-4 text-center">Foto</th>
                        <th className="p-4 text-center">QR Code</th>
                        <th className="p-4 text-right pr-6">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {!pesquisaRealizada ? (
                        <tr><td colSpan={5} className="p-16 text-center text-slate-400 font-medium">Faça uma busca para carregar a base.</td></tr>
                      ) : resultadosBusca.length === 0 ? (
                        <tr><td colSpan={5} className="p-16 text-center text-slate-400 font-medium">Nenhum registo encontrado.</td></tr>
                      ) : (
                        resultadosBusca.map((colab) => (
                          <tr key={colab.matricula} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                            <td className="p-4 pl-6 font-bold text-slate-800">{colab.nome_completo}</td>
                            <td className="p-4 font-bold text-[#0a84ff]">{colab.matricula}</td>
                            <td className="p-4 text-center">
                              {colab.foto_url ? <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-3 py-1 rounded-lg text-[10px] font-black uppercase"><i className="fas fa-check mr-1"></i> Possui</span> : <span className="bg-rose-50 text-rose-600 border border-rose-200 px-3 py-1 rounded-lg text-[10px] font-black uppercase"><i className="fas fa-times mr-1"></i> Faltando</span>}
                            </td>
                            <td className="p-4 text-center">
                              {colab.link_qrcode ? <span className="bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1 rounded-lg text-[10px] font-black uppercase"><i className="fas fa-link mr-1"></i> Vinculado</span> : <span className="bg-slate-100 text-slate-500 border border-slate-200 px-3 py-1 rounded-lg text-[10px] font-black uppercase"><i className="fas fa-unlink mr-1"></i> Vazio</span>}
                            </td>
                            <td className="p-4 text-right pr-6 flex justify-end gap-2">
                              <button onClick={() => { setBuscaEmissao(colab.matricula); buscarColaboradorParaEmissao(colab.matricula); }} className="bg-white border border-slate-200 text-[#023A58] hover:bg-slate-100 px-4 py-2 text-xs font-bold rounded-lg shadow-sm transition-colors">Emitir Crachá</button>
                              
                              {/* PROTEÇÃO REAL: Apenas ADM ou SESMT vêm o botão de edição */}
                              {(usuarioAutenticado.perfil === 'ADM' || usuarioAutenticado.perfil === 'SESMT') && (
                                <button onClick={() => abrirEdicao(colab)} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 text-xs font-bold rounded-lg shadow-sm transition-colors"><i className="fas fa-edit mr-1"></i> Editar Dados</button>
                              )}
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

          {/* ========================================================================= */}
          {/* ABA 2: EMISSÃO EM LOTE                                                    */}
          {/* ========================================================================= */}
          {abaAtiva === 'lote' && (
            <div className="animation-fade-in max-w-6xl mx-auto hide-on-print flex flex-col h-full gap-6">
              <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
                <form onSubmit={adicionarAoLote} className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 w-full">
                    <label className="block text-sm font-bold text-[#023A58] mb-2">Adicionar à Fila de Impressão</label>
                    <input type="text" placeholder="Digite a Matrícula (Ex: 6294)" value={matriculaLote} onChange={(e) => setMatriculaLote(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a84ff] focus:border-transparent font-medium" />
                  </div>
                  <button type="submit" disabled={carregandoLote} className="w-full md:w-auto bg-[#023A58] text-white font-bold px-8 py-3.5 rounded-xl hover:bg-[#035B8B] transition-all shadow-md flex items-center justify-center gap-2">
                    {carregandoLote ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-plus"></i>} Adicionar
                  </button>
                </form>
                {erroLote && <p className="text-rose-600 text-xs font-bold mt-3"><i className="fas fa-exclamation-triangle mr-1"></i>{erroLote}</p>}
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col flex-1 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="font-bold text-[#023A58] text-lg">Fila de Impressão <span className="text-[#0a84ff] bg-blue-50 px-2 py-0.5 rounded-md text-sm ml-1">{listaLote.length}</span></h3>
                  <button onClick={() => window.print()} disabled={listaLote.length === 0} className={`font-bold px-6 py-2.5 text-sm rounded-xl transition-all shadow-sm flex items-center gap-2 ${listaLote.length > 0 ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
                    <i className="fas fa-print"></i> Imprimir Tudo
                  </button>
                </div>
                <div className="overflow-x-auto overflow-y-auto custom-scrollbar max-h-[500px]">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm border-b border-slate-200">
                      <tr className="text-[11px] uppercase tracking-wider text-slate-500 font-black">
                        <th className="p-4 pl-6">Matrícula</th>
                        <th className="p-4">Colaborador</th>
                        <th className="p-4 text-center">Foto</th>
                        <th className="p-4 text-center">QR Code</th>
                        <th className="p-4 text-center">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {listaLote.length === 0 ? (
                        <tr><td colSpan={5} className="p-16 text-center text-slate-400 font-medium">A fila está vazia. Adicione matrículas acima.</td></tr>
                      ) : (
                        listaLote.map((colab) => (
                          <tr key={colab.matricula} className={`border-b border-slate-100 transition-colors ${!colab.foto_url ? 'bg-rose-50/50' : 'hover:bg-slate-50'}`}>
                            <td className="p-4 pl-6 font-bold text-[#0a84ff]">{colab.matricula}</td>
                            <td className="p-4 font-bold text-slate-800">
                               {colab.nome_completo}
                               {!colab.foto_url && <span className="ml-3 text-[9px] bg-rose-500 text-white px-2 py-1 rounded-md uppercase font-black tracking-widest shadow-sm">Alerta: Sem Foto</span>}
                            </td>
                            <td className="p-4 text-center">
                              {colab.foto_url ? <i className="fas fa-check-circle text-emerald-500 text-lg"></i> : <i className="fas fa-times-circle text-rose-500 text-lg"></i>}
                            </td>
                            <td className="p-4 text-center">
                              {colab.link_qrcode ? <i className="fas fa-link text-blue-500 text-lg"></i> : <span className="text-slate-400 text-xs font-bold">VAZIO</span>}
                            </td>
                            <td className="p-4 text-center">
                              <button onClick={() => removerDoLote(colab.matricula)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-colors shadow-sm"><i className="fas fa-trash-alt"></i></button>
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

          {/* ========================================================================= */}
          {/* ABA 3: EMISSÃO INDIVIDUAL (CÂMARA E FOTO)                                 */}
          {/* ========================================================================= */}
          {abaAtiva === 'emissao' && (
            <div className="animation-fade-in max-w-6xl mx-auto hide-on-print">
              <form onSubmit={(e) => { e.preventDefault(); buscarColaboradorParaEmissao(buscaEmissao); }} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                  <label className="block text-sm font-bold text-[#023A58] mb-2">Matrícula do Colaborador</label>
                  <input type="text" placeholder="Ex: 6294" value={buscaEmissao} onChange={(e) => setBuscaEmissao(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#0a84ff] focus:border-transparent font-medium" />
                </div>
                <button type="submit" disabled={carregandoEmissao} className="w-full md:w-auto bg-[#023A58] text-white font-bold px-8 py-3.5 rounded-xl hover:bg-[#035B8B] shadow-md transition-all">Buscar Ficha</button>
              </form>

              {erroEmissao && <p className="text-rose-600 mb-6 bg-rose-50 p-4 rounded-xl font-bold border border-rose-100 flex items-center gap-2"><i className="fas fa-exclamation-circle text-xl"></i> {erroEmissao}</p>}

              {colaborador && (
                <div className="flex flex-col xl:flex-row gap-8">
                  <div className="xl:w-1/3 bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center">
                    <h3 className="text-lg font-black text-[#023A58] mb-6 w-full text-center">Adicionar Fotografia</h3>
                    {rawFoto ? (
                      <div className="flex flex-col items-center w-full animation-fade-in">
                        <div className="relative w-48 h-64 bg-slate-900 overflow-hidden mb-6 rounded-xl shadow-inner border-4 border-emerald-400" style={{ filter: clarear ? 'brightness(1.25) contrast(1.15)' : 'none' }}>
                          <img src={rawFoto} alt="Raw" style={{ transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`, transformOrigin: 'center', width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div className="absolute inset-0 border-2 border-dashed border-white/50 pointer-events-none"></div>
                        </div>
                        <div className="w-full space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
                          <div><label className="text-xs font-bold text-slate-500 mb-1 flex justify-between"><span>🔍 Zoom</span></label><input type="range" min="1" max="3" step="0.05" value={zoom} onChange={e => setZoom(Number(e.target.value))} className="w-full accent-[#0a84ff]" /></div>
                          <div><label className="text-xs font-bold text-slate-500 mb-1 block">↔️ Esquerda / Direita</label><input type="range" min="-150" max="150" value={panX} onChange={e => setPanX(Number(e.target.value))} className="w-full accent-[#0a84ff]" /></div>
                          <div><label className="text-xs font-bold text-slate-500 mb-1 block">↕️ Cima / Baixo</label><input type="range" min="-150" max="150" value={panY} onChange={e => setPanY(Number(e.target.value))} className="w-full accent-[#0a84ff]" /></div>
                        </div>
                        <label className="flex items-center justify-center gap-2 mt-4 w-full bg-white border border-slate-200 p-3 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                          <input type="checkbox" checked={clarear} onChange={e => setClarear(e.target.checked)} className="w-5 h-5 accent-[#023A58]" />
                          <span className="text-sm font-bold text-[#023A58]">Clarear Fundo</span>
                        </label>
                        <div className="flex gap-3 w-full mt-4">
                          <button onClick={usarFotoOriginal} className="flex-1 bg-slate-200 text-slate-700 font-bold py-3 text-xs rounded-xl shadow-sm hover:bg-slate-300">Pular Corte</button>
                          <button onClick={aplicarRecorte} className="flex-1 bg-emerald-500 text-white font-bold py-3 text-xs rounded-xl shadow-md hover:bg-emerald-600"><i className="fas fa-crop-alt mr-1"></i> Cortar</button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full flex flex-col items-center">
                        <div className="w-48 h-64 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl overflow-hidden relative flex items-center justify-center mb-6 shadow-sm">
                          {cameraAtiva ? <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" /> : fotoCapturada ? <img src={fotoCapturada} alt="Crachá" className="w-full h-full object-cover" /> : <div className="text-slate-300 text-center flex flex-col items-center"><i className="fas fa-user-circle text-6xl mb-2"></i></div>}
                        </div>
                        
                        <div className="w-full flex flex-col gap-3">
                          {cameraAtiva ? (
                            <div className="flex gap-2">
                               <button onClick={alternarCamera} className="w-14 bg-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-300 flex items-center justify-center" title="Virar Câmara"><i className="fas fa-sync-alt"></i></button>
                               <button onClick={tirarFoto} className="flex-1 bg-rose-500 text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-rose-600 text-sm"><i className="fas fa-camera mr-2"></i> Disparar</button>
                            </div>
                          ) : (
                            <button onClick={() => ligarCameraMobile(cameraTraseira)} className="w-full bg-[#023A58] text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-[#035B8B] transition-colors text-sm"><i className="fas fa-camera mr-2"></i> Ativar Câmara</button>
                          )}
                          <label className="block w-full bg-white border border-slate-300 hover:bg-slate-50 text-[#023A58] text-center font-bold py-3.5 rounded-xl cursor-pointer transition-colors shadow-sm text-sm">
                            <i className="fas fa-folder-open mr-2"></i> Anexar Ficheiro <input type="file" accept="image/*" onChange={handleUploadFoto} className="hidden" />
                          </label>
                        </div>

                        <div className="w-full mt-6 border-t border-slate-100 pt-6">
                          <button 
                            onClick={salvarFotoNoSupabase} 
                            disabled={!fotoAlterada || salvandoFoto} 
                            className={`w-full font-bold py-4 rounded-xl shadow-md transition-all flex justify-center items-center gap-2 text-sm ${fotoAlterada && !salvandoFoto ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'}`}
                          >
                            {salvandoFoto ? <i className="fas fa-spinner fa-spin text-lg"></i> : <i className="fas fa-cloud-upload-alt text-lg"></i>} 
                            Guardar Nova Fotografia
                          </button>
                          {msgFoto.texto && <div className={`text-xs text-center mt-3 font-bold p-2 rounded-lg ${msgFoto.tipo === 'sucesso' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{msgFoto.texto}</div>}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* VISUALIZADOR DE CRACHÁ */}
                  <div className="xl:col-span-2 bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-black text-[#023A58]">Crachá Gerado</h3>
                      <button onClick={() => window.print()} disabled={!fotoCapturada || !!rawFoto} className={`font-bold px-6 py-2.5 rounded-xl transition-all shadow-sm text-sm flex items-center gap-2 ${fotoCapturada && !rawFoto ? 'bg-[#0a84ff] hover:bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'}`}><i className="fas fa-print"></i> Imprimir</button>
                    </div>

                    <div className="flex-1 flex flex-col md:flex-row gap-8 justify-center items-center bg-slate-50 p-8 rounded-2xl border border-slate-200 overflow-x-auto">
                      <div className="cracha-card w-[54mm] h-[86mm] bg-white relative flex flex-col items-center overflow-hidden box-border" style={{ border: '1px solid #ccc' }}>
                        <div className="mt-[4mm] w-[26mm] h-[35mm] flex items-center justify-center overflow-hidden z-10 border border-slate-300 bg-white">
                          {fotoCapturada ? <img src={fotoCapturada} className="w-full h-full object-cover" alt="Foto" /> : <div className="w-full h-full bg-white"></div>}
                        </div>
                        <div className="mt-[2mm] text-center z-10 w-full px-2">
                          <div className="text-[#051e42] font-black text-[18px] leading-[1.0]" style={{ fontFamily: 'Arial, sans-serif' }}>
                            {formatarNomeCurto(colaborador.nome_completo).split(' ')[0]}<br/>{formatarNomeCurto(colaborador.nome_completo).split(' ')[1] || ''}
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 w-full h-[32mm] z-0"><img src="/Imagem1.png" className="w-full h-full object-fill" alt="Fundo" /></div>
                        <div className="absolute bottom-[13mm] left-[1mm] z-10 w-[24mm] h-[8mm] flex items-center justify-start"><img src="/dinamo.png" className="max-h-full max-w-full object-contain" alt="Dínamo" /></div>
                      </div>

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
                             <div className="w-[21mm] flex-shrink-0 flex items-center justify-center border border-slate-100 p-[0.5mm] bg-white rounded-sm z-10">
                               {colaborador.link_qrcode ? <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(colaborador.link_qrcode)}`} className="w-full h-full object-contain" alt="QR Code" /> : <div className="w-full h-full bg-white"></div>}
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
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* ABA 4: CADASTRO MANUAL                                                    */}
          {/* ========================================================================= */}
          {abaAtiva === 'cadastro' && (
            <div className="animation-fade-in max-w-4xl mx-auto hide-on-print flex flex-col gap-8">
              <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center opacity-70 transition-opacity hover:opacity-100">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 text-[#0a84ff] text-2xl"><i className="fas fa-file-excel"></i></div>
                <h3 className="font-bold text-slate-700 text-lg">Importação em Lote (Excel)</h3>
                <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">Funcionalidade reservada para a etapa final do projeto.</p>
                <button disabled className="mt-5 bg-slate-200 text-slate-400 font-bold px-6 py-2 rounded-lg cursor-not-allowed">Em breve</button>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-white border-b border-slate-100 p-6 md:p-8">
                  <h3 className="font-black text-[#023A58] text-xl flex items-center gap-3"><i className="fas fa-user-plus text-[#0a84ff]"></i>Cadastro de Colaborador</h3>
                  <p className="text-slate-500 text-sm mt-1">Preencha os dados abaixo para inserir manualmente na base de dados.</p>
                </div>
                <form onSubmit={handleCadastroManual} className="p-6 md:p-8 flex flex-col gap-6 bg-slate-50/30">
                  {msgCadastro.texto && <div className={`p-4 rounded-xl font-bold text-sm shadow-sm ${msgCadastro.tipo === 'sucesso' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>{msgCadastro.texto}</div>}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className="block text-sm font-bold text-slate-700 mb-2">Matrícula *</label><input type="text" placeholder="Ex: 6294" required value={formCadastro.matricula} onChange={e => setFormCadastro({...formCadastro, matricula: e.target.value})} className="w-full bg-white border border-slate-300 rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-[#0a84ff] focus:border-transparent transition-all" /></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-2">Nome Completo *</label><input type="text" placeholder="Ex: JOÃO DA SILVA" required value={formCadastro.nome_completo} onChange={e => setFormCadastro({...formCadastro, nome_completo: e.target.value.toUpperCase()})} className="w-full bg-white border border-slate-300 rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-[#0a84ff] focus:border-transparent uppercase transition-all" /></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div><label className="block text-sm font-bold text-slate-700 mb-2">CPF</label><input type="text" placeholder="000.000.000-00" value={formCadastro.cpf} onChange={e => setFormCadastro({...formCadastro, cpf: e.target.value})} className="w-full bg-white border border-slate-300 rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-[#0a84ff] focus:border-transparent transition-all" /></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-2">RG</label><input type="text" placeholder="0000000" value={formCadastro.rg} onChange={e => setFormCadastro({...formCadastro, rg: e.target.value})} className="w-full bg-white border border-slate-300 rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-[#0a84ff] focus:border-transparent transition-all" /></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-2">Função / Cargo</label><input type="text" placeholder="Ex: ELETRICISTA" value={formCadastro.desc_funcao} onChange={e => setFormCadastro({...formCadastro, desc_funcao: e.target.value.toUpperCase()})} className="w-full bg-white border border-slate-300 rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-[#0a84ff] focus:border-transparent uppercase transition-all" /></div>
                  </div>
                  <div className="border-t border-slate-200 pt-6 flex justify-end mt-2">
                    <button type="submit" disabled={salvandoCadastro} className="bg-emerald-500 text-white font-bold px-8 py-3.5 rounded-xl hover:bg-emerald-600 transition-all shadow-md flex items-center justify-center gap-2 w-full md:w-auto">{salvandoCadastro ? <i className="fas fa-spinner fa-spin text-lg"></i> : <i className="fas fa-check text-lg"></i>} Cadastrar Colaborador</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ABA 5: CONFIGURAÇÕES (GERENCIAMENTO DE ACESSOS REAL)                      */}
          {/* ========================================================================= */}
          {abaAtiva === 'configuracoes' && (
            <div className="animation-fade-in max-w-7xl mx-auto hide-on-print">
              {/* PROTEÇÃO REAL DO PERFIL */}
              {usuarioAutenticado?.perfil !== 'ADM' ? (
                 <div className="bg-white p-16 rounded-2xl border border-slate-200 shadow-sm text-center flex flex-col items-center justify-center h-[60vh]">
                    <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mb-6">
                      <i className="fas fa-lock text-rose-500 text-4xl"></i>
                    </div>
                    <h2 className="text-3xl font-black text-slate-800 mb-3">Acesso Restrito</h2>
                    <p className="text-slate-500 max-w-md text-lg">O seu perfil (<span className="font-bold text-[#023A58]">{usuarioAutenticado?.perfil}</span>) não tem permissão para gerir os acessos da equipa.</p>
                 </div>
              ) : (
                <div className="flex flex-col xl:flex-row gap-8">
                  <div className="xl:w-1/3 flex flex-col gap-6">
                     <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                       <div className="bg-white border-b border-slate-100 p-6">
                         <h3 className="font-black text-[#023A58] text-lg flex items-center gap-2"><i className="fas fa-user-shield text-[#0a84ff]"></i>Novo Acesso</h3>
                         <p className="text-slate-500 text-xs mt-1">Crie um login e senha para a sua equipa.</p>
                       </div>
                       <form onSubmit={handleCriarUsuario} className="p-6 flex flex-col gap-5 bg-slate-50/30">
                          {msgUsuario.texto && <div className={`p-4 rounded-xl font-bold text-xs shadow-sm ${msgUsuario.tipo === 'sucesso' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}><i className={`fas ${msgUsuario.tipo === 'sucesso' ? 'fa-check-circle' : 'fa-exclamation-triangle'} mr-1`}></i> {msgUsuario.texto}</div>}
                          <div><label className="block text-xs font-bold text-slate-700 mb-2">Nome do Utilizador *</label><input type="text" required value={formUsuario.nome} onChange={e => setFormUsuario({...formUsuario, nome: e.target.value})} placeholder="Ex: César SESMT" className="w-full bg-white border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#0a84ff] focus:border-transparent transition-all" /></div>
                          <div><label className="block text-xs font-bold text-slate-700 mb-2">Login de Acesso *</label><input type="text" required value={formUsuario.login} onChange={e => setFormUsuario({...formUsuario, login: e.target.value.toLowerCase().replace(/\s/g, '')})} placeholder="cesar.sesmt" className="w-full bg-white border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#0a84ff] focus:border-transparent lowercase transition-all" /></div>
                          <div><label className="block text-xs font-bold text-slate-700 mb-2">Senha Inicial *</label><input type="password" required value={formUsuario.senha} onChange={e => setFormUsuario({...formUsuario, senha: e.target.value})} placeholder="••••••••" className="w-full bg-white border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#0a84ff] focus:border-transparent transition-all" /></div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-2">Nível de Permissão *</label>
                            <select value={formUsuario.perfil} onChange={e => setFormUsuario({...formUsuario, perfil: e.target.value})} className="w-full bg-white border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#0a84ff] focus:border-transparent font-bold text-[#023A58] cursor-pointer transition-all">
                               <option value="RH">Perfil RH</option>
                               <option value="SESMT">Perfil SESMT</option>
                               <option value="ADM">Administrador Geral</option>
                            </select>
                          </div>
                          <button type="submit" disabled={salvandoUsuario} className="mt-2 bg-[#023A58] text-white font-bold py-3.5 rounded-xl hover:bg-[#035B8B] transition-all shadow-md flex justify-center items-center gap-2">
                             {salvandoUsuario ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-plus"></i>} Registar Acesso
                          </button>
                       </form>
                     </div>
                  </div>

                  <div className="xl:w-2/3 flex flex-col h-full">
                     <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full min-h-[500px]">
                       <div className="p-6 border-b border-slate-100 bg-white">
                         <h3 className="font-black text-[#023A58] text-lg">Equipa e Permissões Ativas</h3>
                       </div>
                       <div className="overflow-y-auto custom-scrollbar flex-1 bg-slate-50/30">
                          <table className="w-full text-left border-collapse whitespace-nowrap">
                            <thead className="bg-slate-100/50 border-b border-slate-200">
                              <tr className="text-[11px] uppercase tracking-wider text-slate-500 font-black">
                                <th className="p-4 pl-6">Utilizador</th>
                                <th className="p-4 text-center">Login</th>
                                <th className="p-4 text-center">Perfil</th>
                                <th className="p-4 text-right pr-6">Ação</th>
                              </tr>
                            </thead>
                            <tbody className="text-sm">
                              {carregandoUsuarios ? (
                                <tr><td colSpan={4} className="p-16 text-center text-slate-400 font-medium"><i className="fas fa-spinner fa-spin mr-2 text-xl"></i> A carregar base...</td></tr>
                              ) : listaUsuarios.length === 0 ? (
                                <tr><td colSpan={4} className="p-16 text-center text-slate-400 font-medium">Nenhum utilizador encontrado.</td></tr>
                              ) : (
                                listaUsuarios.map((usr) => (
                                  <tr key={usr.id} className="border-b border-slate-100 hover:bg-white transition-colors">
                                    <td className="p-4 pl-6 font-bold text-slate-800">{usr.nome}</td>
                                    <td className="p-4 text-center font-mono text-xs font-bold text-slate-600">
                                       <span className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">{usr.login}</span>
                                    </td>
                                    <td className="p-4 text-center">
                                      <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest shadow-sm ${usr.perfil === 'ADM' ? 'bg-[#023A58] text-white' : usr.perfil === 'SESMT' ? 'bg-orange-500 text-white' : 'bg-[#0a84ff] text-white'}`}>
                                        {usr.perfil}
                                      </span>
                                    </td>
                                    <td className="p-4 text-right pr-6">
                                      {usr.login !== 'admin' ? (
                                        <button onClick={() => excluirUsuario(usr.id, usr.login)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-colors shadow-sm" title="Remover Acesso">
                                          <i className="fas fa-trash-alt"></i>
                                        </button>
                                      ) : (
                                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest"><i className="fas fa-crown mr-1 text-amber-400"></i>Master</span>
                                      )}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                       </div>
                     </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* MODAL DE EDIÇÃO */}
        {colaboradorEditando && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animation-fade-in hide-on-print">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col">
              <div className="bg-white border-b border-slate-200 p-6 flex justify-between items-center">
                <h3 className="font-black text-[#023A58] text-xl flex items-center gap-3"><i className="fas fa-lock text-[#f39c12]"></i>Painel de Complementos</h3>
                <button onClick={() => setColaboradorEditando(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-rose-100 hover:text-rose-600 transition-colors"><i className="fas fa-times"></i></button>
              </div>
              <form onSubmit={salvarEdicao} className="p-6 flex flex-col gap-6 overflow-y-auto max-h-[75vh] bg-slate-50/50">
                <div className="bg-white border border-slate-200 p-5 rounded-xl relative shadow-sm">
                   <div className="absolute -top-3 left-4 bg-white border border-slate-200 px-3 py-0.5 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest shadow-sm">Dados do Sistema Base (Inalteráveis)</div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                     <div><label className="block text-xs font-bold text-slate-500 mb-1">Matrícula</label><input type="text" value={colaboradorEditando.matricula} disabled className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-500 cursor-not-allowed font-bold" /></div>
                     <div><label className="block text-xs font-bold text-slate-500 mb-1">Nome Completo</label><input type="text" value={colaboradorEditando.nome_completo || ''} disabled className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-500 cursor-not-allowed font-bold" /></div>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                     <div><label className="block text-xs font-bold text-slate-500 mb-1">CPF</label><input type="text" value={colaboradorEditando.cpf || ''} disabled className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-500 cursor-not-allowed font-bold" /></div>
                     <div><label className="block text-xs font-bold text-slate-500 mb-1">RG</label><input type="text" value={colaboradorEditando.rg || ''} disabled className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-500 cursor-not-allowed font-bold" /></div>
                     <div><label className="block text-xs font-bold text-slate-500 mb-1">Função / Cargo</label><input type="text" value={colaboradorEditando.desc_funcao || ''} disabled className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-500 cursor-not-allowed font-bold truncate" /></div>
                   </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                  <div>
                    <label className="block text-sm font-bold text-rose-600 mb-2"><i className="fas fa-tint mr-1"></i> Tipo Sanguíneo</label>
                    <input type="text" value={colaboradorEditando.tipo_sanguineo || ''} onChange={e => setColaboradorEditando({...colaboradorEditando, tipo_sanguineo: e.target.value})} placeholder="Ex: O+" className="w-full bg-white border border-slate-300 p-3.5 rounded-xl focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 text-slate-800 font-bold uppercase transition-all shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#0a84ff] mb-2"><i className="fas fa-link mr-1"></i> Link QR Code</label>
                    <input type="url" placeholder="https://..." value={colaboradorEditando.link_qrcode || ''} onChange={e => setColaboradorEditando({...colaboradorEditando, link_qrcode: e.target.value})} className="w-full bg-white border border-slate-300 p-3.5 rounded-xl focus:outline-none focus:border-[#0a84ff] focus:ring-2 focus:ring-blue-100 text-[#023A58] transition-all shadow-sm" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-4 border-t border-slate-200 pt-6">
                  <button type="button" onClick={() => setColaboradorEditando(null)} className="px-8 py-3.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 transition-all shadow-sm">Cancelar</button>
                  <button type="submit" disabled={salvandoEdicao} className="px-8 py-3.5 rounded-xl font-bold text-white bg-orange-500 hover:bg-orange-600 transition-all flex items-center gap-2 shadow-md">
                    {salvandoEdicao ? <i className="fas fa-spinner fa-spin text-lg"></i> : <i className="fas fa-save text-lg"></i>} Guardar Complementos
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MOTOR DE IMPRESSÃO INVISÍVEL */}
        <div className="print-container hidden">
           {colaboradoresParaImprimir.map((c, index) => (
             <React.Fragment key={index}>
                <div className="cracha-card w-[54mm] h-[86mm] bg-white relative flex flex-col items-center overflow-hidden box-border" style={{ border: '1px solid #ccc' }}>
                  <div className="mt-[4mm] w-[26mm] h-[35mm] flex items-center justify-center overflow-hidden z-10 border border-slate-300 bg-white">
                    {c.foto_url ? <img src={c.foto_url} className="w-full h-full object-cover" alt="Foto" /> : <div className="w-full h-full bg-white"></div>}
                  </div>
                  <div className="mt-[2mm] text-center z-10 w-full px-2">
                    <div className="text-[#051e42] font-black text-[18px] leading-[1.0]" style={{ fontFamily: 'Arial, sans-serif' }}>
                      {formatarNomeCurto(c.nome_completo).split(' ')[0]}<br/>{formatarNomeCurto(c.nome_completo).split(' ')[1] || ''}
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 w-full h-[32mm] z-0"><img src="/Imagem1.png" className="w-full h-full object-fill" alt="Fundo" /></div>
                  <div className="absolute bottom-[13mm] left-[1mm] z-10 w-[24mm] h-[8mm] flex items-center justify-start"><img src="/dinamo.png" className="max-h-full max-w-full object-contain" alt="Dínamo" /></div>
                </div>

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
                          {c.link_qrcode ? <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(c.link_qrcode)}`} className="w-full h-full object-contain" alt="QR Code" /> : <div className="w-full h-full bg-white"></div>}
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
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;900&display=swap');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css');
        .font-poppins { font-family: 'Poppins', sans-serif; }
        .animation-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }

        @media print {
          .hide-on-print { display: none !important; }
          html, body, .screen-only, main, .print-padding-remove { width: 54mm !important; height: auto !important; min-height: 100% !important; overflow: visible !important; margin: 0 !important; padding: 0 !important; background: white !important; display: block !important; }
          .print-container { display: block !important; visibility: visible !important; position: relative !important; width: 54mm !important; margin: 0 !important; padding: 0 !important; }
          .print-container * { visibility: visible !important; }
          @page { size: 54mm 86mm; margin: 0 !important; }
          .cracha-card { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; width: 54mm !important; height: 86mm !important; box-sizing: border-box !important; margin: 0 !important; border: none !important; box-shadow: none !important; page-break-after: always !important; break-after: page !important; overflow: hidden !important; position: relative !important; float: none !important; background-color: white !important; }
          .cracha-card:last-of-type { page-break-after: auto !important; break-after: auto !important; }
        }
      `}</style>
    </div>
  );
}
