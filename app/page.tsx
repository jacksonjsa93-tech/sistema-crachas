"use client";

import React, { useState, useRef } from 'react';

export default function PainelRH() {
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

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8 font-sans screen-only">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 border-b border-slate-700 pb-4">
          <h1 className="text-3xl font-bold text-sky-400">SGSO Premium — Emissão</h1>
          <p className="text-slate-400 text-sm">Integração Smart-51 & Base de Dados</p>
        </header>

        <form onSubmit={handleBusca} className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg mb-8 flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-semibold mb-2 text-slate-300">Buscar Matrícula</label>
            <input type="text" placeholder="Ex: 6294" value={busca} onChange={(e) => setBusca(e.target.value)} className="w-full bg-slate-950 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-sky-500" />
          </div>
          <button type="submit" disabled={carregando} className="bg-sky-600 text-white font-bold px-8 py-3 rounded-lg transition-all" style={{ backgroundColor: '#023A58' }}>
            {carregando ? 'Buscando...' : 'Carregar'}
          </button>
        </form>

        {erro && <p className="text-red-400 mb-6 bg-red-950/50 p-4 rounded-lg border border-red-800">{erro}</p>}

        {colaborador && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col items-center">
              <h3 className="text-lg font-bold text-slate-300 mb-4 w-full border-b border-slate-700 pb-2">Controle da Foto</h3>
              <div className="w-48 h-64 bg-slate-950 border-2 border-dashed border-slate-600 rounded-lg overflow-hidden relative flex items-center justify-center mb-4">
                {cameraAtiva ? (
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                ) : fotoCapturada ? (
                  <img src={fotoCapturada} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-slate-500 text-xs text-center px-4">Sem foto.</span>
                )}
              </div>
              <div className="w-full space-y-2">
                {cameraAtiva ? (
                  <button onClick={tirarFoto} className="w-full bg-emerald-600 text-white font-bold py-2 rounded-lg">Capturar Foto</button>
                ) : (
                  <button onClick={ligarCamera} className="w-full bg-slate-700 text-white font-medium py-2 rounded-lg">📸 Ligar Webcam</button>
                )}
                <label className="block w-full bg-slate-700 text-center text-white font-medium py-2 rounded-lg cursor-pointer">
                  📤 Upload de Arquivo
                  <input type="file" accept="image/*" onChange={handleUploadFoto} className="hidden" />
                </label>
              </div>
            </div>

            <div className="xl:col-span-2 bg-slate-800 p-6 rounded-xl border border-slate-700">
              <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-2">
                <h3 className="text-lg font-bold text-slate-300">Visualização de Impressão (CR80)</h3>
                <button 
                  onClick={() => window.print()}
                  disabled={!fotoCapturada}
                  className={`font-bold px-6 py-2 rounded-lg transition-all ${fotoCapturada ? 'text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                  style={fotoCapturada ? { backgroundColor: '#023A58' } : {}}
                >
                  🖨️ Enviar para Smart-51
                </button>
              </div>

              <div className="flex flex-col md:flex-row gap-8 justify-center items-center bg-slate-900 p-8 rounded-lg overflow-x-auto print-container">
                
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

                  {/* LOGO DÍNAMO: Tamanho aumentado de w-[20mm] para w-[24mm] */}
                  <div className="absolute bottom-[13mm] left-[4mm] z-10 w-[24mm] h-[8mm] flex items-center justify-start">
                    <img src="/dinamo.png" className="max-h-full max-w-full object-contain" alt="Dínamo" />
                  </div>

                </div>

                {/* --- VERSO --- */}
                <div className="cracha-card w-[54mm] h-[86mm] bg-white relative flex flex-col box-border" style={{ padding: '2mm', border: '1px solid #ccc' }}>
                  
                  <div className="mt-[1mm] w-full relative z-10">
                    
                    <fieldset className="border-[1.5px] border-black rounded-[4px] px-[1mm] pb-[1mm] mb-[2mm] m-0 w-full">
                      <legend className="text-[6px] font-bold px-[1mm] ml-[1mm] text-black leading-none">Nome</legend>
                      <div className="text-[8px] text-black font-semibold uppercase leading-none">{colaborador.nome_completo}</div>
                    </fieldset>

                    <fieldset className="border-[1.5px] border-black rounded-[4px] px-[1mm] pb-[1mm] mb-[2mm] m-0 w-full">
                      <legend className="text-[6px] font-bold px-[1mm] ml-[1mm] text-black leading-none">CPF</legend>
                      <div className="text-[8px] text-black font-semibold uppercase leading-none">{colaborador.cpf || '000.000.000-00'}</div>
                    </fieldset>

                    {/* Caixas de 65% para deixar o lado direito livre para o QR Code */}
                    <fieldset className="border-[1.5px] border-black rounded-[4px] px-[1mm] pb-[1mm] mb-[2mm] m-0 w-[63%]">
                      <legend className="text-[6px] font-bold px-[1mm] ml-[1mm] text-black leading-none">Função</legend>
                      <div className="text-[7.5px] text-black font-semibold uppercase leading-none truncate">{colaborador.desc_funcao}</div>
                    </fieldset>

                    <fieldset className="border-[1.5px] border-black rounded-[4px] px-[1mm] pb-[1mm] mb-[2mm] m-0 w-[63%]">
                      <legend className="text-[6px] font-bold px-[1mm] ml-[1mm] text-black leading-none">Car. Identidade</legend>
                      <div className="text-[8px] text-black font-semibold uppercase leading-none">{colaborador.rg || '0000000000'}</div>
                    </fieldset>

                    <fieldset className="border-[1.5px] border-black rounded-[4px] px-[1mm] pb-[1mm] mb-[2mm] m-0 w-[63%]">
                      <legend className="text-[6px] font-bold px-[1mm] ml-[1mm] text-black leading-none">Matrícula</legend>
                      <div className="text-[8px] text-black font-semibold uppercase leading-none">{String(colaborador.matricula).padStart(8, '0')}</div>
                    </fieldset>

                    <fieldset className="border-[1.5px] border-black rounded-[4px] px-[1mm] pb-[1mm] mb-[2mm] m-0 w-[63%]">
                      <legend className="text-[6px] font-bold px-[1mm] ml-[1mm] text-black leading-none">Empresa</legend>
                      <div className="text-[8px] text-black font-semibold uppercase leading-none">DÍNAMO ENGENHARIA</div>
                    </fieldset>

                  </div>

                  {/* QR Code posicionado no alto (lado direito), alinhado com a Função */}
                  <div className="absolute right-[2mm] top-[22mm] bg-white border border-slate-300 p-[0.5mm] z-10 w-[15mm] h-[15mm]">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://sgso.dinamo.srv.br/colaborador/${colaborador.matricula}`} 
                      className="w-full h-full object-contain"
                      alt="QR Code"
                    />
                  </div>

                  {/* Texto do rodapé livre para ocupar toda a largura e com texto atualizado/maior */}
                  <div className="absolute bottom-[2mm] left-[2mm] w-[50mm] z-0">
                    <div className="text-[6px] text-black leading-[1.2] mb-[2.5mm] text-justify font-medium">
                      Este crachá é de uso pessoal e intransferível. O colaborador terceiro deverá usá-lo obrigatoriamente nas dependências do Grupo Equatorial Energia ou fora dela a seu serviço. Em caso de perda, por favor comunicar imediatamente o departamento pessoal ao setor de Segurança Empresarial.
                    </div>
                    <div className="text-center w-full">
                      <div className="text-[6px] font-bold text-black">www.dinamo.srv.br</div>
                      <div className="text-[5.5px] text-black">Pass Xingu, Coqueiro| Belém-PA |CEP 66823-335</div>
                      <div className="text-[5.5px] text-black font-bold text-right mt-1">
                        Emitido em: {new Date().toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
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
          }

          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 54mm;
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
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
