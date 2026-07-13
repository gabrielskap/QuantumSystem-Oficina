import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { NotaFiscal, StatusNF } from '../types';
import { formatCurrency, formatDocument, formatPhone } from '../utils';
import { 
  X, CheckCircle, RefreshCw, Printer, Download, Cpu, 
  AlertTriangle, FileText, ShoppingCart, HelpCircle, ClipboardCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EmitirNotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  referenciaId: string;
  referenciaTipo: 'OS' | 'Venda';
  valorTotal: number;
  clienteId?: string;
  clienteNome: string;
  itens: any[];
}

export const EmitirNotaModal: React.FC<EmitirNotaModalProps> = ({
  isOpen,
  onClose,
  referenciaId,
  referenciaTipo,
  valorTotal,
  clienteId,
  clienteNome,
  itens
}) => {
  const { 
    addNotaFiscal, notasFiscais, updateNotaFiscalStatus, deleteNotaFiscal, configuracoes, clientes
  } = useApp();

  // Selected Type: 'Serviço' (NFS-e) or 'Produto' (NF-e/NFC-e)
  const [tipoNota, setTipoNota] = useState<'Serviço' | 'Produto'>('Serviço');
  
  // States for emission process
  const [emissionStep, setEmissionStep] = useState<number>(0);
  const [isEmitting, setIsEmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [generatedNF, setGeneratedNF] = useState<NotaFiscal | null>(null);

  // Config/Certificate State
  const [hasCertificate, setHasCertificate] = useState<boolean>(true);

  // Normalizing items
  const normalizedItens = itens.map(item => {
    return {
      id: item.id || item.produtoId || '0',
      descricao: item.descricao || item.nome || 'Item sem descrição',
      quantidade: item.quantidade || 1,
      valorUnitario: item.valorUnitario || item.precoVenda || 0,
      tipo: item.tipo || 'peca'
    };
  });

  // Client Details
  const clientInfo = clientes.find(c => c.id === clienteId);

  // Pre-select type depending on the items present
  useEffect(() => {
    if (isOpen) {
      // If Venda, default to Produto (NF-e)
      if (referenciaTipo === 'Venda') {
        setTipoNota('Produto');
      } else {
        // If OS has only services, default to NFS-e. If only pieces, default to NF-e.
        const hasPieces = normalizedItens.some(i => i.tipo === 'peca');
        const hasServices = normalizedItens.some(i => i.tipo === 'servico');
        if (hasPieces && !hasServices) {
          setTipoNota('Produto');
        } else {
          setTipoNota('Serviço');
        }
      }
      // Reset states
      setEmissionStep(0);
      setIsEmitting(false);
      setIsSuccess(false);
      setGeneratedNF(null);
    }
  }, [isOpen, referenciaId, referenciaTipo]);

  if (!isOpen) return null;

  // Emission simulated process steps
  const steps = [
    "Validando estrutura do XML de faturamento e dados tributários...",
    "Assinando documento fiscal eletrônico com o Certificado Digital A1...",
    "Transmitindo lote de faturamento para o gateway da prefeitura/Sefaz...",
    "Processando autorização de uso e registrando protocolo..."
  ];

  const handleEmitir = () => {
    setIsEmitting(true);
    setEmissionStep(0);

    // Loop through simulated steps
    const interval = setInterval(() => {
      setEmissionStep(prev => {
        if (prev >= steps.length - 1) {
          clearInterval(interval);
          finishEmission();
          return prev;
        }
        return prev + 1;
      });
    }, 1200);
  };

  const finishEmission = () => {
    setIsEmitting(false);
    setIsSuccess(true);

    // Delete any pending note for the same reference to prevent duplicate notes
    const pendingNF = notasFiscais.find(
      n => n.referenciaId === referenciaId && n.referenciaTipo === referenciaTipo && n.status === 'pendente'
    );
    if (pendingNF) {
      deleteNotaFiscal(pendingNF.id);
    }

    // Generate fictional invoice numbers
    const nextNfId = 'nf' + (Math.max(...notasFiscais.map(n => parseInt(n.id.replace('nf', '')) || 0), 0) + 1);
    const nextNfNum = String(Math.max(...notasFiscais.map(n => parseInt(n.numero) || 0), 100) + 1).padStart(6, '0');

    const formattedDate = () => {
      const today = new Date();
      const d = String(today.getDate()).padStart(2, '0');
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const y = today.getFullYear();
      return `${d}/${m}/${y}`;
    };

    const novaNF: NotaFiscal = {
      id: nextNfId,
      referenciaId,
      referenciaTipo,
      tipo: tipoNota === 'Serviço' ? 'Serviço' : 'Produto',
      numero: nextNfNum,
      status: 'emitida',
      data: formattedDate(),
      valorTotal,
      clienteNome
    };

    // Save to global context
    addNotaFiscal(novaNF);
    setGeneratedNF(novaNF);
  };

  // Helper to generate a realistic random Access Key for NF-e (44 digits)
  const generateChaveAcesso = (num: string) => {
    const uf = "35"; // SP
    const anoMes = "2607"; // AA/MM
    const cnpj = "12345678000100";
    const mod = "55";
    const serie = "001";
    const numero = num.padStart(9, '0');
    const tpEmis = "1";
    const cNF = "84729482";
    const cDV = "4";
    return `${uf}${anoMes}${cnpj}${mod}${serie}${numero}${tpEmis}${cNF}${cDV}`;
  };

  // Helper to download the simulated XML file
  const handleDownloadXML = () => {
    if (!generatedNF) return;
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe${generateChaveAcesso(generatedNF.numero)}" versao="4.00">
      <ide>
        <cUF>35</cUF>
        <cNF>84729482</cNF>
        <natOp>Venda de mercadoria ou prestação de serviço</natOp>
        <mod>${tipoNota === 'Serviço' ? '00' : '55'}</mod>
        <serie>1</serie>
        <nNF>${generatedNF.numero}</nNF>
        <dhEmi>2026-07-13T10:00:00-03:00</dhEmi>
        <tpNF>1</tpNF>
        <idDest>1</idDest>
      </ide>
      <emit>
        <CNPJ>${configuracoes.cnpj.replace(/\D/g, '')}</CNPJ>
        <xNome>${configuracoes.nomeOficina}</xNome>
        <enderEmit>
          <xLgr>${configuracoes.endereco.rua}</xLgr>
          <nro>${configuracoes.endereco.numero}</nro>
          <xBairro>${configuracoes.endereco.bairro}</xBairro>
          <xMun>${configuracoes.endereco.cidade}</xMun>
          <UF>${configuracoes.endereco.uf}</UF>
          <CEP>${configuracoes.endereco.cep.replace(/\D/g, '')}</CEP>
        </enderEmit>
      </emit>
      <dest>
        <xNome>${generatedNF.clienteNome}</xNome>
        <CPF_CNPJ>${clientInfo ? clientInfo.documento.replace(/\D/g, '') : '99999999999'}</CPF_CNPJ>
      </dest>
      <det>
        ${normalizedItens.map((item, idx) => `
        <det nItem="${idx + 1}">
          <prod>
            <cProd>${item.id}</cProd>
            <xProd>${item.descricao}</xProd>
            <qCom>${item.quantidade}</qCom>
            <vUnCom>${item.valorUnitario}</vUnCom>
            <vProd>${item.quantidade * item.valorUnitario}</vProd>
          </prod>
        </det>`).join('')}
      </det>
      <total>
        <ICMSTot>
          <vNF>${generatedNF.valorTotal}</vNF>
        </ICMSTot>
      </total>
    </infNFe>
  </NFe>
  <protNFe versao="4.00">
    <infProt>
      <tpAmb>2</tpAmb>
      <verAplic>OficinaPro_v1.0</verAplic>
      <chNFe>${generateChaveAcesso(generatedNF.numero)}</chNFe>
      <dhRecb>2026-07-13T10:01:23-03:00</dhRecb>
      <nProt>135260029384752</nProt>
      <cStat>100</cStat>
      <xMotivo>Autorizado o uso da NF-e</xMotivo>
    </infProt>
  </protNFe>
</nfeProc>`;

    const blob = new Blob([xmlContent], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NFe_${generatedNF.numero}.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintDANFE = () => {
    // Elegant approach: trigger native browser print on the specific element
    const printContent = document.getElementById('printable-emission-danfe')?.innerHTML;
    if (!printContent) return;
    
    const originalContent = document.body.innerHTML;
    
    // Simple popup styles for print
    const popupWin = window.open('', '_blank', 'width=800,height=900');
    if (popupWin) {
      popupWin.document.open();
      popupWin.document.write(`
        <html>
          <head>
            <title>DANFE - OficinaPro - Nota #${generatedNF?.numero}</title>
            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
            <style>
              body { font-family: monospace; padding: 20px; }
              .border-black-print { border: 1px solid #000; }
              .border-b-black-print { border-bottom: 1px solid #000; }
              .border-l-black-print { border-left: 1px solid #000; }
              .border-t-black-print { border-top: 1px solid #000; }
              .border-r-black-print { border-right: 1px solid #000; }
              @media print {
                button { display: none !important; }
              }
            </style>
          </head>
          <body onload="window.print();window.close()">
            <div class="max-w-3xl mx-auto">
              ${printContent}
            </div>
          </body>
        </html>
      `);
      popupWin.document.close();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col my-4 max-h-[92vh]">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2">
            <Cpu size={20} className="text-[#0F4C5C]" />
            <span className="font-extrabold text-sm text-gray-800 uppercase tracking-wide">
              {isSuccess ? 'Nota Fiscal Emitida com Sucesso' : 'Emissor de Nota Fiscal Eletrônica (Simulado)'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* STEP 1: INITIAL STATE - CHOOSE TYPE AND CONFIGURE */}
          {!isEmitting && !isSuccess && (
            <div className="space-y-6">
              
              {/* Alert Warning for Simulation */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                <AlertTriangle className="text-[#E39B00] shrink-0 mt-0.5" size={20} />
                <div className="space-y-1">
                  <h4 className="text-xs font-extrabold text-[#9A6900] uppercase tracking-wider">Módulo de Demonstração Visual</h4>
                  <p className="text-xs text-[#9A6900] leading-normal font-medium">
                    A emissão fiscal neste ambiente é 100% simulada para homologação de layout. Nenhum dado é transmitido de verdade para a Sefaz ou prefeituras municipais.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Configuration / Type Selection Card */}
                <div className="md:col-span-2 space-y-6">
                  <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-4">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Opções de Emissão</h4>
                    
                    {/* Choose Type */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-gray-700">Tipo de Nota Fiscal</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setTipoNota('Serviço')}
                          className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all ${
                            tipoNota === 'Serviço' 
                              ? 'border-[#0F4C5C] bg-[#0F4C5C]/5 shadow-sm' 
                              : 'border-gray-200 bg-white hover:bg-gray-50'
                          }`}
                        >
                          <FileText className={`mt-0.5 ${tipoNota === 'Serviço' ? 'text-[#0F4C5C]' : 'text-gray-400'}`} size={18} />
                          <div>
                            <span className="font-extrabold text-xs block text-gray-800">NFS-e (Serviços)</span>
                            <span className="text-[10px] text-gray-500 mt-0.5 block leading-tight">
                              Nota Fiscal Eletrônica de Serviço para mão de obra de reparo mecânico.
                            </span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setTipoNota('Produto')}
                          className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all ${
                            tipoNota === 'Produto' 
                              ? 'border-[#0F4C5C] bg-[#0F4C5C]/5 shadow-sm' 
                              : 'border-gray-200 bg-white hover:bg-gray-50'
                          }`}
                        >
                          <ShoppingCart className={`mt-0.5 ${tipoNota === 'Produto' ? 'text-[#0F4C5C]' : 'text-gray-400'}`} size={18} />
                          <div>
                            <span className="font-extrabold text-xs block text-gray-800">NF-e / NFC-e (Produtos)</span>
                            <span className="text-[10px] text-gray-500 mt-0.5 block leading-tight">
                              Nota de venda de mercadorias, autopeças, óleos ou acessórios.
                            </span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Fictional digital certificate simulator status */}
                    <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-gray-700 block">Certificado Digital Integrado</span>
                        <span className="text-[10px] text-gray-400 block">Certificado do tipo A1 cadastrado (.pfx) em nuvem</span>
                      </div>
                      <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold border border-emerald-100">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Ativo (Venc: 28/05/2027)
                      </div>
                    </div>

                    {/* Fictional API connection info */}
                    <div className="bg-white p-3.5 rounded-lg border border-gray-200 flex items-center gap-2.5">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 font-mono text-[10px] rounded font-bold uppercase">PROVEDOR</span>
                      <span className="text-xs text-gray-600 font-semibold font-sans">Homologação de Faturamento Oficial (Sandbox API)</span>
                    </div>

                  </div>

                  {/* Summary of Items to Invoice */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                    <h5 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Itens Associados ({referenciaTipo} #{referenciaId})</h5>
                    <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
                      {normalizedItens.map((item, index) => (
                        <div key={index} className="py-2 flex justify-between items-center text-xs">
                          <div className="space-y-0.5 pr-4">
                            <span className="font-bold text-gray-800 line-clamp-1">{item.descricao}</span>
                            <span className="text-[10px] text-gray-400 font-mono">Qtd: {item.quantidade} x {formatCurrency(item.valorUnitario)}</span>
                          </div>
                          <span className="font-mono font-bold text-gray-800">{formatCurrency(item.quantidade * item.valorUnitario)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-gray-100 pt-3 flex justify-between items-center text-sm font-black">
                      <span className="text-gray-600">Faturamento da Nota:</span>
                      <span className="font-mono text-base text-[#0F4C5C]">{formatCurrency(valorTotal)}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Future Real Code Integration Info (Comentado/Isolado) */}
                <div className="bg-gray-900 text-gray-100 p-5 rounded-xl border border-gray-800 flex flex-col justify-between font-mono text-xs shadow-inner">
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5 text-blue-400 pb-2 border-b border-gray-800">
                      <Cpu size={14} />
                      <span className="font-bold text-[10px] tracking-wider uppercase">FUTURA INTEGRAÇÃO FISCAL</span>
                    </div>
                    
                    <p className="text-[11px] text-gray-400 leading-relaxed font-sans">
                      A função para envio da nota real está pronta em escopo comentado. Abaixo você vê o ponto de chamada que enviará o JSON assinado para um gateway parceiro de faturamento (Focus NFe, PlugNotas, NFe.io ou eNotas):
                    </p>

                    <pre className="text-[9px] text-green-400 leading-tight bg-black/50 p-3 rounded overflow-x-auto whitespace-pre">
{`/*
 * TODO: Integração Fiscal Real
 * 1. Carregar Certificado .pfx
 * 2. Autenticar no gateway (ex. FocusNFe)
 * 3. Enviar Payload abaixo:
 */
async function emitirNotaFiscalReal(dados: NotaPayload) {
  const token = process.env.FOCUS_NFE_KEY;
  const url = "https://api.focusnfe.com.br/v2";
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": "Basic " + btoa(token + ":")
    },
    body: JSON.stringify({
      cnpj_emitente: "12345678000100",
      cpf_cnpj_destinatario: dados.clienteDoc,
      valor_total: dados.total,
      itens: dados.itens,
      certificado_digital: "cert_a1_oficina.pfx"
    })
  });
  
  return response.json();
}`}
                    </pre>
                  </div>
                  
                  <div className="pt-4 mt-4 border-t border-gray-800 text-[10px] text-gray-500 font-sans leading-normal">
                    * Após homologação das telas, insira suas chaves fiscais reais no arquivo de configuração do painel.
                  </div>
                </div>

              </div>

              {/* Footer Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-white text-gray-600 hover:bg-gray-50 border border-gray-300 rounded-lg text-xs font-bold"
                  style={{ minHeight: '38px' }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleEmitir}
                  className="px-5 py-2.5 bg-[#0F4C5C] hover:bg-[#0C3D4A] text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  style={{ minHeight: '38px' }}
                >
                  <Cpu size={14} /> Emitir Nota Fiscal Eletrônica
                </button>
              </div>

            </div>
          )}

          {/* STEP 2: LOADING SCREEN - SIMULATED STEPS ANIMATION */}
          {isEmitting && (
            <div className="py-12 flex flex-col items-center justify-center space-y-6 text-center max-w-md mx-auto">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-[#0F4C5C]/20 border-t-4 border-t-[#0F4C5C] animate-spin" />
                <Cpu size={24} className="absolute inset-4 text-[#0F4C5C] animate-pulse" />
              </div>

              <div className="space-y-2">
                <h3 className="font-extrabold text-gray-800 text-sm uppercase tracking-wide">Iniciando Processo de Transmissão</h3>
                <p className="text-xs text-gray-500 max-w-xs font-medium font-sans">
                  Sincronizando faturamento e enviando requisições assinadas para as APIs fiscais de simulação.
                </p>
              </div>

              {/* Progress Steps List */}
              <div className="w-full text-left bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3 font-mono text-[10px]">
                {steps.map((stepText, idx) => {
                  const isPast = idx < emissionStep;
                  const isCurrent = idx === emissionStep;
                  
                  return (
                    <div 
                      key={idx} 
                      className={`flex items-start gap-2.5 transition-colors ${
                        isPast ? 'text-emerald-700 font-bold' : isCurrent ? 'text-blue-700 font-black' : 'text-gray-400'
                      }`}
                    >
                      <div className="mt-0.5 font-bold shrink-0">
                        {isPast ? "✔" : isCurrent ? "▶" : "○"}
                      </div>
                      <p className="leading-relaxed">{stepText}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS STATE - DANFE PREVIEW CARD */}
          {isSuccess && generatedNF && (
            <div className="space-y-6">
              
              {/* Top Banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-emerald-600 shrink-0" size={32} />
                  <div>
                    <h4 className="text-sm font-black text-emerald-800 uppercase">Nota Fiscal Eletrônica Autorizada!</h4>
                    <p className="text-xs text-emerald-600 leading-normal font-medium font-sans">
                      Sua nota foi gerada sob o número <span className="font-bold font-mono">#{generatedNF.numero}</span> e protocolada nos registros operacionais.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleDownloadXML}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg text-xs font-bold"
                  >
                    <Download size={12} /> XML da Nota
                  </button>
                  <button
                    onClick={handlePrintDANFE}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#0F4C5C] text-white hover:bg-[#0C3D4A] rounded-lg text-xs font-bold"
                  >
                    <Printer size={12} /> Imprimir / PDF
                  </button>
                </div>
              </div>

              {/* LIVE FISCAL LAYOUT PREVIEW CONTAINER */}
              <div className="bg-gray-100 p-6 rounded-xl border border-gray-200 overflow-x-auto">
                <div 
                  id="printable-emission-danfe"
                  className="bg-white p-8 border border-black shadow-xs font-mono text-xs text-black space-y-4 max-w-3xl mx-auto w-[760px]"
                >
                  
                  {/* DANFE HEADER - EMISSOR / IDENTIFICATION */}
                  <div className="grid grid-cols-12 border-b-2 border-black pb-3 gap-2">
                    {/* Logotipo / Dados Emitente */}
                    <div className="col-span-6 space-y-1 pr-2">
                      <h3 className="text-sm font-black uppercase">{configuracoes.nomeOficina}</h3>
                      <p className="text-[10px] uppercase">SERVIÇOS AUTOMOTIVOS INTEGRADOS</p>
                      <p className="text-[9px] text-gray-700 leading-tight">
                        {configuracoes.endereco.rua}, {configuracoes.endereco.numero} - {configuracoes.endereco.bairro}<br />
                        CEP: {configuracoes.endereco.cep} - {configuracoes.endereco.cidade} - {configuracoes.endereco.uf}<br />
                        TELEFONE: {configuracoes.telefone} - EMAIL: {configuracoes.email}
                      </p>
                    </div>

                    {/* DANFE center layout mark */}
                    <div className="col-span-3 border-l border-r border-black px-2 text-center flex flex-col justify-center">
                      <span className="font-black text-sm block">DANFE</span>
                      <span className="text-[8px] text-gray-600 block leading-tight">DOCUMENTO AUXILIAR DA NOTA FISCAL ELETRÔNICA</span>
                      <div className="text-[9px] mt-1 space-y-0.5 leading-none">
                        <p>0 - ENTRADA</p>
                        <p className="font-bold">1 - SAÍDA (1)</p>
                      </div>
                    </div>

                    {/* Número e Série */}
                    <div className="col-span-3 text-center flex flex-col justify-between pl-2">
                      <div className="border border-black p-1 text-center font-bold">
                        <span className="text-[8px] text-gray-500 block">Nº DA NOTA</span>
                        <span className="text-sm tracking-wide">{generatedNF.numero}</span>
                      </div>
                      <div className="text-[8px] text-gray-600 text-right leading-tight mt-2">
                        <p>SÉRIE: 001</p>
                        <p>FOLHA: 1/1</p>
                      </div>
                    </div>
                  </div>

                  {/* CHAVE DE ACESSO BARCODE PREVIEW */}
                  <div className="grid grid-cols-12 border-b border-black pb-2.5 gap-2 items-center">
                    <div className="col-span-7">
                      <span className="text-[8px] text-gray-500 block font-bold">CHAVE DE ACESSO DE CONSULTA</span>
                      <span className="text-[10px] font-bold tracking-tight font-mono break-all leading-normal">
                        {generateChaveAcesso(generatedNF.numero).match(/.{1,4}/g)?.join(' ')}
                      </span>
                    </div>
                    <div className="col-span-5 border-l border-black pl-3">
                      <span className="text-[8px] text-gray-500 block font-bold">PROTOCOLO DE AUTORIZAÇÃO DE USO</span>
                      <span className="text-[10px] font-bold">135260029384752 - 13/07/2026 10:01:23</span>
                    </div>
                  </div>

                  {/* NATUREZA DA OPERAÇÃO / CNPJ INSCRIÇÃO */}
                  <div className="grid grid-cols-12 border-b border-black pb-2.5 gap-2 text-[9px]">
                    <div className="col-span-6">
                      <span className="text-[8px] text-gray-500 block font-bold">NATUREZA DA OPERAÇÃO</span>
                      <span className="font-bold uppercase">
                        {tipoNota === 'Serviço' ? 'PRESTAÇÃO DE SERVIÇOS DE OFICINA' : 'VENDA DE MERCADORIA / AUTOPEÇAS'}
                      </span>
                    </div>
                    <div className="col-span-3 border-l border-black pl-2">
                      <span className="text-[8px] text-gray-500 block font-bold">CNPJ DO EMISSOR</span>
                      <span className="font-bold font-mono">{configuracoes.cnpj}</span>
                    </div>
                    <div className="col-span-3 border-l border-black pl-2">
                      <span className="text-[8px] text-gray-500 block font-bold">INSCRIÇÃO ESTADUAL</span>
                      <span className="font-bold font-mono">148.924.110.120</span>
                    </div>
                  </div>

                  {/* DESTINATÁRIO (CUSTOMER DETAILS) */}
                  <div className="border border-black p-2.5 space-y-2 text-[9px]">
                    <span className="text-[8px] text-gray-500 block font-black uppercase tracking-wider">DESTINATÁRIO / REMETENTE</span>
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-7">
                        <span className="text-[8px] text-gray-500 block">NOME / RAZÃO SOCIAL</span>
                        <span className="font-bold">{generatedNF.clienteNome}</span>
                      </div>
                      <div className="col-span-5">
                        <span className="text-[8px] text-gray-500 block">CPF / CNPJ DO CLIENTE</span>
                        <span className="font-bold font-mono">{clientInfo ? formatDocument(clientInfo.documento) : '999.999.999-99'}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-6">
                        <span className="text-[8px] text-gray-500 block">ENDEREÇO</span>
                        <span>
                          {clientInfo ? `${clientInfo.endereco.rua}, ${clientInfo.endereco.numero}` : 'AVENIDA PAULISTA, 1000'}
                        </span>
                      </div>
                      <div className="col-span-3">
                        <span className="text-[8px] text-gray-500 block">BAIRRO / DISTRITO</span>
                        <span>{clientInfo ? clientInfo.endereco.bairro : 'BELA VISTA'}</span>
                      </div>
                      <div className="col-span-3">
                        <span className="text-[8px] text-gray-500 block">CEP / TELEFONE</span>
                        <span>
                          {clientInfo ? `${clientInfo.endereco.cep} / ${formatPhone(clientInfo.telefone)}` : '01311-200'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* TAXES COMPUTATION GRID */}
                  <div className="border border-black p-2 text-[8px] leading-tight space-y-1 bg-gray-50/50">
                    <span className="text-[8px] text-gray-500 block font-black uppercase tracking-wider">CÁLCULO DO IMPOSTO TRIBUTÁRIO</span>
                    <div className="grid grid-cols-5 gap-1.5 text-center">
                      <div className="border border-gray-300 p-1">
                        <p className="text-gray-500">BASE DE CÁLC. ICMS</p>
                        <p className="font-bold font-mono">{tipoNota === 'Produto' ? formatCurrency(valorTotal) : formatCurrency(0)}</p>
                      </div>
                      <div className="border border-gray-300 p-1">
                        <p className="text-gray-500">VALOR DO ICMS (18%)</p>
                        <p className="font-bold font-mono">{tipoNota === 'Produto' ? formatCurrency(valorTotal * 0.18) : formatCurrency(0)}</p>
                      </div>
                      <div className="border border-gray-300 p-1">
                        <p className="text-gray-500">BASE CÁLC. ISSQN</p>
                        <p className="font-bold font-mono">{tipoNota === 'Serviço' ? formatCurrency(valorTotal) : formatCurrency(0)}</p>
                      </div>
                      <div className="border border-gray-300 p-1">
                        <p className="text-gray-500">VALOR DO ISSQN (5%)</p>
                        <p className="font-bold font-mono">{tipoNota === 'Serviço' ? formatCurrency(valorTotal * 0.05) : formatCurrency(0)}</p>
                      </div>
                      <div className="border border-gray-300 p-1 bg-gray-100 font-bold">
                        <p className="text-gray-700">VALOR TOTAL NOTA</p>
                        <p className="font-bold font-mono text-[10px] text-gray-900">{formatCurrency(valorTotal)}</p>
                      </div>
                    </div>
                  </div>

                  {/* ITEMS DETAIL TABLE */}
                  <div className="border border-black rounded-xs overflow-hidden">
                    <table className="w-full text-left border-collapse text-[8px]">
                      <thead>
                        <tr className="bg-gray-100 font-bold border-b border-black text-gray-700 uppercase">
                          <th className="p-1.5">DESCRIÇÃO DO PRODUTO/SERVIÇO</th>
                          <th className="p-1.5 text-center">NCM/LC</th>
                          <th className="p-1.5 text-center">CST</th>
                          <th className="p-1.5 text-center">CFOP</th>
                          <th className="p-1.5 text-center">QTD</th>
                          <th className="p-1.5 text-right">VL.UNIT</th>
                          <th className="p-1.5 text-right">VL.TOTAL</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-300 text-gray-900">
                        {normalizedItens.map((item, idx) => {
                          const isService = item.tipo === 'servico';
                          return (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="p-1.5 font-bold uppercase">{item.descricao}</td>
                              <td className="p-1.5 text-center font-mono">{isService ? '14.01' : '8708.29.99'}</td>
                              <td className="p-1.5 text-center font-mono">{isService ? '000' : '102'}</td>
                              <td className="p-1.5 text-center font-mono">{isService ? '5933' : '5102'}</td>
                              <td className="p-1.5 text-center font-mono font-bold">{item.quantidade}</td>
                              <td className="p-1.5 text-right font-mono">{formatCurrency(item.valorUnitario)}</td>
                              <td className="p-1.5 text-right font-mono font-bold">{formatCurrency(item.quantidade * item.valorUnitario)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* FOOTER INFO COMPLEMENTARY */}
                  <div className="border border-black p-2.5 text-[8px] leading-normal space-y-1">
                    <span className="font-bold text-gray-500 block uppercase">Informações Complementares</span>
                    <p>
                      I - DOCUMENTO EMITIDO POR ME OU EPP OPTANTE PELO SIMPLES NACIONAL. NÃO GERA DIREITO A CRÉDITO FISCAL DE IPI.<br />
                      II - Tributos aproximados (Lei Federal 12.741/2012 IBPT): {formatCurrency(valorTotal * 0.1345)} (13.45% Federal, Estadual e Municipal).<br />
                      III - Referente ao documento operacional {referenciaTipo} nº {referenciaId}. Sistema de teste homologado OficinaPro.<br />
                      <span className="font-bold text-gray-700">PROTÓTIPO EMITIDO EXCLUSIVAMENTE PARA FINS DE DEMONSTRAÇÃO VISUAL. VALOR JURÍDICO NULO.</span>
                    </p>
                  </div>

                </div>
              </div>

              {/* Close Button */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-[#0F4C5C] hover:bg-[#0C3D4A] text-white rounded-lg text-xs font-bold"
                  style={{ minHeight: '38px' }}
                >
                  Concluir e Voltar
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
