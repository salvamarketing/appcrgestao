import React, { useState } from 'react';
import {
  FolderArchive,
  FileText,
  Download,
  Printer,
  Plus,
  Shield,
  CheckCircle2,
  Upload,
  Calendar,
  Eye,
  X
} from 'lucide-react';
import { CompanySettings } from '../types';
import { useNotification } from '../context/NotificationContext';

interface DocumentsPageProps {
  settings: CompanySettings;
}

export const DocumentsPage: React.FC<DocumentsPageProps> = ({ settings }) => {
  const { showToast } = useNotification();
  const [activeDocModal, setActiveDocModal] = useState<string | null>(null);

  // Form for Caixa d'água certificate
  const [certClient, setCertClient] = useState('Condomínio Residencial Aurora');
  const [certAddress, setCertAddress] = useState('Rua Olavo Bilac, 450 - Bento Gonçalves/RS');
  const [certCapacity, setCertCapacity] = useState('20.000 Litros (2 reservatórios de 10.000L)');
  const [certProduct, setCertProduct] = useState('Hipoclorito de Sódio a 2,5% (Registro MS nº 3.0125.0041)');
  const [certValidity, setCertValidity] = useState('6 meses (Válido até 18/03/2027)');
  // Termo de Garantia states
  const [warrantyClient, setWarrantyClient] = useState('Cristiano Lazaro');
  const [warrantyCpfCnpj, setWarrantyCpfCnpj] = useState('024.981.440-12');
  const [warrantyOsCode, setWarrantyOsCode] = useState('OS-0125');
  const [warrantyAddress, setWarrantyAddress] = useState('Av. Central das Flores, 1420 - Centro, Caxias do Sul/RS');
  const [warrantyService, setWarrantyService] = useState('Desobstrução e raspagem mecânica da coluna de esgoto principal');
  const [warrantyValue, setWarrantyValue] = useState('380.00');
  const [warrantyPeriod, setWarrantyPeriod] = useState('90 dias (Art. 26 da Lei 8.078/1990 - CDC)');
  const [warrantyCovered, setWarrantyCovered] = useState(
    '• Desobstrução e fluxo normalizado na tubulação ou ponto trabalhado.\n• Mão de obra técnica da CR Serviços Gerais para reincidência natural no trecho desobstruído.\n• Peças, anéis de vedação ou reparos hidráulicos fornecidos pela empresa.'
  );
  const [warrantyNotCovered, setWarrantyNotCovered] = useState(
    '• Mau uso superveniente: descarte de papel higiênico, lenços umedecidos, absorventes, gordura sólida ou entulhos de obra após a entrega do serviço testado.\n• Vícios estruturais: canos rompidos, afundamento de tubulação de barro, contra-queda (declive invertido) ou raízes de árvores invadindo o duto.\n• Intervenção de terceiros ou aplicação de produtos químicos corrosivos (como soda cáustica) após o atendimento.'
  );
  const [warrantyExclusionReason, setWarrantyExclusionReason] = useState('Nenhuma anomalia estrutural constatada. Teste de escoamento e vazão 100% aprovado.');
  const [warrantyClientSigner, setWarrantyClientSigner] = useState('Cristiano Lazaro');

  // Templates Pré-Definidos de Termo de Garantia com detalhamento de cobertura, exclusões e motivos
  const WARRANTY_TEMPLATES = [
    {
      id: 'desentupimento',
      name: 'Desentupimento & Esgoto',
      badge: 'Padrão 90 Dias (CDC)',
      period: '90 dias (Art. 26 da Lei 8.078/1990 - CDC)',
      service: 'Desobstrução e raspagem mecânica da coluna de esgoto / ramal principal',
      value: '380.00',
      covered:
        '• Desobstrução e fluxo normalizado na tubulação ou ponto trabalhado.\n• Mão de obra técnica da CR Serviços Gerais para reincidência natural no trecho desobstruído.\n• Peças, anéis de vedação ou reparos hidráulicos fornecidos pela empresa.',
      notCovered:
        '• Mau uso superveniente: descarte de papel higiênico, lenços umedecidos, absorventes, gordura sólida ou entulhos de obra após a entrega do serviço testado.\n• Vícios estruturais: canos rompidos, afundamento de tubulação de barro, contra-queda (declive invertido) ou raízes de árvores invadindo o duto.\n• Intervenção de terceiros ou aplicação de produtos químicos corrosivos (como soda cáustica) após o atendimento.',
      exclusionReason: 'Nenhuma anomalia estrutural constatada. Teste de escoamento e vazão 100% aprovado.',
    },
    {
      id: 'hidraulica',
      name: 'Instalação Hidráulica & Tubulação',
      badge: '180 Dias Contratual',
      period: '180 dias de garantia contratual',
      service: 'Substituição de tubulações, registros de pressão, válvulas e conexões hidráulicas',
      value: '650.00',
      covered:
        '• Estanqueidade e vedação perfeita de todas as juntas soldadas, termofundidas ou roscadas executadas.\n• Válvulas, registros e flexíveis novos fornecidos com nota fiscal pela empresa.\n• Correção imediata de vazamentos decorrentes de defeito de montagem ou aperto de peças.',
      notCovered:
        '• Golpe de aríete ou sobrepressão da rede pública acima da NBR 5626 sem redutor de pressão no ramal.\n• Perfuração mecânica acidental da parede por terceiros (furos com brocas, parafusos ou pregos).\n• Desgaste acelerado decorrente de água com alta turbidez ou sedimentos de terra da tubulação da rua.',
      exclusionReason: 'Teste hidrostático sob pressão normal executado durante 30 minutos sem nenhuma perda de carga.',
    },
    {
      id: 'caixa-dagua',
      name: 'Higienização de Reservatório & Caixa',
      badge: '6 Meses Sanitário',
      period: '6 meses (Conforme normas da Vigilância Sanitária)',
      service: 'Esgotamento, desinfecção bacteriológica, escovação mecânica e aplicação de hipoclorito homologado',
      value: '420.00',
      covered:
        '• Eliminação de biofilme, lodo e microrganismos patogênicos no interior do reservatório.\n• Vedação da tampa de inspeção e instalação de tela milimétrica no extravasor (ladrão).\n• Laudo sanitário válido perante fiscalização e órgãos de saúde pública.',
      notCovered:
        '• Abertura do reservatório por pessoas não autorizadas sem higienização adequada.\n• Entrada de água bruta com excesso de barro ou contaminantes decorrente de reparos na rede pública da concessionária.\n• Reservatórios com trincas estruturais prévias sem impermeabilização contratada.',
      exclusionReason: 'Água analisada límpida, inodora e incolor. Dosagem bactericida conforme Portaria do Ministério da Saúde.',
    },
    {
      id: 'impermeabilizacao',
      name: 'Impermeabilização & Infiltrações',
      badge: '1 Ano (12 Meses)',
      period: '1 ano (12 meses) de garantia',
      service: 'Aplicação de membrana impermeabilizante polimérica elástica em ralos, caixas e juntas',
      value: '1200.00',
      covered:
        '• Barreira hidrófuga nas áreas tratadas contra umidade e infiltrações descendentes.\n• Reparo e reaplicação da camada impermeabilizante caso ocorra descolamento ou falha do material aplicado pela equipe.',
      notCovered:
        '• Trincas e rachaduras estruturais por acomodação ou recalque de fundação do edifício.\n• Furações de pisos ou fixação de ralos e divisórias sem vedação vedante apropriada por terceiros.\n• Infiltrações provenientes de fachadas externas, janelas ou telhados não contemplados no projeto.',
      exclusionReason: 'Teste de lâmina d\'água de 72 horas realizado com sucesso, sem umidade na laje inferior.',
    },
    {
      id: 'caca-vazamento',
      name: 'Caça-Vazamentos & Geofone',
      badge: '90 Dias Contestação',
      period: '90 dias de cobertura pericial',
      service: 'Varredura acústica com geofone eletrônico e teste manométrico para localização pontual de vazamento oculto',
      value: '450.00',
      covered:
        '• Precisão na demarcação do ponto exato de vazamento indicado no laudo técnico emitido.\n• Emissão do laudo técnico com fotos e assinatura técnica para contestação de consumo na concessionária de água.',
      notCovered:
        '• Vazamentos pré-existentes ou novos em ramais secundários que estavam isolados ou sem pressão.\n• Danos causados por movimentações de solo ou vibrações de obras pesadas vizinhas.',
      exclusionReason: 'Ponto demarcado fisicamente no local com precisão manométrica e acústica comprovada.',
    },
  ];

  const [selectedTemplateId, setSelectedTemplateId] = useState('desentupimento');

  const handleApplyTemplate = (tplId: string) => {
    const tpl = WARRANTY_TEMPLATES.find((t) => t.id === tplId);
    if (!tpl) return;
    setSelectedTemplateId(tpl.id);
    setWarrantyService(tpl.service);
    setWarrantyPeriod(tpl.period);
    setWarrantyValue(tpl.value);
    setWarrantyCovered(tpl.covered);
    setWarrantyNotCovered(tpl.notCovered);
    setWarrantyExclusionReason(tpl.exclusionReason);
    showToast('Template aplicado!', `Termo de garantia atualizado: ${tpl.name}`, 'success');
  };

  const documents = [
    {
      id: 'termo-garantia',
      title: 'Termo de Garantia e Condições de Uso (CDC)',
      description: 'Certificado oficial que discrimina a cobertura legal de 90 dias, o que cobre, o que NÃO cobre e motivos de exclusão, resguardando a empresa.',
      category: 'Garantias Oficiais',
      badge: '90 Dias CDC',
    },
    {
      id: 'caixa-dagua',
      title: 'Certificado Sanitário de Limpeza de Caixa d\'Água',
      description: 'Documento exigido por órgãos de vigilância sanitária para condomínios e estabelecimentos comerciais.',
      category: 'Certificados Oficiais',
      badge: 'Vigilância Sanitária',
    },
    {
      id: 'contrato-manutencao',
      title: 'Contrato de Manutenção Preventiva para Condomínios',
      description: 'Minuta contratual com cobertura mensal de desentupimentos, inspeções e plantão emergencial 24h.',
      category: 'Contratos Comerciais',
      badge: 'Jurídico',
    },
    {
      id: 'laudo-caca-vazamento',
      title: 'Laudo Pericial de Caça-Vazamentos e Teste Hidrostático',
      description: 'Relatório para contestação de conta de água junto à concessionária (Corsan/Saneamento local).',
      category: 'Perícias Técnicas',
      badge: 'Contestação de Tarifa',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FolderArchive className="w-5 h-5 text-blue-600" />
            Central de Documentos & Termos Homologados
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Modelos oficiais de Termo de Garantia com CDC, certificados sanitários, contratos e laudos técnicos
          </p>
        </div>

        <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs">
          <Upload className="w-4 h-4" />
          Upload de Documento da Empresa
          <input
            type="file"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                showToast('Arquivo enviado com sucesso!', e.target.files[0].name, 'success');
              }
            }}
          />
        </label>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-6 shadow-xs flex flex-col justify-between transition-all"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 font-mono">
                  {doc.category}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {doc.badge}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug">
                {doc.title}
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">{doc.description}</p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setActiveDocModal(doc.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                Preencher e Emitir
              </button>

              <button
                onClick={() => {
                  setActiveDocModal(doc.id);
                  setTimeout(() => window.print(), 250);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Document View / Edit Modal */}
      {activeDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto print:p-0 print:bg-white">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl shadow-2xl p-6 relative print:p-0 print:border-none print:bg-white text-slate-900 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {activeDocModal === 'termo-garantia'
                    ? 'Emissão do Termo de Garantia Técnica & Limitações (CDC)'
                    : activeDocModal === 'caixa-dagua'
                    ? 'Emissão de Certificado Sanitário Oficial de Limpeza de Reservatório'
                    : activeDocModal === 'contrato-manutencao'
                    ? 'Minuta de Contrato de Manutenção Preventiva'
                    : 'Laudo Pericial de Caça-Vazamento e Teste Hidrostático'}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimir / Salvar PDF
                </button>
                <button
                  onClick={() => setActiveDocModal(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Switcher */}
            {activeDocModal === 'termo-garantia' ? (
              <>
                {/* Seletor de Templates Pré-Definidos do Termo de Garantia (Oculto na Impressão) */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mt-4 print:hidden space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <span>Templates Pré-Definidos de Termo de Garantia (Clique para preencher cláusulas):</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">5 modelos homologados</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {WARRANTY_TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => handleApplyTemplate(tpl.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          selectedTemplateId === tpl.id
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className={`text-[11px] font-bold leading-tight ${selectedTemplateId === tpl.id ? 'text-white' : 'text-slate-900'}`}>
                          {tpl.name}
                        </span>
                        <span className={`text-[9px] mt-1 font-semibold ${selectedTemplateId === tpl.id ? 'text-blue-100' : 'text-slate-500'}`}>
                          {tpl.badge}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* TERMO DE GARANTIA PADRONIZADO */}
                <div className="bg-white text-slate-900 p-8 rounded-xl font-sans mt-4 print:m-0 print:p-6 text-xs space-y-4">
                {/* Timbre Header */}
                <div className="text-center border-b-2 border-slate-900 pb-4">
                  <h2 className="text-xl font-black tracking-tight text-slate-950 uppercase">{settings.name}</h2>
                  <p className="font-bold text-blue-800 text-[11px]">{settings.commercialName}</p>
                  <p className="text-[10px] text-slate-600">
                    CNPJ: {settings.cnpj} • Plantão 24h: {settings.phone} • {settings.address} - {settings.city}/{settings.state}
                  </p>
                  <div className="mt-3 inline-block px-5 py-1.5 rounded-lg bg-slate-900 text-white font-extrabold tracking-wider uppercase text-xs">
                    TERMO DE GARANTIA TÉCNICA E LIMITAÇÕES OPERACIONAIS (LEI Nº 8.078/1990)
                  </div>
                </div>

                {/* Editable / Formatted metadata */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl print:bg-transparent print:p-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block print:hidden">Cliente:</label>
                    <input
                      type="text"
                      value={warrantyClient}
                      onChange={(e) => setWarrantyClient(e.target.value)}
                      className="font-bold text-slate-900 text-sm w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-600 focus:bg-white rounded px-1"
                    />
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-slate-500">CPF/CNPJ:</span>
                      <input
                        type="text"
                        value={warrantyCpfCnpj}
                        onChange={(e) => setWarrantyCpfCnpj(e.target.value)}
                        className="text-[11px] text-slate-700 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-600 focus:bg-white rounded px-1 w-32"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Referência OS:</span>
                      <input
                        type="text"
                        value={warrantyOsCode}
                        onChange={(e) => setWarrantyOsCode(e.target.value)}
                        className="font-mono font-bold text-blue-700 text-right bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-600 rounded px-1 w-24"
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Valor do Serviço:</span>
                      <input
                        type="text"
                        value={`R$ ${warrantyValue}`}
                        onChange={(e) => setWarrantyValue(e.target.value.replace('R$', '').trim())}
                        className="font-mono font-bold text-emerald-700 text-right bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-600 rounded px-1 w-28"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block print:hidden">Endereço do Local:</label>
                    <input
                      type="text"
                      value={warrantyAddress}
                      onChange={(e) => setWarrantyAddress(e.target.value)}
                      className="text-xs text-slate-700 w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-600 focus:bg-white rounded px-1"
                    />
                  </div>
                </div>

                {/* 1. PRAZO */}
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1">
                  <span className="font-extrabold text-blue-900 uppercase text-[11px] block">
                    1. PRAZO E ESCOPO DA GARANTIA LEGAL E CONTRATUAL
                  </span>
                  <p className="text-slate-700 text-[11px] leading-relaxed">
                    O presente termo confere a garantia estipulada de <strong>{warrantyPeriod}</strong>, contados a partir da data de conclusão dos serviços, em conformidade com o Artigo 26 do Código de Defesa do Consumidor (Lei Federal nº 8.078/1990).
                  </p>
                </div>

                {/* 2. O QUE ESTÁ COBERTO */}
                <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1">
                  <span className="font-extrabold text-emerald-900 uppercase text-[11px] block">
                    2. O QUE ESTÁ COBERTO PELA GARANTIA TÉCNICA (COBERTURA TOTAL):
                  </span>
                  <textarea
                    rows={3}
                    value={warrantyCovered}
                    onChange={(e) => setWarrantyCovered(e.target.value)}
                    className="w-full text-slate-800 text-[11px] leading-relaxed bg-transparent border border-transparent hover:border-emerald-300 focus:border-emerald-600 rounded p-1"
                  />
                </div>

                {/* 3. O QUE NÃO ESTÁ COBERTO E MOTIVOS */}
                <div className="p-3 bg-rose-50/60 border border-rose-200 rounded-xl space-y-1">
                  <span className="font-extrabold text-rose-900 uppercase text-[11px] block">
                    3. O QUE NÃO ESTÁ COBERTO E MOTIVOS DE EXCLUSÃO (RESGUARDO DA EMPRESA):
                  </span>
                  <textarea
                    rows={4}
                    value={warrantyNotCovered}
                    onChange={(e) => setWarrantyNotCovered(e.target.value)}
                    className="w-full text-slate-800 text-[11px] leading-relaxed bg-transparent border border-transparent hover:border-rose-300 focus:border-rose-600 rounded p-1"
                  />
                </div>

                {/* 4. RESSALVA TÉCNICA NO LOCAL */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="font-bold text-slate-800 uppercase text-[11px] block">
                    4. RESSALVAS OU OBSERVAÇÕES TÉCNICAS CONSTATADAS NO LOCAL:
                  </span>
                  <input
                    type="text"
                    value={warrantyExclusionReason}
                    onChange={(e) => setWarrantyExclusionReason(e.target.value)}
                    className="w-full text-slate-700 text-[11px] bg-white border border-slate-200 rounded-lg p-2 focus:outline-none focus:border-blue-600"
                    placeholder="Ressalva ou observação técnica especial..."
                  />
                </div>

                {/* 5. DECLARAÇÃO DE CONFERÊNCIA E ASSINATURAS */}
                <div className="pt-2">
                  <p className="text-[10px] text-slate-600 text-justify leading-relaxed">
                    Declaro que acompanhei o teste de escoamento e vazão perante o técnico responsável, constatando que o serviço foi entregue desobstruído e em pleno funcionamento. Estou plenamente ciente das condições de cobertura e dos motivos de exclusão da garantia acima discriminados.
                  </p>

                  <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
                    <div className="border-t border-slate-400 pt-2">
                      <p className="font-bold text-slate-900">Técnico Operacional Responsável</p>
                      <p className="text-[10px] text-slate-500">{settings.name} • Plantão 24h</p>
                    </div>
                    <div className="border-t border-slate-400 pt-2">
                      <p className="font-bold text-slate-900">{warrantyClientSigner || warrantyClient}</p>
                      <p className="text-[10px] text-slate-500">Assinatura do Cliente / Recebedor</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
              /* OUTROS CERTIFICADOS (Caixa d'Água, Contrato, Laudo) */
              <div className="bg-white text-slate-900 p-8 rounded-xl font-sans mt-4 print:m-0 print:p-6 text-xs space-y-4">
                <div className="text-center border-b-2 border-blue-900 pb-4">
                  <h2 className="text-xl font-bold tracking-tight text-blue-950 uppercase">{settings.name}</h2>
                  <p className="font-bold text-blue-800 text-[11px]">{settings.commercialName}</p>
                  <p className="text-[10px] text-slate-600">
                    CNPJ: {settings.cnpj} • Plantão 24h: {settings.phone} • {settings.address} - {settings.city}/{settings.state}
                  </p>
                  <div className="mt-3 inline-block px-4 py-1 rounded bg-blue-100 text-blue-950 font-bold tracking-wider uppercase text-xs">
                    CERTIFICADO DE HIGIENIZAÇÃO E BACTERICIDA DE RESERVATÓRIO DE ÁGUA POTÁVEL
                  </div>
                </div>

                <div className="space-y-3 leading-relaxed">
                  <p>
                    Certificamos para os devidos fins de direito e comprovação perante a Vigilância
                    Sanitária que foi realizada a desinfecção física e bacteriológica dos reservatórios de
                    água potável do cliente abaixo discriminado:
                  </p>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                    <p><strong>Cliente / Condomínio:</strong> {certClient}</p>
                    <p><strong>Endereço do Imóvel:</strong> {certAddress}</p>
                    <p><strong>Capacidade Total Higienizada:</strong> {certCapacity}</p>
                    <p><strong>Produto Utilizado:</strong> {certProduct}</p>
                    <p><strong>Período de Validade:</strong> <span className="font-bold text-blue-900">{certValidity}</span></p>
                  </div>

                  <p className="text-[11px] text-slate-600 italic">
                    Metodologia aplicada conforme diretrizes da ANVISA e NBR 5626: esgotamento, lavagem
                    mecânica com cerdas macias, aplicação de solução desinfetante bactericida, enxágue e
                    descarte de resíduos.
                  </p>

                  <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
                    <div className="border-t border-slate-400 pt-2">
                      <p className="font-bold text-slate-900">Responsável Técnico Operacional</p>
                      <p className="text-[10px] text-slate-500">{settings.name}</p>
                    </div>
                    <div className="border-t border-slate-400 pt-2">
                      <p className="font-bold text-slate-900">Síndico(a) / Administrador(a)</p>
                      <p className="text-[10px] text-slate-500">Conferido e aprovado</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
