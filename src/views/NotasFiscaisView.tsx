import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { NotaFiscal, StatusNF } from '../types';
import { formatCurrency, formatDocument, formatPhone } from '../utils';
import { 
  FileCheck, Search, Trash2, Printer, X, Check, Ban, FileText, ShoppingCart, RefreshCw, Cpu, Download
} from 'lucide-react';
import { EmitirNotaModal } from '../components/EmitirNotaModal';

export const NotasFiscaisView: React.FC = () => {
  const { 
    notasFiscais, deleteNotaFiscal, updateNotaFiscalStatus, searchQuery, ordensServico, vendas, clientes, configuracoes,
    showToast, confirmAction
  } = useApp();

  // States
  const [localSearch, setLocalSearch] = useState('');
  const [activeTab, setActiveTab] = useState<StatusNF | 'todas'>('todas');
  const [viewingNF, setViewingNF] = useState<NotaFiscal | null>(null);
  const [transmittingNF, setTransmittingNF] = useState<NotaFiscal | null>(null);

  const getReferenceData = (n: NotaFiscal) => {
    if (n.referenciaTipo === 'OS') {
      const os = ordensServico.find(o => o.numero === n.referenciaId);
      return {
        clienteId: os?.clienteId,
        itens: os?.itens || []
      };
    } else {
      const v = vendas.find(sale => sale.id === n.referenciaId);
      return {
        clienteId: v?.clienteId,
        itens: v?.itens || []
      };
    }
  };

  const handleCancel = (id: string) => {
    confirmAction({
      title: 'Cancelar Nota Fiscal',
      message: 'Tem certeza de que deseja CANCELAR esta nota fiscal perante a prefeitura/Sefaz? Esta ação é irreversível.',
      confirmText: 'Confirmar Cancelamento',
      cancelText: 'Voltar',
      onConfirm: () => {
        updateNotaFiscalStatus(id, 'cancelada');
        showToast('Nota fiscal cancelada com sucesso!', 'success');
      }
    });
  };

  const handleDelete = (id: string) => {
    confirmAction({
      title: 'Excluir Nota Fiscal',
      message: 'Excluir permanentemente o registro desta nota fiscal do painel da oficina?',
      confirmText: 'Excluir',
      cancelText: 'Voltar',
      onConfirm: () => {
        deleteNotaFiscal(id);
        showToast('Registro de nota fiscal excluído com sucesso!', 'success');
      }
    });
  };

  const combinedSearch = (searchQuery || localSearch).toLowerCase().trim();
  const filteredNotas = notasFiscais.filter(n => {
    // Status Filter
    if (activeTab !== 'todas' && n.status !== activeTab) return false;

    // Text Filter
    if (!combinedSearch) return true;
    return (
      n.numero.includes(combinedSearch) ||
      n.clienteNome.toLowerCase().includes(combinedSearch) ||
      n.referenciaId.includes(combinedSearch)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
          <FileCheck size={22} className="text-[#0F4C5C]" />
          Notas Fiscais de Serviços e Produtos (DANFE)
        </h2>
        <p className="text-xs text-gray-500 font-medium font-sans">
          Painel de faturamento tributário integrado. Emissão de Notas Fiscais Eletrônicas de Serviço (NFS-e) e de Consumidor (NFC-e).
        </p>
      </div>

      {/* Tabs Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex flex-wrap gap-1 bg-gray-50 p-1 rounded-lg border border-gray-100" role="tablist">
            {[
              { id: 'todas', label: 'Todas' },
              { id: 'emitida', label: 'Emitidas' },
              { id: 'pendente', label: 'Pendentes de Transmissão' },
              { id: 'cancelada', label: 'Canceladas' }
            ].map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id as StatusNF | 'todas')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeTab === tab.id 
                    ? 'bg-[#0F4C5C] text-white shadow-xs' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                }`}
                style={{ minHeight: '32px' }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="text-xs font-semibold text-gray-500 font-mono">
            {filteredNotas.length} Notas Fiscais
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full">
          <label htmlFor="nf-search" className="sr-only">Pesquisar por NF ou Cliente</label>
          <div className="absolute left-3 top-2.5 text-gray-400">
            <Search size={18} />
          </div>
          <input
            id="nf-search"
            type="search"
            placeholder="Pesquisar por número da nota, nome do cliente, referência OS..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
          />
        </div>
      </div>

      {/* Empty State */}
      {filteredNotas.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-gray-200 shadow-xs space-y-4">
          <FileCheck size={42} className="mx-auto text-gray-300" />
          <h3 className="text-lg font-bold text-gray-800">Nenhuma nota fiscal encontrada</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            {combinedSearch 
              ? 'Não localizamos notas fiscais que correspondam aos filtros ativos.' 
              : 'As notas fiscais eletrônicas de produto ou serviço são pré-geradas automaticamente para cada Ordem de Serviço concluída ou Venda de balcão.'}
          </p>
        </div>
      ) : (
        /* Invoices Table */
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-400 font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Nº Nota (DANFE)</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Emissão</th>
                  <th className="px-6 py-4">Tipo Tributo</th>
                  <th className="px-6 py-4">Referência</th>
                  <th className="px-6 py-4">Status Transmissão</th>
                  <th className="px-6 py-4 text-right">Valor Total</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filteredNotas.map(n => {
                  const statusColors: Record<string, string> = {
                    emitida: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    pendente: 'bg-amber-50 text-amber-700 border-amber-200',
                    cancelada: 'bg-rose-50 text-rose-700 border-rose-200'
                  };

                  return (
                    <tr key={n.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-gray-800">
                        {n.numero}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-800">
                        {n.clienteNome}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-600">
                        {n.data}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-600 uppercase border border-gray-200/50">
                          {n.tipo}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 font-mono">
                          {n.referenciaTipo === 'OS' ? <FileText size={12} /> : <ShoppingCart size={12} />}
                          {n.referenciaTipo} #{n.referenciaId}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize ${statusColors[n.status]}`}>
                          {n.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-gray-800">
                        {formatCurrency(n.valorTotal)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Transmit pending */}
                          {n.status === 'pendente' && (
                            <button
                              onClick={() => setTransmittingNF(n)}
                              title="Transmitir para SEFAZ (Emitir)"
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            >
                              <RefreshCw size={14} className="animate-spin-hover" />
                            </button>
                          )}
                          
                          {/* Cancel emitted */}
                          {n.status === 'emitida' && (
                            <button
                              onClick={() => handleCancel(n.id)}
                              title="Cancelar Nota Fiscal"
                              className="p-1 text-red-500 hover:bg-red-50 rounded"
                            >
                              <Ban size={14} />
                            </button>
                          )}

                          {/* Print DANFE */}
                          <button
                            onClick={() => setViewingNF(n)}
                            title="Visualizar DANFE Simplificada"
                            className="p-1.5 text-[#0F4C5C] hover:bg-gray-100 rounded-md"
                          >
                            <Printer size={15} />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(n.id)}
                            title="Excluir Registro"
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-md"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DANFE SHEET POPUP PREVIEW */}
      {viewingNF && (() => {
        const n = viewingNF;

        // Resolve referenced items and client details
        let referencedItens: any[] = [];
        let clientDetails: any = null;
        
        if (n.referenciaTipo === 'OS') {
          const os = ordensServico.find(o => o.numero === n.referenciaId);
          referencedItens = os?.itens || [];
          clientDetails = clientes.find(c => c.id === os?.clienteId);
        } else {
          const v = vendas.find(sale => sale.id === n.referenciaId);
          referencedItens = v?.itens || [];
          clientDetails = clientes.find(c => c.id === v?.clienteId);
        }

        // Normalize items
        const normalizedItens = referencedItens.map(item => ({
          id: item.id || item.produtoId || '0',
          descricao: item.descricao || item.nome || 'Item sem descrição',
          quantidade: item.quantidade || 1,
          valorUnitario: item.valorUnitario || item.precoVenda || 0,
          tipo: item.tipo || 'peca'
        }));

        if (normalizedItens.length === 0) {
          normalizedItens.push({
            id: '01',
            descricao: n.tipo === 'Serviço' ? 'PRESTAÇÃO DE SERVIÇOS DE MANUTENÇÃO AUTOMOTIVA' : 'MERCADORIA / PRODUTO GERAL PARA VEÍCULO',
            quantidade: 1,
            valorUnitario: n.valorTotal,
            tipo: n.tipo === 'Serviço' ? 'servico' : 'peca'
          });
        }

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

        const handleDownloadXMLForNote = () => {
          const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe${generateChaveAcesso(n.numero)}" versao="4.00">
      <ide>
        <cUF>35</cUF>
        <cNF>84729482</cNF>
        <natOp>Venda de mercadoria ou prestação de serviço</natOp>
        <mod>${n.tipo === 'Serviço' ? '00' : '55'}</mod>
        <serie>1</serie>
        <nNF>${n.numero}</nNF>
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
        <xNome>${n.clienteNome}</xNome>
        <CPF_CNPJ>${clientDetails ? clientDetails.documento.replace(/\D/g, '') : '99999999999'}</CPF_CNPJ>
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
          <vNF>${n.valorTotal}</vNF>
        </ICMSTot>
      </total>
    </infNFe>
  </NFe>
  <protNFe versao="4.00">
    <infProt>
      <tpAmb>2</tpAmb>
      <verAplic>OficinaPro_v1.0</verAplic>
      <chNFe>${generateChaveAcesso(n.numero)}</chNFe>
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
          link.download = `NFe_${n.numero}.xml`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        };

        const handlePrintDANFESheet = () => {
          const printContent = document.getElementById('printable-view-danfe')?.innerHTML;
          if (!printContent) return;
          
          const popupWin = window.open('', '_blank', 'width=800,height=900');
          if (popupWin) {
            popupWin.document.open();
            popupWin.document.write(`
              <html>
                <head>
                  <title>Nota Fiscal #${n.numero} - OficinaPro</title>
                  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
                  <style>
                    body { font-family: monospace; padding: 20px; }
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
              {/* Header bar */}
              <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-b border-gray-200 shrink-0">
                <span className="text-xs font-bold font-mono text-gray-500 uppercase tracking-widest">
                  {n.tipo === 'Serviço' ? 'Documento Auxiliar de NFS-e (Serviços)' : 'Documento Auxiliar de NF-e (Produtos)'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadXMLForNote}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg text-xs font-bold"
                  >
                    <Download size={12} /> XML da Nota
                  </button>
                  <button
                    onClick={handlePrintDANFESheet}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#0F4C5C] text-white hover:bg-[#0C3D4A] rounded-lg text-xs font-bold"
                  >
                    <Printer size={12} /> Imprimir / PDF
                  </button>
                  <button
                    onClick={() => setViewingNF(null)}
                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 rounded-lg"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* DANFE sheet structure */}
              <div className="p-6 overflow-y-auto max-h-[80vh] bg-gray-100 flex-1">
                <div 
                  id="printable-view-danfe"
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
                      <span className="font-black text-sm block">
                        {n.tipo === 'Serviço' ? 'NFS-e' : 'DANFE'}
                      </span>
                      <span className="text-[8px] text-gray-600 block leading-tight uppercase">
                        {n.tipo === 'Serviço' ? 'Nota de Serviços Eletrônica' : 'Doc. Auxiliar da Nota Fiscal'}
                      </span>
                      <div className="text-[9px] mt-1 space-y-0.5 leading-none">
                        <p>0 - ENTRADA</p>
                        <p className="font-bold">1 - SAÍDA (1)</p>
                      </div>
                    </div>

                    {/* Número e Série */}
                    <div className="col-span-3 text-center flex flex-col justify-between pl-2">
                      <div className="border border-black p-1 text-center font-bold">
                        <span className="text-[8px] text-gray-500 block">Nº DA NOTA</span>
                        <span className="text-sm tracking-wide">{n.numero}</span>
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
                        {generateChaveAcesso(n.numero).match(/.{1,4}/g)?.join(' ')}
                      </span>
                    </div>
                    <div className="col-span-5 border-l border-black pl-3">
                      <span className="text-[8px] text-gray-500 block font-bold">PROTOCOLO DE AUTORIZAÇÃO DE USO</span>
                      <span className="text-[10px] font-bold">135260029384752 - {n.data} 10:01:23</span>
                    </div>
                  </div>

                  {/* NATUREZA DA OPERAÇÃO / CNPJ INSCRIÇÃO */}
                  <div className="grid grid-cols-12 border-b border-black pb-2.5 gap-2 text-[9px]">
                    <div className="col-span-6">
                      <span className="text-[8px] text-gray-500 block font-bold">NATUREZA DA OPERAÇÃO</span>
                      <span className="font-bold uppercase">
                        {n.tipo === 'Serviço' ? 'PRESTAÇÃO DE SERVIÇOS DE OFICINA' : 'VENDA DE MERCADORIA / AUTOPEÇAS'}
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
                        <span className="font-bold">{n.clienteNome}</span>
                      </div>
                      <div className="col-span-5">
                        <span className="text-[8px] text-gray-500 block">CPF / CNPJ DO CLIENTE</span>
                        <span className="font-bold font-mono">{clientDetails ? formatDocument(clientDetails.documento) : '999.999.999-99'}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-6">
                        <span className="text-[8px] text-gray-500 block">ENDEREÇO</span>
                        <span>
                          {clientDetails ? `${clientDetails.endereco.rua}, ${clientDetails.endereco.numero}` : 'AVENIDA PAULISTA, 1000'}
                        </span>
                      </div>
                      <div className="col-span-3">
                        <span className="text-[8px] text-gray-500 block">BAIRRO / DISTRITO</span>
                        <span>{clientDetails ? clientDetails.endereco.bairro : 'BELA VISTA'}</span>
                      </div>
                      <div className="col-span-3">
                        <span className="text-[8px] text-gray-500 block">CEP / TELEFONE</span>
                        <span>
                          {clientDetails ? `${clientDetails.endereco.cep} / ${formatPhone(clientDetails.telefone)}` : '01311-200'}
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
                        <p className="font-bold font-mono">{n.tipo === 'Produto' ? formatCurrency(n.valorTotal) : formatCurrency(0)}</p>
                      </div>
                      <div className="border border-gray-300 p-1">
                        <p className="text-gray-500">VALOR DO ICMS (18%)</p>
                        <p className="font-bold font-mono">{n.tipo === 'Produto' ? formatCurrency(n.valorTotal * 0.18) : formatCurrency(0)}</p>
                      </div>
                      <div className="border border-gray-300 p-1">
                        <p className="text-gray-500">BASE CÁLC. ISSQN</p>
                        <p className="font-bold font-mono">{n.tipo === 'Serviço' ? formatCurrency(n.valorTotal) : formatCurrency(0)}</p>
                      </div>
                      <div className="border border-gray-300 p-1">
                        <p className="text-gray-500">VALOR DO ISSQN (5%)</p>
                        <p className="font-bold font-mono">{n.tipo === 'Serviço' ? formatCurrency(n.valorTotal * 0.05) : formatCurrency(0)}</p>
                      </div>
                      <div className="border border-gray-300 p-1 bg-gray-100 font-bold">
                        <p className="text-gray-700">VALOR TOTAL NOTA</p>
                        <p className="font-bold font-mono text-[10px] text-gray-900">{formatCurrency(n.valorTotal)}</p>
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
                      II - Tributos aproximados (Lei Federal 12.741/2012 IBPT): {formatCurrency(n.valorTotal * 0.1345)} (13.45% Federal, Estadual e Municipal).<br />
                      III - Referente ao documento operacional {n.referenciaTipo} nº {n.referenciaId}. Sistema de teste homologado OficinaPro.<br />
                      <span className="font-bold text-gray-700">PROTÓTIPO EMITIDO EXCLUSIVAMENTE PARA FINS DE DEMONSTRAÇÃO VISUAL. VALOR JURÍDICO NULO.</span>
                    </p>
                  </div>

                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* RENDER EMISSION MODAL IN NOTAS FISCAIS VIEW FOR PENDING TRANSMISSIONS */}
      {transmittingNF && (() => {
        const refData = getReferenceData(transmittingNF);
        return (
          <EmitirNotaModal
            isOpen={!!transmittingNF}
            onClose={() => setTransmittingNF(null)}
            referenciaId={transmittingNF.referenciaId}
            referenciaTipo={transmittingNF.referenciaTipo}
            valorTotal={transmittingNF.valorTotal}
            clienteId={refData.clienteId}
            clienteNome={transmittingNF.clienteNome}
            itens={refData.itens}
          />
        );
      })()}

    </div>
  );
};
