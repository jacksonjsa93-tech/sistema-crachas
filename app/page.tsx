/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useRef, useEffect } from 'react';

export default function PortalRH() {
  // ========================== ESTADOS GLOBAIS DE UI ==========================
  const [toast, setToast] = useState({ ativo: false, mensagem: '', tipo: 'sucesso' });
  const [confirmDialog, setConfirmDialog] = useState({ ativo: false, mensagem: '', acao: () => {} });

  const mostrarToast = (mensagem: string, tipo: 'sucesso' | 'erro' | 'aviso' = 'sucesso') => {
    setToast({ ativo: true, mensagem, tipo });
    setTimeout(() => setToast({ ativo: false, mensagem: '', tipo: 'sucesso' }), 4000);
  };

  // ========================== ESTADOS DE AUTENTICAÇÃO E NAVEGAÇÃO ==========================
  const [usuarioAutenticado, setUsuarioAutenticado] = useState<any>(null);
  const [loginInput, setLoginInput] = useState('');
  const [senhaInput, setSenhaInput] = useState('');
  const [lembrarLogin, setLembrarLogin] = useState(false);
  const [carregandoLogin, setCarregandoLogin] = useState(false);
  const [erroLogin, setErroLogin] = useState('');
  const [abaAtiva, setAbaAtiva] = useState('colaboradores');
  const [menuAberto, setMenuAberto] = useState(false);

  const [mostrarModalSenha, setMostrarModalSenha] = useState(false);
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erroSenha, setErroSenha] = useState('');
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  const URL = "https://dpndtwutvkaxrxrkyeyw.supabase.co";
  const KEY = "sb_publishable_6Ss9lNdcbyeE2o3U5jcJ7w_qI61wmIr";

  useEffect(() => {
    const loginSalvo = localStorage.getItem('dinamo_lembrar_login');
    if (loginSalvo) { setLoginInput(loginSalvo); setLembrarLogin(true); }
  }, []);

  const handleEsqueceuSenha = () => {
    mostrarToast("Acesso restrito. Solicite a redefinição de senha ao Administrador do Sistema.", "aviso");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setErroLogin('');
    if (!loginInput || !senhaInput) { setErroLogin('Preencha usuário e senha.'); return; }
    setCarregandoLogin(true);
    try {
      const response = await fetch(`${URL}/rest/v1/usuarios_sistema?login=eq.${loginInput}&senha=eq.${senhaInput}&select=*`, { headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` } });
      const data = await response.json();
      if (data && data.length > 0) {
        const user = data[0];
        setUsuarioAutenticado(user);
        if (user.perfil === 'SUPERVISOR') setAbaAtiva('emissao');
        else if (user.perfil === 'RH' || user.perfil === 'ADM') setAbaAtiva('solicitacoes');
        else setAbaAtiva('colaboradores');
        
        setSenhaInput('');
        if (lembrarLogin) localStorage.setItem('dinamo_lembrar_login', loginInput); else localStorage.removeItem('dinamo_lembrar_login');
      } else { setErroLogin('Credenciais inválidas. Tente novamente.'); }
    } catch (error) { setErroLogin('Erro de comunicação com o servidor.'); } finally { setCarregandoLogin(false); }
  };
  
  const handleLogout = () => { setUsuarioAutenticado(null); setAbaAtiva('colaboradores'); };

  const getMenuItens = () => {
    if (!usuarioAutenticado) return [];
    if (usuarioAutenticado.perfil === 'SUPERVISOR') {
      return [ { id: 'emissao', nome: 'Captura & Solicitação', icone: 'fa-camera' } ];
    }
    const itensBasicos = [ { id: 'colaboradores', nome: 'Base de Colaboradores', icone: 'fa-users' }, { id: 'emissao', nome: 'Emissão Individual', icone: 'fa-id-badge' } ];
    if (usuarioAutenticado.perfil === 'ADM' || usuarioAutenticado.perfil === 'RH') {
      return [ { id: 'solicitacoes', nome: 'Caixa de Solicitações', icone: 'fa-inbox' }, ...itensBasicos, { id: 'lote', nome: 'Emissão em Lote', icone: 'fa-layer-group' }, { id: 'cadastro', nome: 'Cadastro Manual', icone: 'fa-user-plus' }, { id: 'configuracoes', nome: 'Gestão de Acessos', icone: 'fa-shield-alt' } ];
    }
    return itensBasicos;
  };
  const menuItens = getMenuItens();

  const obterOpcoesNome = (nomeCompleto: string) => {
    if (!nomeCompleto) return ["NOME INDEFINIDO"];
    const partes = nomeCompleto.trim().split(" ").filter(p => p.length > 0);
    if (partes.length === 0) return ["NOME INDEFINIDO"];
    if (partes.length === 1) return [partes[0]];
    if (partes.length === 2) return [`${partes[0]} ${partes[1]}`];
    const opcoes = [ `${partes[0]} ${partes[partes.length - 1]}` ];
    for (let i = 1; i < partes.length - 1; i++) { if (partes[i].length > 2) opcoes.push(`${partes[0]} ${partes[i]}`); }
    return [...new Set(opcoes)];
  };

  const obterDataHoraAtual = () => { const data = new Date(); return `${data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })} ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`; };

  // ========================== ABA: CAIXA DE SOLICITAÇÕES (RH/ADM) ==========================
  const [listaSolicitacoes, setListaSolicitacoes] = useState<any[]>([]);
  const [carregandoSolicitacoes, setCarregandoSolicitacoes] = useState(false);

  const carregarSolicitacoes = async () => {
    setCarregandoSolicitacoes(true);
    try {
      const response = await fetch(`${URL}/rest/v1/solicitacoes_crachas?status=eq.PENDENTE&order=data_solicitacao.desc`, { headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` } });
      const data = await response.json(); setListaSolicitacoes(data || []);
    } catch (error) { mostrarToast("Erro ao carregar solicitações", "erro"); } finally { setCarregandoSolicitacoes(false); }
  };

  useEffect(() => { if ((usuarioAutenticado?.perfil === 'ADM' || usuarioAutenticado?.perfil === 'RH') && abaAtiva === 'solicitacoes') carregarSolicitacoes(); }, [abaAtiva, usuarioAutenticado]);

  const processarSolicitacao = async (solicitacao: any) => {
    setBuscaEmissao(solicitacao.matricula_colaborador);
    await buscarColaboradorParaEmissao(solicitacao.matricula_colaborador);
    setAbaAtiva('emissao');
    try { await fetch(`${URL}/rest/v1/solicitacoes_crachas?id=eq.${solicitacao.id}`, { method: 'PATCH', headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'EM PROCESSAMENTO' }) }); } catch(e){}
  };

  // ========================== ABA: HUB CENTRAL & HISTÓRICO ==========================
  const [buscaTabela, setBuscaTabela] = useState('');
  const [resultadosBusca, setResultadosBusca] = useState<any[]>([]);
  const [carregandoLista, setCarregandoLista] = useState(false);
  const [pesquisaRealizada, setPesquisaRealizada] = useState(false);
  const [colaboradorEditando, setColaboradorEditando] = useState<any>(null);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  
  const [historicoAberto, setHistoricoAberto] = useState<any[] | null>(null);
  const [nomeHistoricoAberto, setNomeHistoricoAberto] = useState('');

  const handlePesquisaTabela = async (e?: React.FormEvent) => {
    if (e) e.preventDefault(); if (!buscaTabela.trim() && !pesquisaRealizada) return; 
    setCarregandoLista(true); setPesquisaRealizada(true);
    const isNum = /^\d+$/.test(buscaTabela.trim());
    let fetchUrl = `${URL}/rest/v1/colaboradores?select=*&limit=50`;
    if (buscaTabela.trim()) { if (isNum) fetchUrl += `&matricula=eq.${buscaTabela.trim()}`; else fetchUrl += `&nome_completo=ilike.*${buscaTabela.trim()}*`; }
    try { const response = await fetch(fetchUrl, { headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` } }); const data = await response.json(); setResultadosBusca(data || []);
    } catch (error) { mostrarToast("Erro ao buscar dados", "erro"); } finally { setCarregandoLista(false); }
  };
  
  const abrirEdicao = (colab: any) => { setColaboradorEditando({ ...colab }); };
  
  const salvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault(); if (!colaboradorEditando) return; setSalvandoEdicao(true);
    try {
      const response = await fetch(`${URL}/rest/v1/colaboradores?matricula=eq.${colaboradorEditando.matricula}`, { 
        method: 'PATCH', headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' }, 
        body: JSON.stringify({ tipo_sanguineo: colaboradorEditando.tipo_sanguineo || null, link_qrcode: colaboradorEditando.link_qrcode || null, desc_funcao: colaboradorEditando.desc_funcao }) 
      });
      if (!response.ok) throw new Error('Erro');
      setListaLote(prev => prev.map(c => c.matricula === colaboradorEditando.matricula ? { ...c, tipo_sanguineo: colaboradorEditando.tipo_sanguineo, link_qrcode: colaboradorEditando.link_qrcode, desc_funcao: colaboradorEditando.desc_funcao } : c));
      setColaboradorEditando(null); handlePesquisaTabela(); mostrarToast("Informações atualizadas!", "sucesso");
    } catch (err) { mostrarToast("Erro ao salvar alterações.", "erro"); } finally { setSalvandoEdicao(false); }
  };

  const abrirHistorico = async (matricula: string, nome: string) => {
    setNomeHistoricoAberto(nome);
    try {
      const response = await fetch(`${URL}/rest/v1/historico_impressoes?matricula_colaborador=eq.${matricula}&order=data_emissao.desc`, { headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` } });
      const data = await response.json(); setHistoricoAberto(data || []);
    } catch (error) { mostrarToast("Erro ao carregar auditoria.", "erro"); }
  };

  // ========================== ABA: EMISSÃO EM LOTE ==========================
  const [listaLote, setListaLote] = useState<any[]>([]);
  const [matriculaLote, setMatriculaLote] = useState('');
  const [carregandoLote, setCarregandoLote] = useState(false);

  const adicionarAoLote = async (e: React.FormEvent) => {
    e.preventDefault(); if (!matriculaLote.trim()) return;
    if (listaLote.find(c => String(c.matricula) === String(matriculaLote.trim()))) { mostrarToast('Já está na fila.', 'aviso'); setMatriculaLote(''); return; }
    setCarregandoLote(true);
    try {
      const response = await fetch(`${URL}/rest/v1/colaboradores?matricula=eq.${matriculaLote.trim()}&select=*`, { headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` } });
      const data = await response.json();
      if (data && data.length > 0) { 
        const novoColab = data[0]; novoColab.nome_cracha_frente = obterOpcoesNome(novoColab.nome_completo)[0]; 
        setListaLote([...listaLote, novoColab]); setMatriculaLote(''); 
      } else { mostrarToast('Matrícula não encontrada.', 'erro'); }
    } catch (error) { mostrarToast('Erro na base.', 'erro'); } finally { setCarregandoLote(false); }
  };
  const removerDoLote = (matricula: string) => { setListaLote(listaLote.filter(c => String(c.matricula) !== String(matricula))); };
  const atualizarNomeLote = (matricula: string, novoNome: string) => { setListaLote(listaLote.map(c => c.matricula === matricula ? { ...c, nome_cracha_frente: novoNome } : c)); };

  const registrarImpressoesEmLote = async () => {
    if (listaLote.length === 0) return;
    try {
      const registros = listaLote.map(c => ({ matricula_colaborador: c.matricula, nome_colaborador: c.nome_completo, emitido_por: usuarioAutenticado.nome, motivo: 'Emissão em Lote' }));
      await fetch(`${URL}/rest/v1/historico_impressoes`, { method: 'POST', headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(registros) });
      window.print();
    } catch (e) { mostrarToast("Falha ao registar histórico.", "erro"); }
  };

  // ========================== ABA: EMISSÃO INDIVIDUAL & SOLICITAÇÃO ==========================
  const [colaborador, setColaborador] = useState<any>(null);
  const [buscaEmissao, setBuscaEmissao] = useState('');
  const [carregandoEmissao, setCarregandoEmissao] = useState(false);
  const [cameraAtiva, setCameraAtiva] = useState(false);
  const [cameraTraseira, setCameraTraseira] = useState(true);
  const [fotoCapturada, setFotoCapturada] = useState<string | null>(null);
  const [rawFoto, setRawFoto] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1); const [panX, setPanX] = useState(0); const [panY, setPanY] = useState(0); const [clarear, setClarear] = useState(false);
  const [salvandoFoto, setSalvandoFoto] = useState(false);
  const [nomeCrachaIndividual, setNomeCrachaIndividual] = useState(''); 
  const [motivoAcao, setMotivoAcao] = useState('1ª Via'); 
  const videoRef = useRef<HTMLVideoElement>(null);
  const fotoAlterada = fotoCapturada && fotoCapturada !== colaborador?.foto_url;

  const buscarColaboradorParaEmissao = async (matriculaAlvo: string) => {
    setRawFoto(null); setCarregandoEmissao(true); setBuscaEmissao(matriculaAlvo);
    try {
      const response = await fetch(`${URL}/rest/v1/colaboradores?matricula=eq.${matriculaAlvo}&select=*`, { headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` } });
      const data = await response.json();
      if (data && data.length > 0) { 
        setColaborador(data[0]); setFotoCapturada(data[0].foto_url || null); setNomeCrachaIndividual(obterOpcoesNome(data[0].nome_completo)[0]); setAbaAtiva('emissao'); setBuscaEmissao('');
      } else { setColaborador(null); mostrarToast('Matrícula não encontrada.', "erro"); }
    } catch (error) { mostrarToast('Erro de ligação.', "erro"); } finally { setCarregandoEmissao(false); }
  };

  const ligarCameraMobile = async (usarTraseira: boolean) => {
    if (videoRef.current && videoRef.current.srcObject) { const stream = videoRef.current.srcObject as MediaStream; stream.getTracks().forEach(track => track.stop()); }
    setCameraAtiva(true); setRawFoto(null);
    try { const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 600, height: 600, facingMode: usarTraseira ? 'environment' : 'user' } }); if (videoRef.current) videoRef.current.srcObject = stream; 
    } catch (err) { mostrarToast("Permissão negada ou câmara indisponível.", "erro"); setCameraAtiva(false); }
  };
  const alternarCamera = () => { const novaDirecao = !cameraTraseira; setCameraTraseira(novaDirecao); if (cameraAtiva) ligarCameraMobile(novaDirecao); };
  const tirarFoto = () => {
    if (videoRef.current) { const canvas = document.createElement('canvas'); canvas.width = 600; canvas.height = 600; const ctx = canvas.getContext('2d'); if (ctx) { ctx.drawImage(videoRef.current, 0, 0, 600, 600); setRawFoto(canvas.toDataURL('image/jpeg', 1.0)); const stream = videoRef.current.srcObject as MediaStream; stream.getTracks().forEach(track => track.stop()); setCameraAtiva(false); } }
  };
  const handleUploadFoto = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files[0]) { const reader = new FileReader(); reader.onload = (event) => { if (event.target?.result) setRawFoto(event.target.result as string); }; reader.readAsDataURL(e.target.files[0]); } };
  const aplicarRecorte = () => {
    const canvas = document.createElement('canvas'); canvas.width = 260; canvas.height = 350; const ctx = canvas.getContext('2d'); if (!ctx) return; const img = new Image(); img.src = rawFoto as string;
    img.onload = () => {
      if (clarear) ctx.filter = 'brightness(1.25) contrast(1.15)'; ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2; const cy = canvas.height / 2; const scaleFit = Math.max(canvas.width / img.width, canvas.height / img.height); const w = img.width * scaleFit; const h = img.height * scaleFit;
      ctx.translate(cx + panX, cy + panY); ctx.scale(zoom, zoom); ctx.drawImage(img, -w / 2, -h / 2, w, h);
      setFotoCapturada(canvas.toDataURL('image/jpeg', 0.95)); setRawFoto(null); setZoom(1); setPanX(0); setPanY(0); setClarear(false);
    };
  };
  const usarFotoOriginal = () => { setFotoCapturada(rawFoto); setRawFoto(null); };

  const salvarFotoNoSupabase = async () => {
    if (!fotoCapturada || !colaborador) return; setSalvandoFoto(true);
    try {
      await fetch(`${URL}/rest/v1/colaboradores?matricula=eq.${colaborador.matricula}`, { method: 'PATCH', headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' }, body: JSON.stringify({ foto_url: fotoCapturada }) });
      setColaborador({ ...colaborador, foto_url: fotoCapturada }); setListaLote(prev => prev.map(c => c.matricula === colaborador.matricula ? { ...c, foto_url: fotoCapturada } : c)); mostrarToast('Fotografia salva com sucesso!', "sucesso");
    } catch (err) { mostrarToast('Erro ao guardar foto.', "erro"); } finally { setSalvandoFoto(false); }
  };

  const registrarEImprimir = async () => {
    if (!colaborador) return;
    try {
      await fetch(`${URL}/rest/v1/historico_impressoes`, { method: 'POST', headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ matricula_colaborador: colaborador.matricula, nome_colaborador: colaborador.nome_completo, emitido_por: usuarioAutenticado.nome, motivo: motivoAcao }) });
      mostrarToast('Impressão auditada e registada.', 'sucesso');
      setTimeout(() => window.print(), 500);
    } catch (e) { mostrarToast("Falha na auditoria.", "erro"); }
  };

  const enviarSolicitacaoAoRH = async () => {
    if (!colaborador) return;
    if (!fotoCapturada) { mostrarToast("É obrigatório ter fotografia para solicitar o crachá.", "aviso"); return; }
    try {
      await fetch(`${URL}/rest/v1/solicitacoes_crachas`, { method: 'POST', headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ matricula_colaborador: colaborador.matricula, nome_colaborador: colaborador.nome_completo, solicitado_por: usuarioAutenticado.nome, motivo: motivoAcao }) });
      mostrarToast('Solicitação enviada ao RH com sucesso!', 'sucesso');
      setColaborador(null); setBuscaEmissao('');
    } catch (e) { mostrarToast("Erro ao enviar solicitação.", "erro"); }
  };

  // ========================== ABA: CADASTRO MANUAL ==========================
  const [formCadastro, setFormCadastro] = useState({ matricula: '', nome_completo: '', cpf: '', rg: '', desc_funcao: '' });
  const [salvandoCadastro, setSalvandoCadastro] = useState(false);
  const handleCadastroManual = async (e: React.FormEvent) => {
    e.preventDefault(); if (!formCadastro.matricula || !formCadastro.nome_completo) { mostrarToast('Matrícula e Nome são obrigatórios.', 'erro'); return; }
    setSalvandoCadastro(true);
    try {
      const response = await fetch(`${URL}/rest/v1/colaboradores`, { method: 'POST', headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' }, body: JSON.stringify(formCadastro) });
      if (!response.ok) { if(response.status === 409) { throw new Error('Matrícula já cadastrada.'); } throw new Error('Erro ao cadastrar na base.'); }
      mostrarToast('Colaborador cadastrado!', 'sucesso'); setFormCadastro({ matricula: '', nome_completo: '', cpf: '', rg: '', desc_funcao: '' });
    } catch (err: any) { mostrarToast(err.message || 'Erro.', 'erro'); } finally { setSalvandoCadastro(false); }
  };

  // ========================== ABA: CONFIGURAÇÕES ==========================
  const [listaUsuarios, setListaUsuarios] = useState<any[]>([]);
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(false);
  const [formUsuario, setFormUsuario] = useState({ nome: '', login: '', senha: '', perfil: 'RH' });
  const [salvandoUsuario, setSalvandoUsuario] = useState(false);

  const carregarUsuarios = async () => {
    setCarregandoUsuarios(true);
    try { const response = await fetch(`${URL}/rest/v1/usuarios_sistema?select=*&order=created_at.desc`, { headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` } }); const data = await response.json(); setListaUsuarios(data || []);
    } catch (error) { mostrarToast("Erro ao carregar usuários", "erro"); } finally { setCarregandoUsuarios(false); }
  };
  useEffect(() => { if ((usuarioAutenticado?.perfil === 'ADM' || usuarioAutenticado?.perfil === 'RH') && abaAtiva === 'configuracoes') { carregarUsuarios(); } }, [abaAtiva, usuarioAutenticado]);

  const handleCriarUsuario = async (e: React.FormEvent) => {
    e.preventDefault(); if (!formUsuario.nome || !formUsuario.login || !formUsuario.senha) { mostrarToast('Preencha todos os campos.', 'erro'); return; }
    if (usuarioAutenticado?.perfil !== 'ADM' && formUsuario.perfil === 'ADM') { mostrarToast('Acesso Negado: Apenas Administradores podem criar novos Administradores.', 'erro'); return; }
    setSalvandoUsuario(true);
    try {
      const response = await fetch(`${URL}/rest/v1/usuarios_sistema`, { method: 'POST', headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' }, body: JSON.stringify(formUsuario) });
      if (!response.ok) { const errData = await response.json().catch(() => ({})); if(response.status === 409) throw new Error('Login já em uso.'); throw new Error(`Erro de sistema.`); }
      mostrarToast('Utilizador criado com sucesso!', 'sucesso'); setFormUsuario({ nome: '', login: '', senha: '', perfil: 'RH' }); carregarUsuarios();
    } catch (err: any) { mostrarToast(err.message, 'erro'); } finally { setSalvandoUsuario(false); }
  };
  
  const tentarExcluirUsuario = (id: string, login: string, perfilUsuarioAlvo: string) => {
    if(login === 'admin') { mostrarToast("O Administrador principal não pode ser excluído.", "erro"); return; }
    if(usuarioAutenticado?.perfil === 'RH' && perfilUsuarioAlvo === 'ADM') { mostrarToast("Acesso Negado: Perfil RH não exclui Administrador.", "erro"); return; }
    setConfirmDialog({ ativo: true, mensagem: `Deseja realmente excluir o acesso de ${login}?`, acao: async () => { try { await fetch(`${URL}/rest/v1/usuarios_sistema?id=eq.${id}`, { method: 'DELETE', headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` } }); carregarUsuarios(); mostrarToast("Acesso excluído.", "sucesso"); } catch (err) { mostrarToast("Erro ao excluir.", "erro"); } } });
  };
  
  const abrirModalSenha = () => { setMostrarModalSenha(true); setNovaSenha(''); setConfirmarSenha(''); setErroSenha(''); };
  
  const handleAlterarSenha = async (e: React.FormEvent) => {
    e.preventDefault(); setErroSenha(''); if (!novaSenha || !confirmarSenha) { setErroSenha('Preencha ambos os campos.'); return; } if (novaSenha !== confirmarSenha) { setErroSenha('As senhas não coincidem.'); return; } if (novaSenha.length < 4) { setErroSenha('Mínimo de 4 caracteres.'); return; }
    setSalvandoSenha(true);
    try {
      const response = await fetch(`${URL}/rest/v1/usuarios_sistema?id=eq.${usuarioAutenticado.id}`, { method: 'PATCH', headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' }, body: JSON.stringify({ senha: novaSenha }), });
      if (!response.ok) throw new Error('Erro ao alterar senha.');
      mostrarToast('Senha alterada com sucesso!', 'sucesso'); setMostrarModalSenha(false);
    } catch (err: any) { setErroSenha(err.message || 'Erro ao alterar senha.'); } finally { setSalvandoSenha(false); }
  };

  const colaboradoresParaImprimir = abaAtiva === 'lote' ? listaLote : (colaborador && abaAtiva === 'emissao' ? [{ ...colaborador, foto_url: fotoCapturada || colaborador.foto_url, nome_cracha_frente: nomeCrachaIndividual }] : []);
  const navegarPara = (id: string) => { setAbaAtiva(id); setMenuAberto(false); };
  const podeEditarFuncao = usuarioAutenticado?.perfil === 'ADM' || usuarioAutenticado?.perfil === 'RH';

  // ========================== TELA DE LOGIN ==========================
  if (!usuarioAutenticado) {
    return (
      <div className="flex h-screen bg-[#f4f7f6] font-sans items-center justify-center relative overflow-hidden">
        {toast.ativo && (<div className={`fixed top-8 left-1/2 transform -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-lg font-semibold text-sm flex items-center gap-3 animation-fade-in text-white hide-on-print ${toast.tipo === 'sucesso' ? 'bg-emerald-500' : toast.tipo === 'erro' ? 'bg-rose-500' : 'bg-amber-500'}`}><i className={`fas ${toast.tipo === 'sucesso' ? 'fa-check-circle' : toast.tipo === 'erro' ? 'fa-times-circle' : 'fa-exclamation-triangle'}`}></i> {toast.mensagem}</div>)}
        <div className="absolute top-0 left-0 w-full h-[40%] bg-[#023A58]"></div>
        <div className="z-10 w-full max-w-md px-4 sm:px-6">
          <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xl">
            <div className="p-8 flex flex-col items-center bg-white border-b border-slate-100">
              <img src="/logodinamobranca.png" alt="Dínamo" className="max-h-12 mb-5 object-contain filter" style={{ filter: 'brightness(0) saturate(100%) invert(14%) sepia(45%) saturate(3033%) hue-rotate(185deg) brightness(96%) contrast(101%)' }} />
              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[#023A58]">Portal Operacional</h2><p className="text-xs md:text-sm text-slate-500 mt-1 font-medium">Acesso restrito à gestão</p>
            </div>
            <form onSubmit={handleLogin} className="p-6 md:p-8 flex flex-col gap-5 bg-white">
              {erroLogin && (<div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-xl text-sm font-semibold flex items-center gap-2"><i className="fas fa-exclamation-circle text-lg"></i> <span>{erroLogin}</span></div>)}
              <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Usuário</label><div className="relative"><i className="fas fa-user absolute left-4 top-[14px] text-slate-400"></i><input type="text" value={loginInput} onChange={(e) => setLoginInput(e.target.value.toLowerCase().replace(/\s/g, ''))} placeholder="Login de acesso" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-[#023A58] font-medium text-slate-800 transition-all lowercase" /></div></div>
              <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Senha</label><div className="relative"><i className="fas fa-lock absolute left-4 top-[14px] text-slate-400"></i><input type="password" value={senhaInput} onChange={(e) => setSenhaInput(e.target.value)} placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-[#023A58] font-medium text-slate-800 transition-all" /></div></div>
              <div className="flex items-center justify-between mt-[-5px] mb-2 px-1"><label className="flex items-center gap-2 text-xs font-semibold text-slate-500 cursor-pointer hover:text-slate-700 transition-colors"><input type="checkbox" checked={lembrarLogin} onChange={(e) => setLembrarLogin(e.target.checked)} className="w-3.5 h-3.5 accent-[#023A58]" />Lembrar login</label><button type="button" onClick={handleEsqueceuSenha} className="text-xs font-bold text-[#023A58] hover:underline transition-colors">Esqueceu a senha?</button></div>
              <button type="submit" disabled={carregandoLogin} className="w-full bg-[#023A58] text-white font-semibold py-3.5 rounded-xl hover:bg-[#035B8B] transition-all flex justify-center items-center gap-2">{carregandoLogin ? <><i className="fas fa-spinner fa-spin text-lg"></i> Acessando...</> : 'Acessar Sistema'}</button>
            </form>
          </div>
          <div className="text-center mt-8 text-slate-500 text-xs font-medium">&copy; 2026 Dínamo Engenharia. Todos os direitos reservados.</div>
        </div>
      </div>
    );
  }

  // ========================== DASHBOARD PRINCIPAL ==========================
  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden screen-only relative">
      
      {toast.ativo && (<div className={`fixed top-8 left-1/2 transform -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-lg font-semibold text-sm flex items-center gap-3 animation-fade-in text-white hide-on-print ${toast.tipo === 'sucesso' ? 'bg-emerald-500' : toast.tipo === 'erro' ? 'bg-rose-500' : 'bg-amber-500'}`}><i className={`fas ${toast.tipo === 'sucesso' ? 'fa-check-circle' : toast.tipo === 'erro' ? 'fa-times-circle' : 'fa-exclamation-triangle'}`}></i> {toast.mensagem}</div>)}
      {confirmDialog.ativo && ( <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[90] flex items-center justify-center p-4 hide-on-print"><div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animation-fade-in"><div className="p-6 text-center"><div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl"><i className="fas fa-exclamation-triangle"></i></div><h3 className="text-lg font-bold text-slate-800 mb-2">Atenção</h3><p className="text-sm text-slate-500 font-medium">{confirmDialog.mensagem}</p></div><div className="flex border-t border-slate-100"><button onClick={() => setConfirmDialog({ ativo: false, mensagem: '', acao: () => {} })} className="flex-1 py-4 font-semibold text-slate-500 hover:bg-slate-50 transition-colors border-r border-slate-100">Cancelar</button><button onClick={() => { confirmDialog.acao(); setConfirmDialog({ ativo: false, mensagem: '', acao: () => {} }); }} className="flex-1 py-4 font-bold text-rose-500 hover:bg-rose-50 transition-colors">Sim, Excluir</button></div></div></div> )}
      {menuAberto && <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden transition-opacity hide-on-print" onClick={() => setMenuAberto(false)}></div>}

      <aside className={`${menuAberto ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:relative z-50 w-72 h-full flex flex-col transition-transform duration-300 ease-out hide-on-print border-r border-slate-200`} style={{ background: '#023A58' }}>
        <div className="h-20 flex items-center justify-between md:justify-center border-b border-white/10 px-6"><img src="/logodinamobranca.png" alt="Dínamo" className="max-h-10 object-contain drop-shadow-sm" /><button className="md:hidden text-white/70 hover:text-white text-xl" onClick={() => setMenuAberto(false)}><i className="fas fa-times"></i></button></div>
        <nav className="flex-1 overflow-y-auto py-8 px-4 space-y-2 custom-scrollbar">
          <div className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-4 px-4">Menu Principal</div>
          {menuItens.map((item) => ( <button key={item.id} onClick={() => navegarPara(item.id)} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm outline-none ${abaAtiva === item.id ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}><div className={`w-8 h-8 rounded-lg flex items-center justify-center ${abaAtiva === item.id ? 'text-[#0a84ff]' : 'text-slate-400'}`}><i className={`fas ${item.icone} text-center`}></i></div>{item.nome}</button> ))}
        </nav>
        <div className="p-4 border-t border-white/10"><button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 text-slate-300 hover:bg-rose-500 hover:text-white rounded-xl transition-colors font-medium text-sm"><i className="fas fa-sign-out-alt"></i> Encerrar Sessão</button></div>
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden print-main-adjust bg-slate-50">
        
        <header className="h-20 bg-white shadow-sm border-b border-slate-200 flex items-center justify-between px-6 lg:px-10 z-10 hide-on-print relative">
          <div className="flex items-center gap-4">
            <button className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors" onClick={() => setMenuAberto(true)}><i className="fas fa-bars"></i></button>
            <h2 className="text-lg md:text-xl font-bold text-[#023A58] hidden sm:flex items-center gap-2">{menuItens.find(m => m.id === abaAtiva)?.nome || 'Módulo Restrito'}</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 bg-white px-2 pr-4 py-1.5 rounded-full border border-slate-200 shadow-sm hidden sm:flex">
              <div className="w-9 h-9 rounded-full bg-[#023A58] flex items-center justify-center text-white font-bold text-xs uppercase">{usuarioAutenticado.nome.substring(0, 2)}</div>
              <div className="flex flex-col"><span className="text-sm font-semibold text-slate-700 leading-tight">{usuarioAutenticado.nome}</span><span className="text-[9px] font-bold uppercase tracking-widest text-[#0a84ff]">Perfil: {usuarioAutenticado.perfil}</span></div>
            </div>
            <button onClick={abrirModalSenha} className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors flex items-center justify-center" title="Alterar Senha"><i className="fas fa-key"></i></button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 custom-scrollbar print-padding-remove">

          {/* NOVA ABA: CAIXA DE SOLICITAÇÕES (RH/ADM) */}
          {abaAtiva === 'solicitacoes' && (
            <div className="max-w-full lg:max-w-7xl mx-auto hide-on-print flex flex-col h-full gap-6 animation-fade-in">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col flex-1 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h3 className="font-bold text-[#023A58] text-lg flex items-center gap-2"><i className="fas fa-inbox text-[#0a84ff]"></i> Pedidos Pendentes do Campo</h3>
                  <button onClick={carregarSolicitacoes} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 shadow-sm"><i className="fas fa-sync-alt mr-2"></i>Atualizar Caixa</button>
                </div>
                <div className="overflow-x-auto overflow-y-auto custom-scrollbar flex-1 p-4">
                  {listaSolicitacoes.length === 0 ? (
                    <div className="text-center py-20"><div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl"><i className="fas fa-check-double"></i></div><h3 className="text-lg font-bold text-slate-700">Tudo limpo!</h3><p className="text-slate-500">Nenhum pedido de crachá pendente.</p></div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {listaSolicitacoes.map((sol) => (
                        <div key={sol.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500 bg-amber-50 px-2 py-1 rounded">Pendente</span>
                            <span className="text-[10px] font-bold text-slate-400">{new Date(sol.data_solicitacao).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <h4 className="font-bold text-slate-800 text-base">{sol.nome_colaborador}</h4>
                          <p className="text-xs font-semibold text-[#0a84ff] mb-4">Matrícula: {sol.matricula_colaborador}</p>
                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
                            <div className="text-[10px] text-slate-500 font-bold uppercase">Motivo do Pedido</div>
                            <div className="text-sm font-semibold text-slate-700">{sol.motivo}</div>
                            <div className="text-[10px] text-slate-500 font-bold uppercase mt-2">Solicitado por</div>
                            <div className="text-xs font-semibold text-slate-700"><i className="fas fa-hard-hat text-amber-500 mr-1"></i> {sol.solicitado_por}</div>
                          </div>
                          <button onClick={() => processarSolicitacao(sol)} className="w-full bg-[#023A58] text-white font-semibold py-2.5 rounded-lg text-sm hover:bg-[#035B8B] transition-colors"><i className="fas fa-cog mr-1"></i> Processar & Imprimir</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ABA 1: BASE DE COLABORADORES */}
          {abaAtiva === 'colaboradores' && (
            <div className="max-w-full lg:max-w-7xl mx-auto hide-on-print flex flex-col h-full gap-6 animation-fade-in">
              <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-200">
                <form onSubmit={handlePesquisaTabela} className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 w-full"><label className="block text-sm font-semibold text-slate-700 mb-2">Pesquisa na Base</label><div className="relative"><i className="fas fa-search absolute left-4 top-[14px] text-slate-400"></i><input type="text" placeholder="Digite a Matrícula ou Nome..." value={buscaTabela} onChange={(e) => setBuscaTabela(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-[#023A58] transition-all" /></div></div>
                  <button type="submit" disabled={carregandoLista} className="w-full md:w-auto bg-[#023A58] text-white font-semibold px-8 py-3 rounded-xl hover:bg-[#035B8B] shadow-sm transition-all flex justify-center items-center gap-2">{carregandoLista ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-search"></i>} Localizar</button>
                </form>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col flex-1 overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center"><h3 className="font-semibold text-slate-800">Resultados {resultadosBusca.length > 0 && <span className="text-[#0a84ff] bg-blue-50 px-2 py-0.5 rounded text-xs ml-2">{resultadosBusca.length}</span>}</h3></div>
                <div className="overflow-x-auto overflow-y-auto custom-scrollbar flex-1">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200"><tr className="text-[11px] uppercase tracking-wider text-slate-500 font-bold"><th className="p-4 pl-6">Colaborador</th><th className="p-4">Matrícula</th><th className="p-4 text-center">Foto</th><th className="p-4 text-center">QR Code</th><th className="p-4 text-right pr-6">Ações</th></tr></thead>
                    <tbody className="text-sm">
                      {!pesquisaRealizada ? (<tr><td colSpan={5} className="p-16 text-center text-slate-400">Utilize a barra de pesquisa acima.</td></tr>) : resultadosBusca.length === 0 ? (<tr><td colSpan={5} className="p-16 text-center text-slate-400">Nenhum registo encontrado.</td></tr>) : (
                        resultadosBusca.map((colab) => (
                          <tr key={colab.matricula} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                            <td className="p-4 pl-6 font-semibold text-slate-800">{colab.nome_completo}</td><td className="p-4 font-semibold text-[#0a84ff]">{colab.matricula}</td>
                            <td className="p-4 text-center">{colab.foto_url ? <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-[10px] font-bold"><i className="fas fa-check"></i> SIM</span> : <span className="text-rose-500 bg-rose-50 px-2 py-1 rounded text-[10px] font-bold"><i className="fas fa-times"></i> NÃO</span>}</td>
                            <td className="p-4 text-center">{colab.link_qrcode ? <span className="text-[#0a84ff] bg-blue-50 px-2 py-1 rounded text-[10px] font-bold"><i className="fas fa-link"></i> OK</span> : <span className="text-slate-400 bg-slate-100 px-2 py-1 rounded text-[10px] font-bold">VAZIO</span>}</td>
                            <td className="p-4 text-right pr-6 flex justify-end gap-2">
                              {/* Botão de Histórico */}
                              <button onClick={() => abrirHistorico(colab.matricula, colab.nome_completo)} className="bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors" title="Ver Histórico de Impressões"><i className="fas fa-history"></i></button>
                              
                              <button onClick={() => { setBuscaEmissao(colab.matricula); buscarColaboradorParaEmissao(colab.matricula); }} className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors">Emitir</button>
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
            <div className="max-w-full lg:max-w-6xl mx-auto hide-on-print flex flex-col h-full gap-6 animation-fade-in">
              <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-200">
                <form onSubmit={adicionarAoLote} className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 w-full"><label className="block text-sm font-semibold text-slate-700 mb-2">Adicionar à Fila</label><input type="text" placeholder="Matrícula..." value={matriculaLote} onChange={(e) => setMatriculaLote(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#023A58] transition-all" /></div>
                  <button type="submit" disabled={carregandoLote} className="w-full md:w-auto bg-[#023A58] text-white font-semibold px-8 py-3 rounded-xl hover:bg-[#035B8B] shadow-sm transition-all flex justify-center items-center gap-2">{carregandoLote ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-plus"></i>} Adicionar</button>
                </form>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col flex-1 overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-semibold text-slate-800">Fila de Impressão ({listaLote.length})</h3>
                  <button onClick={registrarImpressoesEmLote} disabled={listaLote.length === 0} className={`font-semibold px-5 py-2 text-sm rounded-lg transition-all flex items-center gap-2 ${listaLote.length > 0 ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}><i className="fas fa-print"></i> Registrar & Imprimir</button>
                </div>
                <div className="overflow-x-auto overflow-y-auto custom-scrollbar flex-1">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200"><tr className="text-[11px] uppercase tracking-wider text-slate-500 font-bold"><th className="p-4 pl-6">Matrícula</th><th className="p-4">Nome de Guerra (Frente)</th><th className="p-4 text-center">Foto</th><th className="p-4 text-center">QR Code</th><th className="p-4 text-center">Ação</th></tr></thead>
                    <tbody className="text-sm">
                      {listaLote.length === 0 ? (<tr><td colSpan={5} className="p-16 text-center text-slate-400">Fila vazia.</td></tr>) : (
                        listaLote.map((colab) => (
                          <tr key={colab.matricula} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="p-4 pl-6 font-semibold text-[#0a84ff]">{colab.matricula}</td>
                            <td className="p-4">
                               <select value={colab.nome_cracha_frente} onChange={(e) => atualizarNomeLote(colab.matricula, e.target.value)} className="w-full max-w-[200px] bg-slate-100 border border-slate-200 rounded-lg p-2 focus:border-[#0a84ff] focus:outline-none font-bold text-[#023A58] uppercase text-xs cursor-pointer">
                                  {obterOpcoesNome(colab.nome_completo).map((opcao, idx) => ( <option key={idx} value={opcao}>{opcao}</option> ))}
                               </select>
                               <div className="mt-1">
                                 {!colab.foto_url && <span className="mr-2 text-[9px] bg-rose-500 text-white px-2 py-0.5 rounded uppercase font-bold tracking-widest shadow-sm">Sem Foto</span>}
                                 {!colab.link_qrcode && <span className="text-[9px] bg-amber-500 text-white px-2 py-0.5 rounded uppercase font-bold tracking-widest shadow-sm">Sem Link</span>}
                               </div>
                            </td>
                            <td className="p-4 text-center">{colab.foto_url ? <i className="fas fa-check text-emerald-500"></i> : <i className="fas fa-times text-rose-500"></i>}</td>
                            <td className="p-4 text-center">{colab.link_qrcode ? <i className="fas fa-link text-[#0a84ff] text-lg"></i> : <i className="fas fa-unlink text-slate-300 text-lg"></i>}</td>
                            <td className="p-4 text-center"><button onClick={() => removerDoLote(colab.matricula)} className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-colors"><i className="fas fa-trash-alt"></i></button></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ABA 3: EMISSÃO INDIVIDUAL OU SOLICITAÇÃO (INTELIGÊNCIA DE PERFIL) */}
          {abaAtiva === 'emissao' && (
            <div className="max-w-full lg:max-w-6xl mx-auto hide-on-print animation-fade-in">
              <form onSubmit={(e) => { e.preventDefault(); buscarColaboradorParaEmissao(buscaEmissao); }} className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full"><label className="block text-sm font-semibold text-slate-700 mb-2">Matrícula do Colaborador</label><input type="text" placeholder="Ex: 6294" value={buscaEmissao} onChange={(e) => setBuscaEmissao(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#023A58] transition-all font-bold text-[#0a84ff]" /></div>
                <button type="submit" disabled={carregandoEmissao} className="w-full md:w-auto bg-[#023A58] text-white font-semibold px-8 py-3 rounded-xl hover:bg-[#035B8B] shadow-sm transition-all"><i className="fas fa-search mr-2"></i>Buscar Ficha</button>
              </form>

              {colaborador && (
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="w-full lg:w-1/3 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center">
                    <h3 className="text-md font-bold text-slate-800 mb-4">Captura de Fotografia</h3>
                    {rawFoto ? (
                      <div className="flex flex-col items-center w-full">
                        <div className="relative w-48 h-64 bg-slate-900 overflow-hidden mb-4 rounded-xl" style={{ filter: clarear ? 'brightness(1.25) contrast(1.15)' : 'none' }}><img src={rawFoto} alt="Raw" style={{ transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`, transformOrigin: 'center', width: '100%', height: '100%', objectFit: 'cover' }} /></div>
                        <div className="w-full space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <div><label className="text-[10px] font-bold text-slate-500 uppercase">Zoom</label><input type="range" min="1" max="3" step="0.05" value={zoom} onChange={e => setZoom(Number(e.target.value))} className="w-full" /></div>
                          <div><label className="text-[10px] font-bold text-slate-500 uppercase">Esq/Dir</label><input type="range" min="-150" max="150" value={panX} onChange={e => setPanX(Number(e.target.value))} className="w-full" /></div>
                          <div><label className="text-[10px] font-bold text-slate-500 uppercase">Cima/Baixo</label><input type="range" min="-150" max="150" value={panY} onChange={e => setPanY(Number(e.target.value))} className="w-full" /></div>
                        </div>
                        <label className="flex items-center gap-2 mt-3 text-sm text-slate-600"><input type="checkbox" checked={clarear} onChange={e => setClarear(e.target.checked)} /> Clarear</label>
                        <div className="flex gap-2 w-full mt-3"><button onClick={usarFotoOriginal} className="flex-1 bg-slate-200 text-slate-700 font-semibold py-2 rounded-lg text-xs">Pular</button><button onClick={aplicarRecorte} className="flex-1 bg-emerald-500 text-white font-semibold py-2 rounded-lg text-xs">Cortar</button></div>
                      </div>
                    ) : (
                      <div className="w-full flex flex-col items-center">
                        <div className="w-48 h-64 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden relative flex items-center justify-center mb-4">{cameraAtiva ? <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" /> : fotoCapturada ? <img src={fotoCapturada} alt="Crachá" className="w-full h-full object-cover" /> : <i className="fas fa-user text-4xl text-slate-300"></i>}</div>
                        <div className="w-full flex flex-col gap-2">{cameraAtiva ? (<button onClick={tirarFoto} className="w-full bg-rose-500 text-white font-semibold py-2.5 rounded-xl text-sm"><i className="fas fa-camera mr-2"></i> Disparar</button>) : (<button onClick={() => ligarCameraMobile(cameraTraseira)} className="w-full bg-slate-800 text-white font-semibold py-2.5 rounded-xl text-sm"><i className="fas fa-camera mr-2"></i> Abrir Câmara</button>)}<label className="block w-full bg-white border border-slate-200 text-slate-600 text-center font-semibold py-2.5 rounded-xl cursor-pointer text-sm"><i className="fas fa-folder-open mr-2"></i> Arquivo <input type="file" accept="image/*" onChange={handleUploadFoto} className="hidden" /></label></div>
                        <button onClick={salvarFotoNoSupabase} disabled={!fotoAlterada || salvandoFoto} className={`w-full mt-4 font-semibold py-3 rounded-xl text-sm transition-colors shadow-sm ${fotoAlterada ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>Salvar Foto na Ficha</button>
                      </div>
                    )}
                  </div>

                  {/* LÓGICA DE TELAS: RH VÊ O CRACHÁ. SUPERVISOR VÊ O FORM DE SOLICITAÇÃO. */}
                  {usuarioAutenticado.perfil === 'SUPERVISOR' ? (
                    <div className="w-full lg:flex-1 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center">
                      <div className="w-20 h-20 bg-blue-50 text-[#0a84ff] rounded-full flex items-center justify-center mb-6 text-4xl"><i className="fas fa-paper-plane"></i></div>
                      <h3 className="text-xl font-bold text-[#023A58] mb-2">Solicitar Novo Crachá</h3>
                      <p className="text-slate-500 text-sm mb-8 max-w-md">A fotografia atualizada de <b>{colaborador.nome_completo}</b> será enviada ao RH junto com a sua solicitação de impressão.</p>
                      
                      <div className="w-full max-w-md text-left mb-6">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Motivo da Solicitação *</label>
                        <select value={motivoAcao} onChange={e => setMotivoAcao(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm font-bold text-[#023A58] focus:outline-none focus:border-[#0a84ff] cursor-pointer">
                          <option value="1ª Via">1ª Via (Novo Colaborador)</option>
                          <option value="Perda">Perda / Extravio</option>
                          <option value="Dano">Crachá Danificado</option>
                          <option value="Mudança de Função">Mudança de Função</option>
                        </select>
                      </div>

                      <button onClick={enviarSolicitacaoAoRH} className="w-full max-w-md bg-[#0a84ff] hover:bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all text-sm"><i className="fas fa-paper-plane mr-2"></i> Enviar Solicitação ao RH</button>
                    </div>
                  ) : (
                    <div className="w-full lg:flex-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <h3 className="text-md font-bold text-slate-800">Processo de Impressão</h3>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                           <select value={motivoAcao} onChange={e => setMotivoAcao(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-600 focus:outline-none focus:border-[#0a84ff] cursor-pointer">
                            <option value="1ª Via">1ª Via</option><option value="Perda">Perda</option><option value="Dano">Dano</option><option value="Mudança de Função">Nova Função</option>
                           </select>
                           <button onClick={registrarEImprimir} disabled={!fotoCapturada || !!rawFoto} className={`font-bold px-5 py-2.5 rounded-lg text-xs shadow-sm flex items-center gap-2 ${fotoCapturada && !rawFoto ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}><i className="fas fa-print"></i> Registrar e Imprimir</button>
                        </div>
                      </div>
                      
                      <div className="mb-6 bg-blue-50 border border-blue-100 p-4 rounded-xl">
                        <label className="block text-[11px] font-bold text-[#0a84ff] uppercase tracking-widest mb-2">Nome de Guerra (Frente)</label>
                        <select value={nomeCrachaIndividual} onChange={(e) => setNomeCrachaIndividual(e.target.value)} className="w-full bg-white border border-blue-200 rounded-lg p-3 text-sm font-bold text-[#023A58] focus:outline-none focus:border-[#0a84ff] uppercase shadow-sm cursor-pointer">
                          {obterOpcoesNome(colaborador.nome_completo).map((opcao, idx) => ( <option key={idx} value={opcao}>{opcao}</option> ))}
                        </select>
                      </div>

                      <div className="flex flex-col md:flex-row justify-center bg-slate-50 p-6 rounded-xl border border-slate-100 overflow-x-auto gap-6 flex-1">
                        {/* CARTÃO FRENTE */}
                        <div className="cracha-card w-[54mm] h-[86mm] bg-white relative flex flex-col items-center overflow-hidden box-border flex-shrink-0" style={{ border: '1px solid #ccc' }}>
                          <div className="mt-[4mm] w-[26mm] h-[35mm] flex items-center justify-center overflow-hidden z-10 border border-slate-300 bg-white">
                            {fotoCapturada ? <img src={fotoCapturada} className="w-full h-full object-cover" alt="Foto" /> : <div className="w-full h-full bg-white"></div>}
                          </div>
                          <div className="mt-[2mm] text-center z-10 w-full px-2">
                            <div className="text-[#051e42] font-black text-[18px] leading-[1.0]" style={{ fontFamily: 'Arial, sans-serif' }}>
                              {nomeCrachaIndividual.split(' ')[0]}<br/>{nomeCrachaIndividual.split(' ').slice(1).join(' ') || ''}
                            </div>
                          </div>
                          <div className="absolute bottom-0 left-0 w-full h-[32mm] z-0"><img src="/Imagem1.png" className="w-full h-full object-fill" alt="Fundo" /></div>
                          <div className="absolute bottom-[13mm] left-[1mm] z-10 w-[24mm] h-[8mm] flex items-center justify-start"><img src="/dinamo.png" className="max-h-full max-w-full object-contain" alt="Dínamo" /></div>
                        </div>
                        
                        {/* CARTÃO VERSO */}
                        <div className="cracha-card w-[54mm] h-[86mm] bg-white relative p-[2mm] flex flex-col box-border flex-shrink-0" style={{ border: '1px solid #ccc' }}>
                          <div className="mt-[2mm] w-full flex flex-col gap-[2mm]">
                            <div className="relative border-[1.5px] border-black rounded-[4px] h-[8mm] flex items-center justify-center w-full"><span className="absolute -top-[2.5mm] left-[2mm] bg-white px-[1mm] text-[6px] font-bold text-black leading-none">Nome</span><div className="text-[7.5px] text-black font-semibold uppercase pt-[0.5mm]">{colaborador.nome_completo}</div></div>
                            <div className="flex w-full gap-[2mm]">
                              <div className="relative border-[1.5px] border-black rounded-[4px] h-[8mm] flex-1 flex items-center justify-center"><span className="absolute -top-[2.5mm] left-[2mm] bg-white px-[1mm] text-[6px] font-bold text-black leading-none">CPF</span><div className="text-[8px] text-black font-semibold uppercase pt-[0.5mm]">{colaborador.cpf || '000.000.000-00'}</div></div>
                              <div className="relative border-[1.5px] border-black rounded-[4px] h-[8mm] w-[14mm] flex items-center justify-center bg-white"><span className="absolute -top-[2.5mm] left-[1mm] bg-white px-[0.5mm] text-[5px] font-bold text-black leading-none">Tp. Sangue</span><div className="text-[8px] text-black font-black uppercase pt-[0.5mm]">{colaborador.tipo_sanguineo || ''}</div></div>
                            </div>
                            <div className="flex w-full gap-[2mm] items-stretch">
                               <div className="flex flex-col flex-1 justify-between gap-[2mm]">
                                  <div className="relative border-[1.5px] border-black rounded-[4px] h-[8mm] flex items-center justify-center w-full"><span className="absolute -top-[2.5mm] left-[2mm] bg-white px-[1mm] text-[6px] font-bold text-black leading-none">Função</span><div className="text-[7px] text-black font-semibold uppercase truncate px-1 pt-[0.5mm]">{colaborador.desc_funcao}</div></div>
                                  <div className="relative border-[1.5px] border-black rounded-[4px] h-[8mm] flex items-center justify-center w-full"><span className="absolute -top-[2.5mm] left-[2mm] bg-white px-[1mm] text-[6px] font-bold text-black leading-none">Car. Identidade</span><div className="text-[8px] text-black font-semibold uppercase pt-[0.5mm]">{colaborador.rg || '0000000000'}</div></div>
                                  <div className="relative border-[1.5px] border-black rounded-[4px] h-[8mm] flex items-center justify-center w-full"><span className="absolute -top-[2.5mm] left-[2mm] bg-white px-[1mm] text-[6px] font-bold text-black leading-none">Matrícula</span><div className="text-[8px] text-black font-semibold uppercase pt-[0.5mm]">{String(colaborador.matricula).padStart(8, '0')}</div></div>
                               </div>
                               <div className="w-[21.5mm] flex-shrink-0 flex items-center justify-center border border-slate-200 p-[0.5mm] bg-white rounded-sm z-10">
                                 {colaborador.link_qrcode ? <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(colaborador.link_qrcode)}`} className="w-full h-full object-contain" alt="QR Code" /> : <div className="w-full h-full bg-white"></div>}
                               </div>
                            </div>
                            <div className="relative border-[1.5px] border-black rounded-[4px] h-[6.5mm] flex items-center justify-center w-full"><span className="absolute -top-[2.5mm] left-[2mm] bg-white px-[1mm] text-[6px] font-bold text-black leading-none">Empresa</span><div className="text-[8px] text-black font-semibold uppercase pt-[0.5mm]">DINAMO ENGENHARIA</div></div>
                          </div>
                          <div className="absolute bottom-[1.5mm] left-[2mm] right-[2mm] z-0 flex flex-col items-center">
                            <div className="text-[7px] text-black leading-[1.2] mb-[1.5mm] text-center font-medium w-[47mm]">Em caso de extravio/perda, favor comunicar ao<br/>Departamento Pessoal.</div>
                            <div className="text-center w-full mb-[1mm]"><div className="text-[7.5px] font-bold text-black mb-[0.5mm]">www.dinamo.srv.br</div><div className="text-[6px] text-black">Pass Xingu, Coqueiro| Belém-PA |CEP 66823-335</div></div>
                            <div className="text-[5.5px] text-black font-bold text-right w-full">Emitido em: {obterDataHoraAtual()}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ABA 4: CADASTRO MANUAL */}
          {abaAtiva === 'cadastro' && (usuarioAutenticado.perfil === 'ADM' || usuarioAutenticado.perfil === 'RH') && (
            <div className="max-w-4xl mx-auto hide-on-print animation-fade-in">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
                <div className="p-6 border-b border-slate-100"><h3 className="font-bold text-slate-800 text-lg">Cadastro Manual</h3></div>
                <form onSubmit={handleCadastroManual} className="p-6 flex flex-col gap-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-xs font-semibold text-slate-500 mb-1">Matrícula *</label><input type="text" required value={formCadastro.matricula} onChange={e => setFormCadastro({...formCadastro, matricula: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-[#023A58]" /></div>
                    <div><label className="block text-xs font-semibold text-slate-500 mb-1">Nome Completo *</label><input type="text" required value={formCadastro.nome_completo} onChange={e => setFormCadastro({...formCadastro, nome_completo: e.target.value.toUpperCase()})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-[#023A58]" /></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><label className="block text-xs font-semibold text-slate-500 mb-1">CPF</label><input type="text" value={formCadastro.cpf} onChange={e => setFormCadastro({...formCadastro, cpf: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-[#023A58]" /></div>
                    <div><label className="block text-xs font-semibold text-slate-500 mb-1">RG</label><input type="text" value={formCadastro.rg} onChange={e => setFormCadastro({...formCadastro, rg: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-[#023A58]" /></div>
                    <div><label className="block text-xs font-semibold text-slate-500 mb-1">Cargo</label><input type="text" value={formCadastro.desc_funcao} onChange={e => setFormCadastro({...formCadastro, desc_funcao: e.target.value.toUpperCase()})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-[#023A58]" /></div>
                  </div>
                  <button type="submit" disabled={salvandoCadastro} className="mt-4 w-full md:w-auto self-end bg-emerald-500 text-white font-semibold py-3 px-8 rounded-xl hover:bg-emerald-600 transition-colors">Cadastrar Colaborador</button>
                </form>
              </div>
            </div>
          )}

          {/* ABA 5: GESTÃO DE ACESSOS */}
          {abaAtiva === 'configuracoes' && (
            <div className="max-w-full lg:max-w-6xl mx-auto hide-on-print animation-fade-in">
              {(usuarioAutenticado?.perfil !== 'ADM' && usuarioAutenticado?.perfil !== 'RH') ? (
                 <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center"><h2 className="text-xl font-bold text-slate-800">Acesso Restrito</h2></div>
              ) : (
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="w-full lg:w-1/3 bg-white rounded-2xl shadow-sm border border-slate-200 h-fit">
                    <div className="p-5 border-b border-slate-100"><h3 className="font-bold text-slate-800">Novo Acesso</h3></div>
                    <form onSubmit={handleCriarUsuario} className="p-5 flex flex-col gap-4">
                      <div><label className="text-xs font-semibold text-slate-500 block mb-1">Nome</label><input type="text" required value={formUsuario.nome} onChange={e => setFormUsuario({...formUsuario, nome: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#023A58]" /></div>
                      <div><label className="text-xs font-semibold text-slate-500 block mb-1">Login</label><input type="text" required value={formUsuario.login} onChange={e => setFormUsuario({...formUsuario, login: e.target.value.toLowerCase().replace(/\s/g, '')})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#023A58]" /></div>
                      <div><label className="text-xs font-semibold text-slate-500 block mb-1">Senha</label><input type="password" required value={formUsuario.senha} onChange={e => setFormUsuario({...formUsuario, senha: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#023A58]" /></div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500 block mb-1">Perfil</label>
                        <select value={formUsuario.perfil} onChange={e => setFormUsuario({...formUsuario, perfil: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#023A58]">
                           <option value="SUPERVISOR">Supervisor (Operação)</option>
                           <option value="RH">RH</option>
                           <option value="SESMT">SESMT</option>
                           {usuarioAutenticado?.perfil === 'ADM' && <option value="ADM">Administrador</option>}
                        </select>
                      </div>
                      <button type="submit" className="w-full bg-[#023A58] text-white font-semibold py-2.5 rounded-lg mt-2 hover:bg-[#035B8B] transition-colors">Criar Utilizador</button>
                    </form>
                  </div>
                  <div className="w-full lg:w-2/3 bg-white rounded-2xl shadow-sm border border-slate-200">
                    <div className="p-5 border-b border-slate-100"><h3 className="font-bold text-slate-800">Equipa Ativa</h3></div>
                    <div className="p-5 overflow-x-auto">
                      <table className="w-full text-left whitespace-nowrap">
                        <thead><tr className="text-xs text-slate-400 border-b border-slate-100"><th className="pb-2 pr-4">Nome</th><th className="pb-2 pr-4">Perfil</th><th className="pb-2 text-right">Ação</th></tr></thead>
                        <tbody className="text-sm">
                          {listaUsuarios.map((usr) => (
                            <tr key={usr.id} className="border-b border-slate-50"><td className="py-3 font-medium text-slate-700 pr-4">{usr.nome}</td><td className="py-3 pr-4"><span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${usr.perfil === 'SUPERVISOR' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-600'}`}>{usr.perfil}</span></td><td className="py-3 text-right">{usr.login !== 'admin' && <button onClick={() => tentarExcluirUsuario(usr.id, usr.login, usr.perfil)} className="text-rose-500 text-xs hover:text-rose-700 font-bold transition-colors"><i className="fas fa-trash-alt"></i> Excluir</button>}</td></tr>
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

        {/* ==================== MODAIS FLUTUANTES ==================== */}

        {/* MODAL EDIÇÃO COLABORADOR */}
        {colaboradorEditando && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 hide-on-print">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animation-fade-in">
              <div className="p-5 border-b border-slate-100 flex justify-between"><h3 className="font-bold text-slate-800">Editar Complementos</h3><button onClick={() => setColaboradorEditando(null)}><i className="fas fa-times text-slate-400 hover:text-rose-500 transition-colors"></i></button></div>
              <form onSubmit={salvarEdicao} className="p-6 flex flex-col gap-4 bg-slate-50/50">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="text-xs font-semibold text-slate-500 block mb-1">Matrícula</label><input disabled value={colaboradorEditando.matricula} className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 text-sm text-slate-500 cursor-not-allowed" /></div>
                  <div><label className="text-xs font-semibold text-slate-500 block mb-1">Nome Completo</label><input disabled value={colaboradorEditando.nome_completo} className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 text-sm text-slate-500 cursor-not-allowed" /></div>
                </div>
                <div className="w-full mt-2">
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Função / Cargo {podeEditarFuncao && <span className="text-orange-500 ml-1">(Editável) <i className="fas fa-pencil-alt"></i></span>}</label>
                  <input type="text" disabled={!podeEditarFuncao} value={colaboradorEditando.desc_funcao || ''} onChange={e => setColaboradorEditando({...colaboradorEditando, desc_funcao: e.target.value.toUpperCase()})} className={`w-full border border-slate-200 rounded-xl p-3 text-sm uppercase focus:border-[#023A58] focus:outline-none transition-all ${podeEditarFuncao ? 'bg-white shadow-sm' : 'bg-slate-100 text-slate-500 cursor-not-allowed'}`} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  <div><label className="text-xs font-semibold text-slate-800 block mb-1">Tipo Sanguíneo</label><input type="text" value={colaboradorEditando.tipo_sanguineo || ''} onChange={e => setColaboradorEditando({...colaboradorEditando, tipo_sanguineo: e.target.value})} className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm uppercase focus:border-[#023A58] focus:outline-none shadow-sm" placeholder="O+" /></div>
                  <div><label className="text-xs font-semibold text-[#0a84ff] block mb-1">Link QR Code</label><input type="url" value={colaboradorEditando.link_qrcode || ''} onChange={e => setColaboradorEditando({...colaboradorEditando, link_qrcode: e.target.value})} className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm focus:border-[#0a84ff] focus:outline-none shadow-sm" placeholder="https://" /></div>
                </div>
                <div className="flex justify-end gap-3 mt-4"><button type="button" onClick={() => setColaboradorEditando(null)} className="px-6 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancelar</button><button type="submit" disabled={salvandoEdicao} className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 rounded-xl text-sm font-semibold text-white transition-colors">Atualizar</button></div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL HISTÓRICO DE IMPRESSÕES */}
        {historicoAberto && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[80] flex items-center justify-center p-4 hide-on-print">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animation-fade-in flex flex-col max-h-[80vh]">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><i className="fas fa-history text-[#0a84ff]"></i> Auditoria de Impressões</h3>
                  <p className="text-xs font-semibold text-slate-500 mt-1">{nomeHistoricoAberto}</p>
                </div>
                <button onClick={() => setHistoricoAberto(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-rose-100 hover:text-rose-600 transition-colors"><i className="fas fa-times"></i></button>
              </div>
              <div className="p-0 overflow-y-auto custom-scrollbar flex-1 bg-white">
                {historicoAberto.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 font-medium">Nenhum crachá impresso para este colaborador até o momento.</div>
                ) : (
                  <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-slate-50 sticky top-0 border-b border-slate-100">
                      <tr className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                        <th className="p-4 pl-6">Data e Hora</th>
                        <th className="p-4">Motivo</th>
                        <th className="p-4">Emitido por</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {historicoAberto.map((hist, idx) => (
                        <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                          <td className="p-4 pl-6 font-semibold text-slate-700">{new Date(hist.data_emissao).toLocaleString('pt-BR')}</td>
                          <td className="p-4"><span className="bg-blue-50 text-[#0a84ff] px-2 py-1 rounded text-xs font-bold">{hist.motivo}</span></td>
                          <td className="p-4 font-medium text-slate-600"><i className="fas fa-user-circle mr-1 text-slate-400"></i> {hist.emitido_por}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL ALTERAR SENHA */}
        {mostrarModalSenha && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 hide-on-print">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animation-fade-in border-t-4 border-[#0a84ff]">
              <div className="p-5 border-b border-slate-100 flex justify-between"><h3 className="font-bold text-slate-800 flex items-center gap-2"><i className="fas fa-key text-[#0a84ff]"></i>Alterar Senha</h3><button onClick={() => setMostrarModalSenha(false)}><i className="fas fa-times text-slate-400 hover:text-rose-500"></i></button></div>
              <form onSubmit={handleAlterarSenha} className="p-6 flex flex-col gap-4">
                <div><label className="text-xs font-semibold text-slate-500 block mb-1">Nova Senha</label><input type="password" required value={novaSenha} onChange={e => setNovaSenha(e.target.value)} className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus:border-[#023A58]" placeholder="••••••••" /></div>
                <div><label className="text-xs font-semibold text-slate-500 block mb-1">Confirmar Senha</label><input type="password" required value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:outline-none focus:border-[#023A58]" placeholder="••••••••" /></div>
                <button type="submit" disabled={salvandoSenha} className="w-full bg-[#023A58] hover:bg-[#035B8B] text-white py-3 rounded-xl font-semibold mt-2 transition-colors">Alterar Senha</button>
              </form>
            </div>
          </div>
        )}

        {/* MOTOR DE IMPRESSÃO INVISÍVEL */}
        <div className="print-container">
           {colaboradoresParaImprimir.map((c, index) => {
             // Garante o nome correto na impressão em lote ou individual
             const nomeMostrar = c.nome_cracha_frente || obterOpcoesNome(c.nome_completo)[0];
             return (
             <React.Fragment key={index}>
                <div className="cracha-card w-[54mm] h-[86mm] bg-white relative flex flex-col items-center overflow-hidden box-border" style={{ border: '1px solid #ccc' }}>
                  <div className="mt-[4mm] w-[26mm] h-[35mm] flex items-center justify-center overflow-hidden z-10 border border-slate-300 bg-white">
                    {c.foto_url ? <img src={c.foto_url} className="w-full h-full object-cover" alt="Foto" /> : <div className="w-full h-full bg-white"></div>}
                  </div>
                  <div className="mt-[2mm] text-center z-10 w-full px-2">
                    <div className="text-[#051e42] font-black text-[18px] leading-[1.0]" style={{ fontFamily: 'Arial, sans-serif' }}>
                      {nomeMostrar.split(' ')[0]}<br/>{nomeMostrar.split(' ').slice(1).join(' ') || ''}
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 w-full h-[32mm] z-0"><img src="/Imagem1.png" className="w-full h-full object-fill" alt="Fundo" /></div>
                  <div className="absolute bottom-[13mm] left-[1mm] z-10 w-[24mm] h-[8mm] flex items-center justify-start"><img src="/dinamo.png" className="max-h-full max-w-full object-contain" alt="Dínamo" /></div>
                </div>

                <div className="cracha-card w-[54mm] h-[86mm] bg-white relative p-[2mm] flex flex-col box-border" style={{ border: '1px solid #ccc' }}>
                  <div className="mt-[2mm] w-full flex flex-col gap-[2.5mm]">
                    <div className="relative border-[1.5px] border-black rounded-[4px] h-[8.5mm] flex items-center justify-center w-full"><span className="absolute -top-[2.5mm] left-[2mm] bg-white px-[1mm] text-[6px] font-bold text-black leading-none">Nome</span><div className="text-[7.5px] text-black font-semibold uppercase pt-[1mm]">{c.nome_completo}</div></div>
                    <div className="flex w-full gap-[2mm]">
                      <div className="relative border-[1.5px] border-black rounded-[4px] h-[8.5mm] flex-1 flex items-center justify-center"><span className="absolute -top-[2.5mm] left-[2mm] bg-white px-[1mm] text-[6px] font-bold text-black leading-none">CPF</span><div className="text-[8px] text-black font-semibold uppercase pt-[1mm]">{c.cpf || '000.000.000-00'}</div></div>
                      <div className="relative border-[1.5px] border-black rounded-[4px] h-[8.5mm] w-[14mm] flex items-center justify-center bg-white"><span className="absolute -top-[2.5mm] left-[1mm] bg-white px-[0.5mm] text-[5px] font-bold text-black leading-none">Tp. Sangue</span><div className="text-[8px] text-black font-black uppercase pt-[1mm]">{c.tipo_sanguineo || ''}</div></div>
                    </div>
                    <div className="flex w-full gap-[2mm] items-stretch">
                        <div className="flex flex-col flex-1 justify-between gap-[2.5mm]">
                          <div className="relative border-[1.5px] border-black rounded-[4px] h-[8.5mm] flex items-center justify-center w-full"><span className="absolute -top-[2.5mm] left-[2mm] bg-white px-[1mm] text-[6px] font-bold text-black leading-none">Função</span><div className="text-[7px] text-black font-semibold uppercase truncate px-1 pt-[1mm]">{c.desc_funcao}</div></div>
                          <div className="relative border-[1.5px] border-black rounded-[4px] h-[8.5mm] flex items-center justify-center w-full"><span className="absolute -top-[2.5mm] left-[2mm] bg-white px-[1mm] text-[6px] font-bold text-black leading-none">Car. Identidade</span><div className="text-[8px] text-black font-semibold uppercase pt-[1mm]">{c.rg || '0000000000'}</div></div>
                          <div className="relative border-[1.5px] border-black rounded-[4px] h-[8.5mm] flex items-center justify-center w-full"><span className="absolute -top-[2.5mm] left-[2mm] bg-white px-[1mm] text-[6px] font-bold text-black leading-none">Matrícula</span><div className="text-[8px] text-black font-semibold uppercase pt-[1mm]">{String(c.matricula).padStart(8, '0')}</div></div>
                        </div>
                        <div className="w-[21.5mm] flex-shrink-0 flex items-center justify-center border border-slate-200 p-[0.5mm] bg-white rounded-sm z-10">
                          {c.link_qrcode ? <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(c.link_qrcode)}`} className="w-full h-full object-contain" alt="QR Code" /> : <div className="w-full h-full bg-white"></div>}
                        </div>
                    </div>
                    <div className="relative border-[1.5px] border-black rounded-[4px] h-[6.5mm] flex items-center justify-center w-full"><span className="absolute -top-[2.5mm] left-[2mm] bg-white px-[1mm] text-[6px] font-bold text-black leading-none">Empresa</span><div className="text-[8px] text-black font-semibold uppercase pt-[1mm]">DINAMO ENGENHARIA</div></div>
                  </div>
                  <div className="absolute bottom-[1.5mm] left-[2mm] right-[2mm] z-0 flex flex-col items-center pb-[1mm]">
                    <div className="text-[7px] text-black leading-[1.2] mb-[1.5mm] text-center font-medium w-[47mm]">Em caso de extravio/perda, favor comunicar ao<br/>Departamento Pessoal.</div>
                    <div className="text-center w-full mb-[1mm]"><div className="text-[7.5px] font-bold text-black mb-[0.5mm]">www.dinamo.srv.br</div><div className="text-[6px] text-black">Pass Xingu, Coqueiro| Belém-PA |CEP 66823-335</div></div>
                    <div className="text-[5.5px] text-black font-bold text-right w-full mt-[1mm]">Emitido em: {obterDataHoraAtual()}</div>
                  </div>
                </div>
             </React.Fragment>
             );
           })}
        </div>
      </main>

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

        @media screen {
          .print-container { display: none !important; }
        }

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
