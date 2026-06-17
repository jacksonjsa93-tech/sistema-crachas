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

  const handleBusca = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    
    try {
      const URL = "https://dpndtwutvkaxrxrkyeyw.supabase.co";
      const KEY = "sb_publishable_6Ss9lNdcbyeE2o3U5jcJ7w_qI61wmIr";

      const response = await fetch(`${URL}/rest/v1/colaboradores?matricula=eq.${busca}&select=*`, {
        headers: {
          'apikey': KEY,
          'Authorization': `Bearer ${KEY}`
        }
      });

      const data = await response.json();

      if (data && data.length > 0) {
        setColaborador(data[0]);
        setFotoCapturada(data[0].foto_url || null);
      } else {
        setColaborador(null);
        setErro('Matrícula não encontrada no sistema. Verifique a base.');
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
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
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

  // Pega Primeiro e Último Nome para a Frente do Crachá
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

        {/* Busca */}
        <form onSubmit={handleBusca} className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg mb-8 flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-semibold mb-2 text-slate-300">Buscar Matrícula</label>
            <input 
              type="text" placeholder="Ex: 6294" value={busca} onChange={(e) => setBusca(e.target.value)}
              className="w-full bg-slate-950 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-sky-500"
            />
          </div>
          <button type="submit" disabled={carregando} className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-8 py-3 rounded-lg transition-all">
            {carregando ? 'Buscando...' : 'Carregar'}
          </button>
        </form>

        {erro && <p className="text-red-400 mb-6 bg-red-950/50 p-4 rounded-lg border border-red-800">{erro}</p>}

        {colaborador && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* Controle de Foto */}
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col items-center">
              <h3 className="text-lg font-bold text-slate-300 mb-4 w-full border-b border-slate-700 pb-2">Captura de Imagem</h3>
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
                  <button onClick={tirarFoto} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg">Capturar Foto</button>
                ) : (
                  <button onClick={ligarCamera} className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 rounded-lg">📸 Ligar Webcam</button>
                )}
                <label className="block w-full bg-slate-700 hover:bg-slate-600 text-center text-white font-medium py-2 rounded-lg cursor-pointer">
                  📤 Upload de Arquivo
                  <input type="file" accept="image/*" onChange={handleUploadFoto} className="hidden" />
                </label>
              </div>
            </div>

            {/* Visualização de Impressão (Frente e Verso) */}
            <div className="xl:col-span-2 bg-slate-800 p-6 rounded-xl border border-slate-700">
              <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-2">
                <h3 className="text-lg font-bold text-slate-300">Layout Oficial Dínamo (CR80)</h3>
                <button 
                  onClick={() => window.print()}
                  disabled={!fotoCapturada}
                  className={`font-bold px-6 py-2 rounded-lg transition-all ${fotoCapturada ? 'bg-sky-600 hover:bg-sky-500 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                >
                  🖨️ Enviar para Smart-51
                </button>
              </div>

              <div className="flex flex-wrap gap-8 justify-center items-center bg-slate-900 p-8 rounded-lg overflow-x-auto print-container">
                
                {/* --- FRENTE DO CRACHÁ --- */}
                <div className="cracha-card w-[54mm] h-[86mm] bg-white relative flex flex-col items-center border border-slate-200">
                  <div className="mt-[6mm] w-[30mm] h-[40mm] flex items-center justify-center overflow-hidden z-10">
                    {fotoCapturada && <img src={fotoCapturada} className="w-full h-full object-cover rounded-md" alt="Foto" />}
                  </div>
                  
                  <div className="mt-3 text-center z-10 w-full px-2">
                    <div className="text-[#051e42] font-bold text-[18px] leading-[1.1]" style={{ fontFamily: 'Arial, sans-serif' }}>
                      {formatarNomeCurto(colaborador.nome_completo).split(' ')[0]}<br/>
                      {formatarNomeCurto(colaborador.nome_completo).split(' ')[1] || ''}
                    </div>
                  </div>

                  {/* Detalhe Curvo e A Serviço Da */}
                  <div className="absolute bottom-[23mm] w-full">
                    <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full h-[15px]">
                      <path d="M0,20 C50,0 100,20 100,20 L100,0 L0,0 Z" fill="transparent" stroke="#051e42" strokeWidth="1" />
                    </svg>
                  </div>

                  <div className="absolute bottom-[5mm] w-full text-center">
                    <div className="text-[7px] text-[#051e42] font-bold tracking-widest mb-1">A SERVIÇO DA</div>
                    <div className="flex justify-center items-center gap-3 px-3 mt-1">
                      {/* AS IMAGENS DO GITHUB APARECEM AQUI */}
                      <img src="/dinamo.png" className="h-[7mm] object-contain" alt="Dínamo" />
                      <img src="/equatorial.png" className="h-[7mm] object-contain" alt="Equatorial" />
                    </div>
                  </div>
                </div>

                {/* --- VERSO DO CRACHÁ --- */}
                <div className="cracha-card w-[54mm] h-[86mm] bg-white relative p-[4mm] flex flex-col border border-slate-200">
                  
                  {/* Campos Padrão Word com bordas arredondadas */}
                  <div className="space-y-[3mm] mt-[2mm]">
                    
                    <div className="relative border border-black rounded-[5px] p-[1.5mm] h-[7mm] flex items-center">
                      <span className="absolute -top-[2mm] left-[2mm] bg-white px-[1mm] text-[6px] font-bold text-black">Nome</span>
                      <div className="text-[7.5px] text-black font-semibold uppercase">{colaborador.nome_completo}</div>
                    </div>

                    <div className="relative border border-black rounded-[5px] p-[1.5mm] h-[7mm] flex items-center">
                      <span className="absolute -top-[2mm] left-[2mm] bg-white px-[1mm] text-[6px] font-bold text-black">CPF</span>
                      <div className="text-[7.5px] text-black font-semibold">{colaborador.cpf || '000.000.000-00'}</div>
                    </div>

                    <div className="relative border border-black rounded-[5px] p-[1.5mm] h-[7mm] flex items-center w-[65%]">
                      <span className="absolute -top-[2mm] left-[2mm] bg-white px-[1mm] text-[6px] font-bold text-black">Função</span>
                      <div className="text-[7px] text-black font-semibold uppercase truncate">{colaborador.desc_funcao}</div>
                    </div>

                    <div className="relative border border-black rounded-[5px] p-[1.5mm] h-[7mm] flex items-center w-[65%]">
                      <span className="absolute -top-[2mm] left-[2mm] bg-white px-[1mm] text-[6px] font-bold text-black">Car. Identidade</span>
                      <div className="text-[7.5px] text-black font-semibold">{colaborador.rg || '0000000000'}</div>
                    </div>

                    <div className="relative border border-black rounded-[5px] p-[1.5mm] h-[7mm] flex items-center w-[65%]">
                      <span className="absolute -top-[2mm] left-[2mm] bg-white px-[1mm] text-[6px] font-bold text-black">Matrícula</span>
                      <div className="text-[7.5px] text-black font-semibold">{String(colaborador.matricula).padStart(8, '0')}</div>
                    </div>

                    <div className="relative border border-black rounded-[5px] p-[1.5mm] h-[7mm] flex items-center">
                      <span className="absolute -top-[2mm] left-[2mm] bg-white px-[1mm] text-[6px] font-bold text-black">Empresa</span>
                      <div className="text-[7.5px] text-black font-semibold uppercase">DÍNAMO ENGENHARIA</div>
                    </div>

                  </div>

                  {/* QR Code Novo (Canto inferior direito) */}
                  <div className="absolute right-[4mm] bottom-[16mm]">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://sgso.dinamo.srv.br/colaborador/${colaborador.matricula}`} 
                      className="w-[14mm] h-[14mm] bg-white"
                      alt="QR Code"
                    />
                  </div>

                  {/* Rodapé Textos extraídos do Word */}
                  <div className="absolute bottom-[3mm] left-[4mm] right-[4mm]">
                    <div className="text-[5px] text-black leading-tight mb-[2mm] pr-[16mm] text-justify font-medium">
                      Este crachá é de uso pessoal e intransferível. O colaborador terceiro deverá usá-lo obrigatoriamente nas dependências do Grupo Equatorial Energia ou fora dela a seu serviço. Em caso de perda, por favor comunicar imediatamente o setor de Segurança Empresarial.
                    </div>
                    <div className="text-center">
                      <div className="text-[6px] font-bold text-black">www.dinamo.srv.br</div>
                      <div className="text-[5.5px] text-black">Pass Xingu, Coqueiro| Belém-PA |CEP 66823-335</div>
                      <div className="text-[5px] text-black font-bold text-right mt-1">
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
            margin: 0;
          }

          body {
            margin: 0;
            padding: 0;
            background: white;
          }

          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: block !important;
            padding: 0 !important;
            background: transparent !important;
          }

          .cracha-card {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            page-break-after: always;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>
    </div>
  );
}
