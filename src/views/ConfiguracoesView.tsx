import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Configuracoes } from '../types';
import { 
  Settings, Save, Building, MapPin, ShieldCheck, Mail, Phone, FileSignature, X, Info 
} from 'lucide-react';

export const ConfiguracoesView: React.FC = () => {
  const { configuracoes, updateConfiguracoes, showToast } = useApp();

  // Local form states
  const [nomeOficina, setNomeOficina] = useState(configuracoes.nomeOficina);
  const [telefone, setTelefone] = useState(configuracoes.telefone);
  const [cnpj, setCnpj] = useState(configuracoes.cnpj);
  const [email, setEmail] = useState(configuracoes.email);
  const [nomeUsuario, setNomeUsuario] = useState(configuracoes.nomeUsuario);
  const [logoUrl, setLogoUrl] = useState(configuracoes.logoUrl || '');

  // Nested address state
  const [cep, setCep] = useState(configuracoes.endereco.cep);
  const [rua, setRua] = useState(configuracoes.endereco.rua);
  const [numero, setNumero] = useState(configuracoes.endereco.numero);
  const [bairro, setBairro] = useState(configuracoes.endereco.bairro);
  const [cidade, setCidade] = useState(configuracoes.endereco.cidade);
  const [uf, setUf] = useState(configuracoes.endereco.uf);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!nomeOficina.trim()) errs.nomeOficina = 'Nome da oficina é obrigatório.';
    if (!cnpj.trim()) errs.cnpj = 'CNPJ é obrigatório.';
    if (!telefone.trim()) errs.telefone = 'Telefone é obrigatório.';
    if (!nomeUsuario.trim()) errs.nomeUsuario = 'Nome do usuário/operador é obrigatório.';
    if (!cep.trim()) errs.cep = 'CEP é obrigatório.';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      showToast('Por favor, corrija os erros no formulário.', 'error');
      return;
    }

    const updatedData: Partial<Configuracoes> = {
      nomeOficina,
      telefone,
      cnpj,
      email,
      nomeUsuario,
      logoUrl,
      endereco: {
        cep,
        rua,
        numero,
        bairro,
        cidade,
        uf: uf.toUpperCase()
      }
    };

    updateConfiguracoes(updatedData);
    showToast('Configurações da oficina salvas com sucesso!', 'success');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div>
        <h2 className="text-xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
          <Settings size={22} className="text-[#0F4C5C]" />
          Configurações da OficinaPro
        </h2>
        <p className="text-xs text-gray-500 font-medium font-sans">
          Customize as informações institucionais, logotipo, dados fiscais de emissão, endereço físico e conta de login do operador atual.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* SECTION 1: DADOS GERAIS */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center gap-2 text-sm font-bold text-[#0F4C5C]">
            <Building size={16} />
            <span>Dados da Empresa e Identidade</span>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="cfg-nome-oficina" className="block text-xs font-bold text-gray-700 mb-1.5">Nome Comercial da Oficina *</label>
              <input
                id="cfg-nome-oficina"
                type="text"
                value={nomeOficina}
                onChange={(e) => setNomeOficina(e.target.value)}
                placeholder="Ex: OficinaPro Premium"
                className={`w-full text-sm border rounded-lg p-2.5 focus:ring-2 focus:ring-[#0F4C5C] focus:outline-hidden ${errors.nomeOficina ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.nomeOficina && <p className="text-xs text-red-600 font-semibold mt-1">{errors.nomeOficina}</p>}
            </div>

            <div>
              <label htmlFor="cfg-cnpj" className="block text-xs font-bold text-gray-700 mb-1.5">CNPJ Fiscal *</label>
              <input
                id="cfg-cnpj"
                type="text"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                placeholder="00.000.000/0001-00"
                className={`w-full text-sm border rounded-lg p-2.5 font-mono focus:ring-2 focus:ring-[#0F4C5C] focus:outline-hidden ${errors.cnpj ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.cnpj && <p className="text-xs text-red-600 font-semibold mt-1">{errors.cnpj}</p>}
            </div>

            <div>
              <label htmlFor="cfg-telefone" className="block text-xs font-bold text-gray-700 mb-1.5">Telefone de Contato *</label>
              <input
                id="cfg-telefone"
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(11) 99999-9999"
                className={`w-full text-sm border rounded-lg p-2.5 font-mono focus:ring-2 focus:ring-[#0F4C5C] focus:outline-hidden ${errors.telefone ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.telefone && <p className="text-xs text-red-600 font-semibold mt-1">{errors.telefone}</p>}
            </div>

            <div>
              <label htmlFor="cfg-email" className="block text-xs font-bold text-gray-700 mb-1.5">E-mail Institucional</label>
              <input
                id="cfg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contato@oficinapro.com.br"
                className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#0F4C5C] focus:outline-hidden"
              />
            </div>

            <div>
              <label htmlFor="cfg-usuario" className="block text-xs font-bold text-gray-700 mb-1.5">Operador Atual (Recepção) *</label>
              <input
                id="cfg-usuario"
                type="text"
                value={nomeUsuario}
                onChange={(e) => setNomeUsuario(e.target.value)}
                className={`w-full text-sm border rounded-lg p-2.5 focus:ring-2 focus:ring-[#0F4C5C] focus:outline-hidden ${errors.nomeUsuario ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.nomeUsuario && <p className="text-xs text-red-600 font-semibold mt-1">{errors.nomeUsuario}</p>}
            </div>

            {/* Logotipo da Oficina Upload & URL */}
            <div className="md:col-span-2 border-t border-gray-100 pt-4 mt-2">
              <span className="block text-xs font-bold text-gray-700 mb-1.5">Logotipo da Oficina</span>
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                {logoUrl ? (
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center shrink-0">
                    <img 
                      src={logoUrl} 
                      alt="Logo da Oficina" 
                      className="max-w-full max-h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      type="button"
                      onClick={() => setLogoUrl('')}
                      className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow-md transition-colors cursor-pointer"
                      title="Remover logotipo"
                      aria-label="Remover logotipo"
                      style={{ minWidth: '24px', minHeight: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-gray-400 text-center shrink-0">
                    <Building size={24} />
                    <span className="text-[10px] mt-1 font-semibold">Sem Logo</span>
                  </div>
                )}
                
                <div className="space-y-2 flex-1 w-full">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <label 
                      className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-xs font-bold transition-colors shadow-2xs focus-within:ring-2 focus-within:ring-[#0F4C5C] text-center"
                      style={{ minHeight: '38px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <span>Upload Imagem</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleLogoUpload} 
                        className="sr-only" 
                      />
                    </label>
                    <input
                      type="text"
                      placeholder="Ou cole a URL da imagem aqui..."
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      className="flex-1 text-xs border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#0F4C5C] focus:outline-hidden"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium font-sans">Formatos recomendados: PNG, JPG ou SVG. Resolução quadrada ou horizontal (máx. 200px).</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* SECTION 2: ENDEREÇO DE EMISSÃO */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center gap-2 text-sm font-bold text-[#0F4C5C]">
            <MapPin size={16} />
            <span>Endereço Físico do Estabelecimento</span>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="cfg-cep" className="block text-xs font-bold text-gray-700 mb-1.5">CEP *</label>
              <input
                id="cfg-cep"
                type="text"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                placeholder="00000-000"
                className={`w-full text-sm border rounded-lg p-2.5 font-mono focus:ring-2 focus:ring-[#0F4C5C] focus:outline-hidden ${errors.cep ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.cep && <p className="text-xs text-red-600 font-semibold mt-1">{errors.cep}</p>}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="cfg-rua" className="block text-xs font-bold text-gray-700 mb-1.5">Logradouro (Rua/Avenida)</label>
              <input
                id="cfg-rua"
                type="text"
                value={rua}
                onChange={(e) => setRua(e.target.value)}
                placeholder="Av. Paulista"
                className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#0F4C5C] focus:outline-hidden"
              />
            </div>

            <div>
              <label htmlFor="cfg-numero" className="block text-xs font-bold text-gray-700 mb-1.5">Número</label>
              <input
                id="cfg-numero"
                type="text"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder="1500"
                className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#0F4C5C] focus:outline-hidden"
              />
            </div>

            <div>
              <label htmlFor="cfg-bairro" className="block text-xs font-bold text-gray-700 mb-1.5">Bairro</label>
              <input
                id="cfg-bairro"
                type="text"
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                placeholder="Bela Vista"
                className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#0F4C5C] focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="cfg-cidade" className="block text-xs font-bold text-gray-700 mb-1.5">Cidade</label>
                <input
                  id="cfg-cidade"
                  type="text"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  placeholder="São Paulo"
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#0F4C5C] focus:outline-hidden"
                />
              </div>
              <div>
                <label htmlFor="cfg-uf" className="block text-xs font-bold text-gray-700 mb-1.5">UF (Estado)</label>
                <input
                  id="cfg-uf"
                  type="text"
                  maxLength={2}
                  value={uf}
                  onChange={(e) => setUf(e.target.value.toUpperCase())}
                  placeholder="SP"
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 font-mono text-center focus:ring-2 focus:ring-[#0F4C5C] focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: TRIBUTOS E PADRÕES */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center gap-2 text-sm font-bold text-[#0F4C5C]">
            <ShieldCheck size={16} />
            <span>Regras de Faturamento de Protótipo</span>
          </div>

          <div className="p-6 space-y-4">
            <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-4 flex gap-3 text-xs leading-relaxed">
              <Info className="text-amber-600 shrink-0 mt-0.5" size={18} />
              <div className="space-y-1">
                <p className="font-bold font-sans">Nota de Desenvolvimento</p>
                <p className="font-sans">
                  As informações cadastradas neste painel são salvas e persistidas no <strong>armazenamento local (LocalStorage)</strong> do seu navegador. 
                  As faturas geradas nos módulos de Recibos e Notas Fiscais lerão em tempo real estas configurações para renderizar a DANFE Simplificada.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="submit"
            className="px-6 py-3 bg-[#0F4C5C] hover:bg-[#0C3D4A] text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#0F4C5C]"
            style={{ minHeight: '44px' }}
          >
            <Save size={18} />
            <span>Salvar Alterações</span>
          </button>
        </div>

      </form>
    </div>
  );
};
