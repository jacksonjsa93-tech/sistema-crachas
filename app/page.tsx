"use client";

import React, { useState, useRef } from 'react';

export default function PainelRH() {
  const [busca, setBusca] = useState('');
  const [colaborador, setColaborador] = useState<any>(null);
  const [erro, setErro] = useState('');
  const [cameraAtiva, setCameraAtiva] = useState(false);
  const [fotoCapturada, setFotoCapturada] = useState<string | null>(null);
  const [motivo, setMotivo] = useState('1ª Via');
  const [carregando, setCarregando] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Busca direto no seu Banco de Dados Supabase
  const handleBusca = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    
    try {
const URL = "https://dpndtwtvkaxrxrkyeyw.supabase.co";
const KEY = "sb_publishable_6Ss9lNdcbyeE2o3U5jcJ7w_qI61wmIr";

      const response = await fetch(`${URL}/rest/v1/colaboradores?matricula=eq.${busca}&select=*`, {
        headers: {
          'apikey': KEY || '',
          'Authorization': `Bearer ${KEY}`
        }
      });

      const data = await response.json();

      if (data && data.length > 0) {
        setColaborador(data[0]);
        setFotoCapturada(data[0].foto_url || null);
      } else {
        setColaborador(null);
        setErro('Matrícula não encontrada no sistema. Verifique a planilha.');
      }
    } catch (error) {
      setErro('Erro ao conectar com o banco de dados.');
    } finally {
      setCarregando(false);
    }
  };

  // Ligar a Câmera
  const ligarCamera = async () => {
    setCameraAtiva(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 400 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert("Erro ao acessar a câmera. Verifique as permissões do navegador.");
      setCameraAtiva(false);
    }
  };

  // Bater a Foto
  const tirarFoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, 400, 400);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setFotoCapturada(dataUrl);
        
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        setCameraAtiva(false);
      }
    }
  };

  // Upload manual
  const handleUploadFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) setFotoCapturada(event.target.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8 font-sans screen-only">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 border-b border-slate-700 pb-4">
          <h1 className="text-3xl font-bold text-sky-400">SGSO Premium — Emissão de Crachás</h1>
          <p className="text-slate-400 text-sm">Integração Smart-51 & Base de Colaboradores</p>
        </header>

        {/* Busca */}
        <form onSubmit={handleBusca} className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg mb-8 flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-semibold mb-2 text-slate-300">Buscar Matrícula (Ex: 6294)</label>
            <input 
              type="text" 
              placeholder="Digite a matrícula..." 
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full bg-slate-950 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-sky-500"
            />
          </div>
          <button type="submit" disabled={carregando} className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-8 py-3 rounded-lg transition-all">
            {carregando ? 'Buscando...' : 'Carregar Colaborador'}
          </button>
        </form>

        {erro && <p className="text-red-400 mb-6 bg-red-950/50 p-4 rounded-lg border border-red-800">{erro}</p>}

        {colaborador && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Controle da Imagem */}
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col items-center">
              <h3 className="text-lg font-bold text-slate-300 mb-4 w-full border-b border-slate-700 pb-2">Controle da Foto</h3>
              <div className="w-56 h-56 bg-slate-950 border-2 border-dashed border-slate-600 rounded-lg overflow-hidden relative flex items-center justify-center mb-4">
                {cameraAtiva ? (
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                ) : fotoCapturada ? (
                  <img src={fotoCapturada} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-slate-500 text-xs text-center px-4">Sem foto cadastrada.<br/>Tire uma foto ou faça upload.</span>
                )}
              </div>
              <div className="w-full space-y-2">
                {cameraAtiva ? (
                  <button onClick={tirarFoto} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg">Capturar Foto</button>
                ) : (
                  <button onClick={ligarCamera} className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 rounded-lg">📸 Ligar Webcam</button>
                )}
                <label className="block w-full bg-slate-700 hover:bg-slate-600 text-center text-white font-medium py-2 rounded-lg cursor-pointer">
                  📤 Upload Local
                  <input type="file" accept="image/*" onChange={handleUploadFoto} className="hidden" />
                </label>
              </div>
            </div>

            {/* Dados e Impressão */}
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-300 mb-4 w-full border-b border-slate-700 pb-2">Ficha do Colaborador</h3>
                <div className="space-y-3">
                  <p><span className="text-slate-400 text-xs block">Nome Completo:</span> <strong className="text-white text-lg">{colaborador.nome_completo}</strong></p>
                  <p><span className="text-slate-400 text-xs block">Cargo / Função:</span> <span className="text-slate-200">{colaborador.desc_funcao}</span></p>
                  <p><span className="text-slate-400 text-xs block">Matrícula:</span> <span className="text-slate-200">{colaborador.matricula}</span></p>
                </div>
                <div className="mt-6">
                  <label className="block text-sm font-semibold mb-2 text-slate-300">Motivo</label>
                  <select value={motivo} onChange={(e) => setMotivo(e.target.value)} className="w-full bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-white">
                    <option>1ª Via</option>
                    <option>Perda / Extravio</option>
                    <option>Atualização de Cargo</option>
                  </select>
                </div>
              </div>
              <button 
                onClick={() => window.print()}
                disabled={!fotoCapturada}
                className={`w-full font-bold py-4 rounded-lg mt-6 transition-all ${fotoCapturada ? 'bg-sky-600 hover:bg-sky-500 text-white cursor-pointer' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
              >
                🖨️ Imprimir na Smart-51
              </button>
            </div>

            {/* Preview Real do Crachá (Este é o que vai pra impressora) */}
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col items-center justify-center">
              <h3 className="text-lg font-bold text-slate-300 mb-4 w-full border-b border-slate-700 pb-2">Visualização do Cartão (CR80)</h3>
              
              <div id="printable-badge" className="w-[54mm] h-[86mm] bg-white border border-slate-300 rounded-[3mm] text-black flex flex-col p-4 relative overflow-hidden">
                <div className="text-center border-b border-slate-200 pb-2">
                  <div className="font-black text-xs tracking-wider text-slate-800">DÍNAMO ENGENHARIA</div>
                  <div className="text-[7px] text-slate-500 uppercase font-bold tracking-tight">Identificação</div>
                </div>
                <div className="flex justify-center my-2">
                  <div className="w-24 h-24 bg-slate-100 border border-slate-300 rounded-md overflow-hidden">
                    {fotoCapturada && <img src={fotoCapturada} className="w-full h-full object-cover" alt="Crachá" />}
                  </div>
                </div>
                <div className="text-center flex-1 flex flex-col justify-center">
                  <div className="font-bold text-[11px] leading-tight text-slate-900 uppercase">{colaborador.nome_completo}</div>
                  <div className="text-[9px] text-sky-700 font-bold mt-1">{colaborador.desc_funcao}</div>
                  <div className="text-[8px] text-slate-500 mt-1">MATRÍCULA: {colaborador.matricula}</div>
                </div>
                {/* QR Code gerado por API Pública externa baseado na URL da Vercel */}
                <div className="flex justify-center mt-2">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=https://seu-sistema.com/c/${colaborador.matricula}`} className="w-12 h-12 border border-slate-200 p-0.5 rounded" />
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      <style jsx global>{`
        @media print {
          body, html { background: white !important; margin: 0 !important; padding: 0 !important; }
          .screen-only { display: none !important; }
          #printable-badge {
            width: 54mm !important; height: 86mm !important;
            border: none !important; box-shadow: none !important;
            position: absolute !important; top: 0 !important; left: 0 !important;
            -webkit-print-color-adjust: exact; print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}
