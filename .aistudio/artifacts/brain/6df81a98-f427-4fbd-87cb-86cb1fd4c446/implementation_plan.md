# Plano Mestre de Refatoração, Arquitetura e Blindagem de Segurança (AppSec)

## Visão Geral e Diagnóstico da Base de Código
O sistema de Gestão de Ordens de Serviço da **CR Serviços Gerais / Desentope Tudo** possui duas frentes críticas:
1. **Painel do Administrador Geral:** Gestão completa de chamados, finanças, equipes e auditoria detalhada de ações.
2. **Visão Mobile do Funcionário / Técnico em Campo:** Interface leve focada na execução técnica (assumir OS, deslocamento, fotos de antes/depois, assinatura digital do cliente e conclusão do serviço).

Atualmente, o projeto apresenta monólitos de grande escala (como `src/pages/WorkOrdersPage.tsx` com 2.907 linhas e `server.ts` com 1.756 linhas), lógica duplicada de status, formatação de moeda, datas e uploads de fotos, além de fragilidades de controle de acesso (RBAC) e auditoria no backend.

---

## Cronograma Sequencial de Planos de Execução

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CRONOGRAMA DE EXECUÇÃO                         │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ PLANO 1: Fundação, Constantes, Utilitários e Camada Compartilhada (DRY)│
│ • Centralização de formatadores BRL, datas, telefones e status de OS   │
│ • Validação de regressão visual e compilação limpa                    │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ PLANO 2: Blindagem de Segurança (RBAC) e Motor de Auditoria Imutável  │
│ • Middlewares de autenticação Bearer e restrições Admin vs Técnico    │
│ • Rastreamento confiável de quem criou, assumiu, editou e finalizou   │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ PLANO 3: Refatoração da Camada de Negócios e Faturamento (Core)        │
│ • Máquina de estados da OS e regras de baixa financeira centralizadas  │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ PLANO 4: Modularização da Visão do Administrador Geral                 │
│ • Quebra de WorkOrdersPage.tsx (2.907 linhas) em componentes coesos   │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ PLANO 5: Modularização e Otimização da Visão Mobile (Funcionário)      │
│ • Performance mobile, captura fluida de fotos da câmera e assinatura  │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ PLANO 6: Limpeza Final (Dead Code), Padronização e Testes E2E          │
│ • Purga de código legado e bateria de testes ponta a ponta            │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Detalhamento dos Planos de Ação

### PLANO 1: Fundação, Constantes, Utilitários e Camada Compartilhada (DRY)
- **Objetivo:** Criar a pasta `src/core/` para unificar formatadores de moeda (`formatCurrencyBRL`), datas (`formatDatePTBR`), sanitização de telefones/WhatsApp (`sanitizePhone`, `getWhatsAppUrl`), configurações de cores/badges de status de OS (`WORK_ORDER_STATUS_CONFIG`) e redimensionador de fotos.
- **Arquivos Criados:**
  - `src/core/constants/workOrderConstants.ts`
  - `src/core/utils/currencyFormatter.ts`
  - `src/core/utils/dateFormatter.ts`
  - `src/core/utils/phoneFormatter.ts`
  - `src/core/utils/imageProcessor.ts`
- **Arquivos Integrados:** `WorkOrdersPage.tsx`, `MobileTechnicianView.tsx`, `EmployeeDashboard.tsx`, `FinancialPage.tsx`, `QuotesPage.tsx`, `DashboardPage.tsx`.

### PLANO 2: Blindagem de Segurança (RBAC) e Motor de Auditoria/Logs
- **Objetivo:** Injetar verificação de tokens Bearer nas rotas do `server.ts`, impedindo que técnicos ou usuários sem login excluam ordens de serviço, modifiquem dados confidenciais ou limpem auditorias. Extrair a identidade do autor diretamente do token seguro em vez de confiar no payload do body.
- **Entregáveis:** Middlewares `authMiddleware.ts` e `rbacMiddleware.ts`, motor de auditoria com diff de dados (`auditService.ts`), e componente de timeline de auditoria.

### PLANO 3: Camada de Negócios e Faturamento (Core Services)
- **Objetivo:** Isolar as transições de status da OS e a emissão de garantias/recibos em serviços dedicados, evitando acoplamento entre regras de negócio e interfaces visuais.

### PLANO 4: Modularização do Administrador Geral
- **Objetivo:** Desacoplar `WorkOrdersPage.tsx` em submódulos especializados:
  - `WorkOrderListTable.tsx` (Tabela performática com paginação)
  - `WorkOrderFilterBar.tsx` (Filtros de data, prioridade, técnico e status)
  - `WorkOrderDetailDrawer.tsx` (Visualização lateral da OS)
  - `WorkOrderCreateModal.tsx` (Formulário estruturado de abertura)
  - `WorkOrderReportTab.tsx` (Laudo técnico, fotos antes/depois e garantias)

### PLANO 5: Modularização da Visão Mobile do Funcionário
- **Objetivo:** Otimizar `MobileTechnicianView.tsx` e `EmployeeDashboard.tsx` para foco em usabilidade de campo, touch responsivo no canvas de assinatura, carregamento assíncrono e compressão de fotos da câmera.

### PLANO 6: Limpeza Final e Validação Geral
- **Objetivo:** Eliminação de variáveis e imports obsoletos, tratamento robusto de erros com toasts e validação automatizada de ponta a ponta do ciclo de vida das ordens de serviço.
