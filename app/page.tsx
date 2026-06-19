/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useRef, useEffect } from 'react';

export default function PortalRH() {
  // ========================== ESTADOS DE AUTENTICAÇÃO (LOGIN) ==========================
  const [usuarioAutenticado, setUsuarioAutenticado] = useState<any>(null);
  const [loginInput, setLoginInput] = useState('');
  const [senhaInput, setSenhaInput] = useState('');
  const [carregandoLogin, setCarregandoLogin] = useState(false);
  const [erroLogin, setErroLogin] = useState('');

  const [abaAtiva, setAbaAtiva] = useState('colaboradores');
  const [menuAberto, setMenuAberto] = useState(false);
  const [cameraTraseira, setCameraTraseira] = useState(true);

  // Estados para alteração de senha
  const [mostrarModalSenha, setMostrarModalSenha] = useState(false);
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erroSenha, setErroSenha] = useState('');
  const [sucessoSenha, setSucessoSenha] = useState('');
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  const URL = "https://dpndtwutvkaxrxrkyeyw.supabase.co";
  const KEY = "sb_publishable_6Ss9lNdcbyeE2o3U5jcJ7w_qI61wmIr";

  // ========================== FUNÇÃO DE LOGIN ==========================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroLogin('');
    if (!loginInput || !senhaInput) { setErroLogin('Preencha as credenciais de acesso.'); return; }
    
    setCarregandoLogin(true);
    try {
      const response = await fetch(`${URL}/rest/v1/usuarios_sistema?login=eq.${loginInput}&senha=eq.${senhaInput}&select=*`, {
        headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }
      });
      const data = await response.json();
      
      if (data && data.length > 0) {
        setUsuarioAutenticado(data[0]);
        setAbaAtiva('colaboradores');
        setLoginInput(''); setSenhaInput('');
      } else {
        setErroLogin('Credenciais inválidas. Tente novamente.');
      }
    } catch (error) { setErroLogin('Erro de comunicação com o servidor.'); } 
    finally { setCarregandoLogin(false); }
  };

  const handleLogout = () => { setUsuarioAutenticado(null); setAbaAtiva('colaboradores'); };

  // ========================== MATRIZ DE PERMISSÕES ==========================
  const getMenuItens = () => {
    if (!usuarioAutenticado) return [];
    const itensBasicos = [
      { id: 'colaboradores', nome: 'Base de Colaboradores', icone: 'fa-users' },
      { id: 'emissao', nome: 'Emissão Individual', icone: 'fa-id-badge' },
    ];
    if (usuarioAutenticado.perfil === 'ADM' || usuarioAutenticado.perfil === 'RH') {
      return [
        ...itensBasicos,
        { id: 'lote', nome: 'Emissão em Lote', icone: 'fa-layer-group' },
        { id: 'cadastro', nome: 'Cadastro Manual', icone: 'fa-user-plus' },
        { id: 'configuracoes', nome: 'Gestão de Acessos', icone: 'fa-shield-alt' },
      ];
    }
    return itensBasicos;
  };

  const menuItens = getMenuItens();

  // ========================== ABA: HUB CENTRAL ==========================
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
      const data = await response.json(); setResultadosBusca(data || []);
    } catch (error) { console.error("Erro na busca"); } finally { setCarregandoLista(false); }
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
      if (data && data.length > 0) { 
        setColaborador(data[0]); 
        setFotoCapturada(data[0].foto_url || null); 
        setAbaAtiva('emissao'); 
        setBuscaEmissao('');
      } else { 
        setColaborador(null); setErroEmissao('Matrícula não encontrada.'); 
      }
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

  // ========================== ABA: CONFIGURAÇÕES ==========================
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
    if ((usuarioAutenticado?.perfil === 'ADM' || usuarioAutenticado?.perfil === 'RH') && abaAtiva === 'configuracoes') {
      carregarUsuarios(); 
    }
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
         throw new Error(errData.message || errData.details || `Erro de sistema.`);
      }
      setMsgUsuario({ texto: 'Utilizador criado!', tipo: 'sucesso' }); setFormUsuario({ nome: '', login: '', senha: '', perfil: 'RH' }); carregarUsuarios();
    } catch (err: any) { setMsgUsuario({ texto: err.message, tipo: 'erro' }); } finally { setSalvandoUsuario(false); }
  };

  const excluirUsuario = async (id: string, login: string, perfilUsuarioAlvo: string) => {
    if(login === 'admin') { alert("O Administrador principal não pode ser excluído."); return; }
    if(usuarioAutenticado?.perfil === 'RH' && perfilUsuarioAlvo === 'ADM') { alert("Acesso Negado: Perfil RH não exclui Administrador."); return; }
    if(!window.confirm("Deseja excluir este acesso?")) return;
    try { await fetch(`${URL}/rest/v1/usuarios_sistema?id=eq.${id}`, { method: 'DELETE', headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` } }); carregarUsuarios(); } catch (err) { alert("Erro ao excluir."); }
  };

  // ========================== ALTERAÇÃO DE SENHA ==========================
  const abrirModalSenha = () => {
    setMostrarModalSenha(true); setNovaSenha(''); setConfirmarSenha(''); setErroSenha(''); setSucessoSenha('');
  };

  const handleAlterarSenha = async (e: React.FormEvent) => {
    e.preventDefault(); setErroSenha(''); setSucessoSenha('');
    if (!novaSenha || !confirmarSenha) { setErroSenha('Preencha ambos os campos.'); return; }
    if (novaSenha !== confirmarSenha) { setErroSenha('As senhas não coincidem.'); return; }
    if (novaSenha.length < 4) { setErroSenha('Mínimo de 4 caracteres.'); return; }

    setSalvandoSenha(true);
    try {
      const response = await fetch(`${URL}/rest/v1/usuarios_sistema?id=eq.${usuarioAutenticado.id}`, {
        method: 'PATCH',
        headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify({ senha: novaSenha }),
      });
      if (!response.ok) throw new Error('Erro ao alterar senha.');
      setSucessoSenha('Senha alterada com sucesso!');
      setTimeout(() => setMostrarModalSenha(false), 1500);
    } catch (err: any) { setErroSenha(err.message || 'Erro ao alterar senha.'); } finally { setSalvandoSenha(false); }
  };

  const formatarNomeCurto = (nomeCompleto: string) => { if (!nomeCompleto) return ""; const partes = nomeCompleto.trim().split(" "); return partes.length === 1 ? partes[0] : `${partes[0]} ${partes[partes.length - 1]}`; };
  const obterDataHoraAtual = () => { const data = new Date(); return `${data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })} ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`; };
  const colaboradoresParaImprimir = abaAtiva === 'lote' ? listaLote : (colaborador && abaAtiva === 'emissao' ? [{ ...colaborador, foto_url: fotoCapturada || colaborador.foto_url }] : []);
  const navegarPara = (id: string) => { setAbaAtiva(id); setMenuAberto(false); };

  // ========================== TELA DE LOGIN (REFINADA E PREMIUM) ==========================
  if (!usuarioAutenticado) {
    return (
      <div className="flex h-screen bg-[#f4f7f6] font-sans items-center justify-center relative overflow-hidden">
        {/* Fundo Corporativo Minimalista */}
        <div className="absolute top-0 left-0 w-full h-[40%] bg-[#023A58]"></div>
        
        <div className="z-10 w-full max-w-md px-6">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
            <div className="p-8 flex flex-col items-center bg-white border-b border-slate-100">
              <img src="/logodinamobranca.png" alt="Dínamo" className="max-h-12 mb-5 object-contain filter" style={{ filter: 'brightness(0) saturate(100%) invert(14%) sepia(45%) saturate(3033%) hue-rotate(185deg) brightness(96%) contrast(101%)' }} />
              <h2 className="text-2xl font-bold tracking-tight text-[#023A58]">Portal Operacional</h2>
              <p className="text-sm text-slate-500 mt-1 font-medium">Acesso restrito à gestão</p>
            </div>
            
            <form onSubmit={handleLogin} className="p-8 flex flex-col gap-5 bg-white">
              {erroLogin && (
                <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-xl text-sm font-semibold flex items-center gap-2">
                  <i className="fas fa-exclamation-circle text-lg"></i> <span>{erroLogin}</span>
                </div>
              )}
              
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Utilizador</label>
                <div className="relative">
                  <i className="fas fa-user absolute left-4 top-[14px] text-slate-400"></i>
                  <input type="text" value={loginInput} onChange={(e) => setLoginInput(e.target.value.toLowerCase().replace(/\s/g, ''))} placeholder="Login de acesso" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#023A58] focus:border-transparent font-medium text-slate-800 transition-all lowercase" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Senha</label>
                <div className="relative">
                  <i className="fas fa-lock absolute left-4 top-[14px] text-slate-400"></i>
                  <input type="password" value={senhaInput} onChange={(e) => setSenhaInput(e.target.value)} placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#023A58] focus:border-transparent font-medium text-slate-800 transition-all" />
                </div>
              </div>

              <button type="submit" disabled={carregandoLogin} className="w-full bg-[#023A58] text-white font-semibold py-3.5 rounded-xl hover:bg-[#035B8B] transition-all shadow-md flex justify-center items-center gap-2 mt-4">
                {carregandoLogin ? <><i className="fas fa-spinner fa-spin text-lg"></i> Acessando...</> : 'Acessar Sistema'}
              </button>
            </form>
          </div>
          
          <div className="text-center mt-8 text-slate-500 text-xs font-medium">
            &copy; 2026 Dínamo Engenharia. Todos os direitos reservados.
          </div>
        </div>
      </div>
    );
  }

  // ========================== DASHBOARD PRINCIPAL ==========================
  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden screen-only relative">
      
      {/* OVERLAY MOBILE */}
      {menuAberto && <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden transition-opacity" onClick={() => setMenuAberto(false)}></div>}

      {/* MENU LATERAL */}
      <aside className={`${menuAberto ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:relative z-50 w-72 h-full flex flex-col transition-transform duration-300 ease-out hide-on-print border-r border-slate-200`} style={{ background: '#023A58' }}>
        <div className="h-20 flex items-center justify-between md:justify-center border-b border-white/10 px-6">
          <img src="/logodinamobranca.png" alt="Dínamo" className="max-h-10 object-contain drop-shadow-sm" />
          <button className="md:hidden text-white/70 hover:text-white text-xl" onClick={() => setMenuAberto(false)}><i className="fas fa-times"></i></button>
        </div>
        <nav className="flex-1 overflow-y-auto py-8 px-4 space-y-2 custom-scrollbar">
          <div className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-4 px-4">Menu Principal</div>
          {menuItens.map((item) => (
            <button key={item.id} onClick={() => navegarPara(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm outline-none
                ${abaAtiva === item.id ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${abaAtiva === item.id ? 'text-[#0a84ff]' : 'text-slate-400'}`}>
                 <i className={`fas ${item.icone} text-center`}></i>
              </div>
              {item.nome}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 text-slate-300 hover:bg-rose-500 hover:text-white rounded-xl transition-colors font-medium text-sm">
             <i className="fas fa-sign-out-alt"></i> Encerrar Sessão
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 flex flex-col relative overflow-hidden print-main-adjust bg-slate-50">
        
        {/* HEADER */}
        <header className="h-20 bg-white shadow-sm border-b border-slate-200 flex items-center justify-between px-6 md:px-10 z-10 hide-on-print relative">
          <div className="flex items-center gap-4">
            <button className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors" onClick={() => setMenuAberto(true)}>
              <i className="fas fa-bars"></i>
            </button>
            <h2 className="text-xl font-bold text-[#023A58] hidden sm:flex items-center gap-2">
               {menuItens.find(m => m.id === abaAtiva)?.nome || 'Módulo Restrito'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-white px-2 pr-4 py-1.5 rounded-full border border-slate-200 shadow-sm">
              <div className="w-9 h-9 rounded-full bg-[#023A58] flex items-center justify-center text-white font-bold text-xs uppercase">
                {usuarioAutenticado.nome.substring(0, 2)}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-700 leading-tight">{usuarioAutenticado.nome}</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#0a84ff]">
                   Perfil: {usuarioAutenticado.perfil}
                </span>
              </div>
            </div>
            <button onClick={abrirModalSenha} className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors flex items-center justify-center" title="Alterar Senha">
              <i className="fas fa-key"></i>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 custom-scrollbar print-padding-remove">

          {/* ABA 1: BASE DE COLABORADORES */}
          {abaAtiva === 'colaboradores' && (
            <div className="max-w-7xl mx-auto hide-on-print flex flex-col h-full gap-6 animation-fade-in">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <form onSubmit={handlePesquisaTabela} className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 w-full">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Pesquisa na Base</label>
                    <div className="relative">
                      <i className="fas fa-search absolute left-4 top-[14px] text-slate-400"></i>
                      <input type="text" placeholder="Digite a Matrícula ou Nome..." value={buscaTabela} onChange={(e) => setBuscaTabela(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a84ff] transition-all" />
                    </div>
                  </div>
                  <button type="submit" disabled={carregandoLista} className="w-full md:w-auto bg-[#023A58] text-white font-semibold px-8 py-3 rounded-xl hover:bg-[#035B8B] shadow-sm transition-all flex justify-center items-center gap-2">
                    {carregandoLista ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-search"></i>} Localizar
                  </button>
                </form>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col flex-1 overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-semibold text-slate-800">Resultados {resultadosBusca.length > 0 && <span className="text-[#0a84ff] bg-blue-50 px-2 py-0.5 rounded text-xs ml-2">{resultadosBusca.length}</span>}</h3>
                </div>
                <div className="overflow-x-auto overflow-y-auto custom-scrollbar flex-1">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200">
                      <tr className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                        <th className="p-4 pl-6">Colaborador</th>
                        <th className="p-4">Matrícula</th>
                        <th className="p-4 text-center">Foto</th>
                        <th className="p-4 text-center">QR Code</th>
                        <th className="p-4 text-right pr-6">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {!pesquisaRealizada ? (
                        <tr><td colSpan={5} className="p-16 text-center text-slate-400">Utilize a barra de pesquisa acima.</td></tr>
                      ) : resultadosBusca.length === 0 ? (
                        <tr><td colSpan={5} className="p-16 text-center text-slate-400">Nenhum registo encontrado.</td></tr>
                      ) : (
                        resultadosBusca.map((colab) => (
                          <tr key={colab.matricula} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                            <td className="p-4 pl-6 font-semibold text-slate-800">{colab.nome_completo}</td>
                            <td className="p-4 font-semibold text-[#0a84ff]">{colab.matricula}</td>
                            <td className="p-4 text-center">
                              {colab.foto_url ? <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-[10px] font-bold"><i className="fas fa-check"></i> SIM</span> : <span className="text-rose-500 bg-rose-50 px-2 py-1 rounded text-[10px] font-bold"><i className="fas fa-times"></i> NÃO</span>}
                            </td>
                            <td className="p-4 text-center">
                              {colab.link_qrcode ? <span className="text-[#0a84ff] bg-blue-50 px-2 py-1 rounded text-[10px] font-bold"><i className="fas fa-link"></i> OK</span> : <span className="text-slate-400 bg-slate-100 px-2 py-1 rounded text-[10px] font-bold">VAZIO</span>}
                            </td>
                            <td className="p-4 text-right pr-6 flex justify-end gap-2">
                              <button onClick={() => { setBuscaEmissao(colab.matricula); buscarColaboradorParaEmissao(colab.matricula); }} className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors">Emitir Crachá</button>
                              <button onClick={() => abrirEdicao(colab)} className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors">Editar</button>
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

          {/* ABA 2: EMISSÃO EM LOTE */}
          {abaAtiva === 'lote' && (usuarioAutenticado.perfil === 'ADM' || usuarioAutenticado.perfil === 'RH') && (
            <div className="max-w-6xl mx-auto hide-on-print flex flex-col h-full gap-6 animation-fade-in">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <form onSubmit={adicionarAoLote} className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 w-full">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Adicionar à Fila</label>
                    <input type="text" placeholder="Matrícula..." value={matriculaLote} onChange={(e) => setMatriculaLote(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0a84ff] transition-all" />
                  </div>
                  <button type="submit" disabled={carregandoLote} className="w-full md:w-auto bg-[#023A58] text-white font-semibold px-8 py-3 rounded-xl hover:bg-[#035B8B] shadow-sm transition-all flex justify-center items-center gap-2">
                    {carregandoLote ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-plus"></i>} Adicionar
                  </button>
                </form>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col flex-1 overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-semibold text-slate-800">Fila de Impressão ({listaLote.length})</h3>
                  <button onClick={() => window.print()} disabled={listaLote.length === 0} className={`font-semibold px-5 py-2 text-sm rounded-lg transition-all flex items-center gap-2 ${listaLote.length > 0 ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
                    <i className="fas fa-print"></i> Imprimir Tudo
                  </button>
                </div>
                <div className="overflow-x-auto overflow-y-auto custom-scrollbar flex-1">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200">
                      <tr className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                        <th className="p-4 pl-6">Matrícula</th>
                        <th className="p-4">Colaborador</th>
                        <th className="p-4 text-center">Foto</th>
                        <th className="p-4 text-center">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {listaLote.length === 0 ? (
                        <tr><td colSpan={4} className="p-16 text-center text-slate-400">Fila vazia.</td></tr>
                      ) : (
                        listaLote.map((colab) => (
                          <tr key={colab.matricula} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="p-4 pl-6 font-semibold text-[#0a84ff]">{colab.matricula}</td>
                            <td className="p-4 font-semibold text-slate-800">
                               {colab.nome_completo}
                               {!colab.foto_url && <span className="ml-2 text-[9px] bg-rose-500 text-white px-2 py-0.5 rounded uppercase font-bold">Sem Foto</span>}
                            </td>
                            <td className="p-4 text-center">
                              {colab.foto_url ? <i className="fas fa-check text-emerald-500"></i> : <i className="fas fa-times text-rose-500"></i>}
                            </td>
                            <td className="p-4 text-center">
                              <button onClick={() => removerDoLote(colab.matricula)} className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-colors"><i className="fas fa-trash-alt"></i></button>
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

          {/* ABA 3: EMISSÃO INDIVIDUAL */}
          {abaAtiva === 'emissao' && (
            <div className="max-w-6xl mx-auto hide-on-print animation-fade-in">
              <form onSubmit={(e) => { e.preventDefault(); buscarColaboradorParaEmissao(buscaEmissao); }} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Matrícula (Estúdio)</label>
                  <input type="text" placeholder="Ex: 6294" value={buscaEmissao} onChange={(e) => setBuscaEmissao(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0a84ff] transition-all" />
                </div>
                <button type="submit" disabled={carregandoEmissao} className="w-full md:w-auto bg-[#023A58] text-white font-semibold px-8 py-3 rounded-xl hover:bg-[#035B8B] shadow-sm transition-all">Buscar</button>
              </form>

              {erroEmissao && <p className="text-rose-600 mb-6 bg-rose-50 p-4 rounded-xl text-sm font-medium border border-rose-100">{erroEmissao}</p>}

              {colaborador && (
                <div className="flex flex-col xl:flex-row gap-6">
                  <div className="xl:w-1/3 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center">
                    <h3 className="text-md font-bold text-slate-800 mb-4">Fotografia</h3>
                    {rawFoto ? (
                      <div className="flex flex-col items-center w-full">
                        <div className="relative w-48 h-64 bg-slate-900 overflow-hidden mb-4 rounded-xl" style={{ filter: clarear ? 'brightness(1.25) contrast(1.15)' : 'none' }}>
                          <img src={rawFoto} alt="Raw" style={{ transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`, transformOrigin: 'center', width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div className="w-full space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <div><label className="text-[10px] font-bold text-slate-500 uppercase">Zoom</label><input type="range" min="1" max="3" step="0.05" value={zoom} onChange={e => setZoom(Number(e.target.value))} className="w-full" /></div>
                          <div><label className="text-[10px] font-bold text-slate-500 uppercase">Esq/Dir</label><input type="range" min="-150" max="150" value={panX} onChange={e => setPanX(Number(e.target.value))} className="w-full" /></div>
                          <div><label className="text-[10px] font-bold text-slate-500 uppercase">Cima/Baixo</label><input type="range" min="-150" max="150" value={panY} onChange={e => setPanY(Number(e.target.value))} className="w-full" /></div>
                        </div>
                        <label className="flex items-center gap-2 mt-3 text-sm text-slate-600"><input type="checkbox" checked={clarear} onChange={e => setClarear(e.target.checked)} /> Clarear</label>
                        <div className="flex gap-2 w-full mt-3">
                          <button onClick={usarFotoOriginal} className="flex-1 bg-slate-200 text-slate-700 font-semibold py-2 rounded-lg text-xs">Pular</button>
                          <button onClick={aplicarRecorte} className="flex-1 bg-emerald-500 text-white font-semibold py-2 rounded-lg text-xs">Cortar</button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full flex flex-col items-center">
                        <div className="w-48 h-64 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden relative flex items-center justify-center mb-4">
                          {cameraAtiva ? <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" /> : fotoCapturada ? <img src={fotoCapturada} alt="Crachá" className="w-full h-full object-cover" /> : <i className="fas fa-user text-4xl text-slate-300"></i>}
                        </div>
                        <div className="w-full flex flex-col gap-2">
                          {cameraAtiva ? (
                             <button onClick={tirarFoto} className="w-full bg-rose-500 text-white font-semibold py-2.5 rounded-xl text-sm">Disparar</button>
                          ) : (
                            <button onClick={() => ligarCameraMobile(cameraTraseira)} className="w-full bg-[#023A58] text-white font-semibold py-2.5 rounded-xl text-sm">Abrir Câmara</button>
                          )}
                          <label className="block w-full bg-white border border-slate-200 text-slate-600 text-center font-semibold py-2.5 rounded-xl cursor-pointer text-sm">Arquivo <input type="file" accept="image/*" onChange={handleUploadFoto} className="hidden" /></label>
                        </div>
                        <button onClick={salvarFotoNoSupabase} disabled={!fotoAlterada || salvandoFoto} className={`w-full mt-4 font-semibold py-3 rounded-xl text-sm transition-colors ${fotoAlterada ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-400'}`}>Guardar</button>
                      </div>
                    )}
                  </div>

                  <div className="xl:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-md font-bold text-slate-800">Visualização</h3>
                      <button onClick={() => window.print()} disabled={!fotoCapturada || !!rawFoto} className={`font-semibold px-5 py-2 rounded-lg text-sm ${fotoCapturada && !rawFoto ? 'bg-[#0a84ff] text-white' : 'bg-slate-100 text-slate-400'}`}>Imprimir</button>
                    </div>
                    <div className="flex justify-center bg-slate-50 p-6 rounded-xl border border-slate-100 overflow-x-auto gap-6">
                      {/* CARTÃO FRENTE */}
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
                      {/* CARTÃO VERSO */}
                      <div className="cracha-card w-[54mm] h-[86mm] bg-white relative p-[2mm] flex flex-col box-border" style={{ border: '1px solid #ccc' }}>
                        <div className="mt-[2mm] w-full flex flex-col gap-[3mm]">
                          <div className="relative border-[1.5px] border-black rounded-[4px] h-[7mm] flex items-center justify-center w-full"><span className="absolute -top-[2.5mm] left-[2mm] bg-white px-[1mm] text-[6px] font-bold text-black leading-none">Nome</span><div className="text-[7.5px] text-black font-semibold uppercase">{colaborador.nome_completo}</div></div>
                          <div className="flex w-full gap-[2mm]">
                            <div className="relative border-[1.5px] border-black rounded-[4px] h-[7mm] flex-1 flex items-center justify-center"><span className="absolute -top-[2.5mm] left-[2mm] bg-white px-[1mm] text-[6px] font-bold text-black leading-none">CPF</span><div className="text-[8px] text-black font-semibold uppercase">{colaborador.cpf || '000.000.000-00'}</div></div>
                            <div className="relative border-[1.5px] border-black rounded-[4px] h-[7mm] w-[14mm] flex items-center justify-center bg-[#ffebee] border-[#e74c3c]"><span className="absolute -top-[2.5mm] left-[1mm] bg-white px-[0.5mm] text-[5px] font-bold text-[#c0392b] leading-none">Tp. Sangue</span><div className="text-[8px] text-[#c0392b] font-black uppercase">{colaborador.tipo_sanguineo || ''}</div></div>
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

          {/* ABA 4: CADASTRO MANUAL */}
          {abaAtiva === 'cadastro' && (usuarioAutenticado.perfil === 'ADM' || usuarioAutenticado.perfil === 'RH') && (
            <div className="max-w-3xl mx-auto hide-on-print animation-fade-in">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
                <div className="p-6 border-b border-slate-100"><h3 className="font-bold text-slate-800 text-lg">Cadastro Manual</h3></div>
                <form onSubmit={handleCadastroManual} className="p-6 flex flex-col gap-5">
                  {msgCadastro.texto && <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-medium">{msgCadastro.texto}</div>}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-xs font-semibold text-slate-500 mb-1">Matrícula</label><input type="text" required value={formCadastro.matricula} onChange={e => setFormCadastro({...formCadastro, matricula: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-[#0a84ff]" /></div>
                    <div><label className="block text-xs font-semibold text-slate-500 mb-1">Nome Completo</label><input type="text" required value={formCadastro.nome_completo} onChange={e => setFormCadastro({...formCadastro, nome_completo: e.target.value.toUpperCase()})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-[#0a84ff]" /></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><label className="block text-xs font-semibold text-slate-500 mb-1">CPF</label><input type="text" value={formCadastro.cpf} onChange={e => setFormCadastro({...formCadastro, cpf: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-[#0a84ff]" /></div>
                    <div><label className="block text-xs font-semibold text-slate-500 mb-1">RG</label><input type="text" value={formCadastro.rg} onChange={e => setFormCadastro({...formCadastro, rg: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-[#0a84ff]" /></div>
                    <div><label className="block text-xs font-semibold text-slate-500 mb-1">Cargo</label><input type="text" value={formCadastro.desc_funcao} onChange={e => setFormCadastro({...formCadastro, desc_funcao: e.target.value.toUpperCase()})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-[#0a84ff]" /></div>
                  </div>
                  <button type="submit" disabled={salvandoCadastro} className="mt-4 bg-emerald-500 text-white font-semibold py-3 rounded-xl hover:bg-emerald-600">Cadastrar Colaborador</button>
                </form>
              </div>
            </div>
          )}

          {/* ABA 5: GESTÃO DE ACESSOS */}
          {abaAtiva === 'configuracoes' && (
            <div className="max-w-6xl mx-auto hide-on-print animation-fade-in">
              {(usuarioAutenticado?.perfil !== 'ADM' && usuarioAutenticado?.perfil !== 'RH') ? (
                 <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center"><h2 className="text-xl font-bold text-slate-800">Acesso Restrito</h2></div>
              ) : (
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-1/3 bg-white rounded-2xl shadow-sm border border-slate-200 h-fit">
                    <div className="p-5 border-b border-slate-100"><h3 className="font-bold text-slate-800">Novo Acesso</h3></div>
                    <form onSubmit={handleCriarUsuario} className="p-5 flex flex-col gap-4">
                      {msgUsuario.texto && <div className="text-xs font-medium text-emerald-600">{msgUsuario.texto}</div>}
                      <div><label className="text-xs font-semibold text-slate-500 block mb-1">Nome</label><input type="text" required value={formUsuario.nome} onChange={e => setFormUsuario({...formUsuario, nome: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm" /></div>
                      <div><label className="text-xs font-semibold text-slate-500 block mb-1">Login</label><input type="text" required value={formUsuario.login} onChange={e => setFormUsuario({...formUsuario, login: e.target.value.toLowerCase().replace(/\s/g, '')})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm" /></div>
                      <div><label className="text-xs font-semibold text-slate-500 block mb-1">Senha</label><input type="password" required value={formUsuario.senha} onChange={e => setFormUsuario({...formUsuario, senha: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm" /></div>
                      <div><label className="text-xs font-semibold text-slate-500 block mb-1">Perfil</label><select value={formUsuario.perfil} onChange={e => setFormUsuario({...formUsuario, perfil: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm"><option value="RH">RH</option><option value="SESMT">SESMT</option><option value="ADM">Administrador</option></select></div>
                      <button type="submit" className="w-full bg-[#023A58] text-white font-semibold py-2.5 rounded-lg mt-2">Criar Utilizador</button>
                    </form>
                  </div>
                  <div className="md:w-2/3 bg-white rounded-2xl shadow-sm border border-slate-200">
                    <div className="p-5 border-b border-slate-100"><h3 className="font-bold text-slate-800">Equipa Ativa</h3></div>
                    <div className="p-5">
                      <table className="w-full text-left">
                        <thead><tr className="text-xs text-slate-400 border-b border-slate-100"><th className="pb-2">Nome</th><th className="pb-2">Perfil</th><th className="pb-2">Ação</th></tr></thead>
                        <tbody className="text-sm">
                          {listaUsuarios.map((usr) => (
                            <tr key={usr.id} className="border-b border-slate-50"><td className="py-3 font-medium text-slate-700">{usr.nome}</td><td className="py-3"><span className="bg-slate-100 px-2 py-1 rounded text-xs font-semibold">{usr.perfil}</span></td><td className="py-3">{usr.login !== 'admin' && <button onClick={() => excluirUsuario(usr.id, usr.login, usr.perfil)} className="text-rose-500 text-xs">Excluir</button>}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* MODAL EDIÇÃO COLABORADOR */}
        {colaboradorEditando && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex justify-between"><h3 className="font-bold text-slate-800">Editar Complementos</h3><button onClick={() => setColaboradorEditando(null)}><i className="fas fa-times text-slate-400"></i></button></div>
              <form onSubmit={salvarEdicao} className="p-6 flex flex-col gap-4 bg-slate-50/50">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-semibold text-slate-500 block mb-1">Matrícula</label><input disabled value={colaboradorEditando.matricula} className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 text-sm text-slate-500" /></div>
                  <div><label className="text-xs font-semibold text-slate-500 block mb-1">Nome</label><input disabled value={colaboradorEditando.nome_completo} className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 text-sm text-slate-500" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div><label className="text-xs font-semibold text-rose-600 block mb-1">Tipo Sanguíneo</label><input type="text" value={colaboradorEditando.tipo_sanguineo || ''} onChange={e => setColaboradorEditando({...colaboradorEditando, tipo_sanguineo: e.target.value})} className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm uppercase focus:border-rose-400 focus:outline-none" placeholder="O+" /></div>
                  <div><label className="text-xs font-semibold text-[#0a84ff] block mb-1">Link QR Code</label><input type="url" value={colaboradorEditando.link_qrcode || ''} onChange={e => setColaboradorEditando({...colaboradorEditando, link_qrcode: e.target.value})} className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm focus:border-[#0a84ff] focus:outline-none" placeholder="https://" /></div>
                </div>
                <div className="flex justify-end gap-3 mt-4"><button type="button" onClick={() => setColaboradorEditando(null)} className="px-6 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-600">Cancelar</button><button type="submit" disabled={salvandoEdicao} className="px-6 py-2.5 bg-orange-500 rounded-xl text-sm font-semibold text-white">Atualizar</button></div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL ALTERAR SENHA */}
        {mostrarModalSenha && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex justify-between"><h3 className="font-bold text-slate-800">Alterar Senha</h3><button onClick={() => setMostrarModalSenha(false)}><i className="fas fa-times text-slate-400"></i></button></div>
              <form onSubmit={handleAlterarSenha} className="p-6 flex flex-col gap-4">
                {erroSenha && <div className="text-xs text-rose-600 font-medium">{erroSenha}</div>}
                {sucessoSenha && <div className="text-xs text-emerald-600 font-medium">{sucessoSenha}</div>}
                <div><label className="text-xs font-semibold text-slate-500 block mb-1">Nova Senha</label><input type="password" required value={novaSenha} onChange={e => setNovaSenha(e.target.value)} className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus:border-[#0a84ff]" /></div>
                <div><label className="text-xs font-semibold text-slate-500 block mb-1">Confirmar Senha</label><input type="password" required value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus:border-[#0a84ff]" /></div>
                <button type="submit" disabled={salvandoSenha} className="w-full bg-[#0a84ff] text-white py-3 rounded-xl font-semibold mt-2">Alterar</button>
              </form>
            </div>
          </div>
        )}

      </main>

      {/* CSS DE IMPRESSÃO MANTIDO INTACTO */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&display=swap');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css');
        .font-sans { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
        .animation-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

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
