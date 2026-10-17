# PLANO MESTRE DE REFATORAÇÃO, ARQUITETURA E BLINDAGEM DE SEGURANÇA (APPSEC)
**Sistema:** Gestão de Ordens de Serviço e Chamados — Desentope Tudo / CR Serviços Gerais  
**Papel:** Engenheiro de Software Sênior, Arquiteto de Sistemas e Especialista em AppSec  
**Data:** 16 de Outubro de 2026  
**Status do Documento:** MESTRE / APROVADO PARA FASEAMENTO

---

## 1. DIAGNÓSTICO PROFUNDO DO CÓDIGO ATUAL

### 1.1. Inventário de Arquivos Críticos Monolíticos (500 a 3.000 linhas)

| Arquivo | Linhas | Principais Violações e Responsabilidades Misturadas |
|---|:---:|---|
| `src/pages/WorkOrdersPage.tsx` | **2.907** | **Monólito Extremo:** Concatena em um único componente React a listagem completa de OS, filtros multidimensionais, modais de criação e edição com 40 campos, manipulação direta de canvas para assinatura digital, lógica de captura/upload de fotos via FileReader, chamadas diretas de IA Gemini para laudos, exportação/impressão, controle de áudio de despacho e cálculo financeiro. |
| `server.ts` | **1.756** | **Backend Centralizado Sem Camadas:** Mistura configuração do servidor Express, inicialização de IA (Gemini SDK), persistência em JSON em disco (`data/database.json`), upload de arquivos estáticos, rotas de autenticação, usuários, técnicos, clientes, locais, catálogo de serviços, ordens de serviço, orçamentos, financeiro, auditoria e middleware Vite. Não possui separação em controllers, services, middlewares ou repositories. |
| `src/pages/UsersPage.tsx` | **1.172** | UI de listagem misturada com formulário de cadastro, validação de senha, regras de papéis (RBAC), controle de status ativo/inativo e auditoria manual. |
| `src/pages/CustomersPage.tsx` | **981** | Gerenciamento de clientes PF/PJ, múltiplos endereços/locais, máscaras de input, validação de CPF/CNPJ e histórico de chamados em um único arquivo. |
| `src/pages/DashboardPage.tsx` | **908** | Métricas operacionais, filtros temporais (hoje, 7d, 30d, mês), rankings de rentabilidade, agregação de categorias e preview de técnicos. |
| `src/components/employee/EmployeeDashboard.tsx` | **856** | Painel mobile do funcionário contendo atalhos rápidos, chamados pendentes, filtros de status, cards operacionais e navegação duplicada. |
| `src/App.tsx` | **839** | Roteamento condicional, injeção de layout duplo (Admin Desktop vs Mobile Funcionario), controle de sincronização de dados, modais globais e escuta de atalhos. |
| `src/pages/SettingsPage.tsx` | **822** | Configurações da empresa, termos de garantia, dados do PIX, gestão de backup, sincronização e comando crítico de reset de dados. |
| `src/pages/LocationsPage.tsx` | **810** | Cadastro e geolocalização de locais e filiais de atendimento com mapas e visualização em lista. |
| `src/components/technician/MobileTechnicianView.tsx` | **785** | Interface de campo do técnico contendo lógica de geolocalização/GPS, alteração de status da OS, canvas de assinatura, fotos antes/depois, reajuste de preço e laudo com garantia. |
| `src/pages/QuotesPage.tsx` | **777** | Gestão de orçamentos, seleção de itens do catálogo, cálculo de desconto, validade e conversão para Ordem de Serviço. |
| `src/components/dashboard/InteractivePeakChart.tsx` | **707** | Renderização SVG interativa, interpolação matemática de curvas de Bezier, tooltips flutuantes e agrupamento por faixa de horário. |

---

### 1.2. Mapeamento de Funções e Lógicas Duplicadas (Violação DRY)

1. **Formatação de Moeda e Valores Financeiros:**
   - Implementada independentemente com `toLocaleString('pt-BR')`, `Intl.NumberFormat` ou concatenação manual `R$ ${val.toFixed(2)}` em:
     - `src/pages/WorkOrdersPage.tsx` (linhas 420, 1170, 2150)
     - `src/components/technician/MobileTechnicianView.tsx` (linhas 245, 680)
     - `src/components/employee/EmployeeDashboard.tsx` (linhas 310, 520)
     - `src/pages/FinancialPage.tsx` (linhas 85, 230)
     - `src/pages/QuotesPage.tsx` (linhas 150, 410)
     - `server.ts` (linhas 850, 1041, 1113, 1265)
2. **Badges, Cores e Rótulos de Status de OS (`WorkOrderStatus`):**
   - Mapeamentos idênticos de cor e rótulo (`ABERTA`, `EM_DESLOCAMENTO`, `EM_ANDAMENTO`, `CONCLUIDA`, `CANCELADA`, `AGUARDANDO_PECA`) reimplementados separadamente em:
     - `src/pages/WorkOrdersPage.tsx`
     - `src/components/technician/MobileTechnicianView.tsx`
     - `src/components/employee/EmployeeDashboard.tsx`
     - `src/pages/SchedulePage.tsx`
3. **Tratamento e Sanitização de Telefones e Links para WhatsApp:**
   - Limpeza de caracteres não numéricos (`phone.replace(/\D/g, '')`) e concatenação de link `wa.me/55...` repetida em:
     - `src/pages/WorkOrdersPage.tsx`
     - `src/components/technician/MobileTechnicianView.tsx`
     - `src/components/common/WhatsAppModal.tsx`
     - `src/components/common/AddressGpsLinks.tsx`
4. **Captura, Leitura (Base64) e Upload de Fotos:**
   - Lógica de `FileReader`, conversão para `data:image/...` e envio para `/api/upload` duplicada em 4 pontos distintos (`MobileTechnicianView` e 3 modais de `WorkOrdersPage`).
5. **Canvas de Assinatura Digital do Cliente:**
   - Inicialização do contexto 2D, cálculo de coordenadas para toque (touch) e mouse (`getBoundingClientRect`), traçado com `stroke` e limpeza de canvas replicados em `MobileTechnicianView.tsx` e `WorkOrdersPage.tsx`.
6. **Formatação e Manipulação de Datas:**
   - `toLocaleDateString('pt-BR')`, extração de hora/minuto e geração de datas ISO replicadas em mais de 10 arquivos sem um utilitário central.

---

### 1.3. Brechas de Segurança e Fragilidades de Auditoria (AppSec)

1. **Ausência de Middleware de Autenticação/Autorização no Backend (`server.ts`):**
   - As rotas REST aceitam requisições sem validar o cabeçalho `Authorization: Bearer <token>`. Endpoints administrativos sensíveis como:
     - `DELETE /api/work-orders/:id`
     - `DELETE /api/users/:id`
     - `POST /api/users`
     - `PUT /api/users/:id/role`
     - `POST /api/financial/expenses`
     - `POST /api/system/reset`
     podem ser invocados por qualquer cliente HTTP ou perfil de Técnico/Funcionário caso conheça a URL.
2. **Confiança Cega em Dados de Autoria Enviados pelo Cliente:**
   - Em rotas de transição de status (`PATCH /api/work-orders/:id/status`), criação de OS e fechamento financeiro, o backend confia em `req.body.userName` e `req.body.userId` enviados no corpo da requisição, em vez de extrair a identidade do usuário da sessão/token autenticado. Isso permite personificação e falsificação de logs.
3. **Auditoria com Truncamento Silencioso e Sem Imutabilidade:**
   - A função `logActivity` em `server.ts` trunca a lista com `.slice(0, 500)`, descartando registros históricos permanentemente.
   - Não há controle de integridade (hashing/checksum) para impedir que registros sejam adulterados caso o arquivo JSON seja manipulado.
   - Logs de ações não registram padronizadamente o *diff* completo (`estado_anterior` vs `estado_novo`).
4. **Vulnerabilidade de IDOR (Insecure Direct Object Reference) no Mobile:**
   - O técnico em campo consegue enviar requisições diretas para alterar ordens de serviço atribuídas a outros técnicos ou reajustar valores sem validação de limites ou aprovação gerencial.
5. **Armazenamento de Senhas em Texto Puro (`data/database.json`):**
   - As senhas dos usuários estão gravadas diretamente no banco sem hash criptográfico (ex: bcrypt/Argon2).

---

## 2. NOVA ARQUITETURA E ÁRVORE DE DIRETÓRIOS PROPOSTA

A arquitetura proposta adota o padrão **Modular Clean Architecture**, separando regras de negócio puras (domain/services), camada de dados/infraestrutura, componentes visuais desacoplados e utilitários compartilhados.

```
/
├── server/                               # BACKEND MODULARIZADO (Node/Express/TypeScript)
│   ├── config/                           # Configurações de ambiente, diretórios e constantes
│   │   ├── env.ts
│   │   └── constants.ts
│   ├── db/                               # Camada de Persistência e Acesso a Dados
│   │   ├── database.ts                   # Conexão atômica com database.json
│   │   └── repositories/                 # Repositories especializados (WorkOrders, Users, etc.)
│   │       ├── workOrderRepository.ts
│   │       ├── userRepository.ts
│   │       ├── customerRepository.ts
│   │       ├── financialRepository.ts
│   │       └── auditRepository.ts
│   ├── middlewares/                      # Interceptadores de Segurança & AppSec
│   │   ├── authMiddleware.ts             # Validação estrita de Bearer Token
│   │   ├── rbacMiddleware.ts             # Travas de Permissão (requireAdmin, requireTechnicianOrAdmin)
│   │   ├── rateLimitMiddleware.ts        # Prevenção de abusos/DDoS
│   │   └── errorMiddleware.ts            # Tratamento centralizado de erros
│   ├── services/                         # Regras de Negócio e Casos de Uso
│   │   ├── authService.ts                # Autenticação, hash de senhas e tokens
│   │   ├── workOrderService.ts           # Máquina de estados da OS, cálculos e validações
│   │   ├── auditService.ts               # Motor de Auditoria Imutável (quem pegou, editou, finalizou)
│   │   ├── financialService.ts           # Baixas automáticas, faturamento e contas
│   │   └── storageService.ts             # Upload sanitizado de fotos (Câmera/Galeria)
│   ├── controllers/                      # Controladores REST desacoplados
│   │   ├── authController.ts
│   │   ├── workOrderController.ts
│   │   ├── userController.ts
│   │   ├── customerController.ts
│   │   ├── financialController.ts
│   │   └── systemController.ts
│   └── routes/                           # Roteamento seguro por recurso
│       ├── authRoutes.ts
│       ├── workOrderRoutes.ts
│       ├── userRoutes.ts
│       ├── customerRoutes.ts
│       ├── financialRoutes.ts
│       └── systemRoutes.ts
│
├── src/                                  # FRONTEND MODULARIZADO (React / Vite)
│   ├── core/                             # Fundação Compartilhada (Shared Core)
│   │   ├── constants/                    # Status de OS, prioridades, papéis, chaves
│   │   │   ├── workOrderConstants.ts
│   │   │   └── rolesConstants.ts
│   │   ├── types/                        # Tipagens TypeScript centralizadas
│   │   │   ├── index.ts
│   │   │   └── audit.ts
│   │   └── utils/                        # Utilitários Compartilhados (DRY)
│   │       ├── currencyFormatter.ts      # Formatação BRL única
│   │       ├── dateFormatter.ts          # Formatação PT-BR única
│   │       ├── phoneFormatter.ts         # Sanitização e links de WhatsApp
│   │       └── imageProcessor.ts         # Redimensionamento e compressão de fotos da câmera
│   ├── services/                         # Camada de Integração de API & Segurança Front-end
│   │   ├── apiClient.ts                  # Cliente Axios/Fetch central com interceptors de token
│   │   ├── workOrderApiService.ts        # Chamadas de OS com tipagem rígida
│   │   ├── auditApiService.ts            # Consulta segura de trilhas de auditoria
│   │   └── permissionService.ts          # Verificação de permissões em tempo de execução no front
│   ├── hooks/                            # Hooks Customizados de Estado e Lógica Reutilizável
│   │   ├── useWorkOrders.ts              # Gestão de estado, filtros e mutações de OS
│   │   ├── useSignatureCanvas.ts         # Hook reutilizável para desenho e captura de assinaturas
│   │   ├── usePhotoCapture.ts            # Hook para controle de Câmera e Galeria
│   │   └── usePermissions.ts             # Hook de RBAC para renderização condicional segura
│   ├── components/                       # Componentes de UI Reutilizáveis e Desacoplados
│   │   ├── common/                       # Componentes visuais atômicos
│   │   ├── audit/                        # Linha do tempo e painéis de auditoria
│   │   │   ├── AuditTimeline.tsx         # Rastreabilidade visual por chamado
│   │   │   └── AuditDiffViewer.tsx       # Comparador de estado anterior vs novo
│   │   ├── workOrders/                   # Componentes específicos de Chamados (Admin)
│   │   │   ├── WorkOrderListTable.tsx    # Tabela performática com paginação/virtualização
│   │   │   ├── WorkOrderFilterBar.tsx    # Barra de filtros avançados
│   │   │   ├── WorkOrderDetailDrawer.tsx # Gaveta lateral modularizada de detalhes
│   │   │   ├── WorkOrderCreateModal.tsx  # Modal enxuto de abertura de chamado
│   │   │   └── WorkOrderReportTab.tsx    # Aba isolada de laudo e fotos
│   │   └── mobile/                       # Componentes Específicos do Funcionário de Campo
│   │       ├── MobileOrderCard.tsx       # Card ultraleve de chamado
│   │       ├── MobileStatusActions.tsx   # Botões de ação rápida (Deslocamento, Iniciar, Concluir)
│   │       ├── MobilePhotoUploader.tsx   # Módulo isolado de Câmera ao vivo
│   │       └── MobileSignaturePad.tsx    # Pad otimizado para assinatura com touch
│   └── pages/                            # Views Principais Limpas (Orquestradoras)
│       ├── WorkOrdersPage.tsx            # View Admin reduzida de 2.907 para ~250 linhas
│       └── DashboardPage.tsx             # View Dashboard modular
```

---

## 3. CRONOGRAMA DE EXECUÇÃO EM PLANOS DETALHADOS

A execução será realizada em 6 fases atômicas e sequenciais. **Nenhum plano avançará sem a validação e compilação limpa do anterior.**

---

### PLANO 1: Fundação, Constantes, Utilitários e Camada Compartilhada (DRY)
- **Objetivo:** Eliminar duplicações de código criando o módulo central `src/core/` para formatadores de moeda, datas, telefones, mapeamentos de status de OS e processador de fotos da câmera, sem alterar o comportamento visual existente.
- **Arquivos a Criar:**
  - `src/core/constants/workOrderConstants.ts`
  - `src/core/utils/currencyFormatter.ts`
  - `src/core/utils/dateFormatter.ts`
  - `src/core/utils/phoneFormatter.ts`
  - `src/core/utils/imageProcessor.ts`
- **Arquivos a Refatorar:**
  - `src/pages/WorkOrdersPage.tsx`
  - `src/components/technician/MobileTechnicianView.tsx`
  - `src/components/employee/EmployeeDashboard.tsx`
  - `src/pages/FinancialPage.tsx`
  - `src/pages/QuotesPage.tsx`
  - `src/pages/DashboardPage.tsx`
- **Critério de Validação:**
  - Execução de testes de regressão de formatação;
  - `compile_applet` e `lint_applet` com 0 erros;
  - Interface mantendo exibição visual idêntica em BRL, datas e badges.

---

### PLANO 2: Blindagem de Segurança (RBAC) e Motor de Auditoria/Logs Imutável
- **Objetivo:** Implementar middleware de autenticação obrigatório no backend, travas de perfil (Admin vs Técnico) e transformar a auditoria em um motor confiável que rastreia: quem criou, quem assumiu/pegou, quem alterou status, quem reajustou valor e quem finalizou com diff de dados.
- **Arquivos a Criar:**
  - `server/middlewares/authMiddleware.ts`
  - `server/middlewares/rbacMiddleware.ts`
  - `server/services/auditService.ts`
  - `src/hooks/usePermissions.ts`
  - `src/components/audit/AuditTimeline.tsx`
- **Arquivos a Refatorar:**
  - `server.ts` (integração dos middlewares nas rotas e injeção do usuário autenticado no contexto)
  - `src/context/AuthContext.tsx`
  - `src/pages/AuditLogsPage.tsx`
- **Regras de Segurança Aplicadas:**
  - Rejeição de requisições sem token válido (HTTP 401);
  - Bloqueio de técnicos tentando deletar OS, alterar senhas de outros ou acessar rotas financeiras restritas (HTTP 403);
  - Garantia de que o campo `userId` e `userName` do log de auditoria é preenchido pelo token da sessão, impedindo personificação;
  - Proteção do histórico de auditoria contra deleção ou truncamento acidental.
- **Critério de Validação:**
  - Testes automatizados tentando executar ações privilegiadas com perfil de técnico (deve falhar com 403);
  - Verificação de logs gerados após transição de OS contendo autor, data/hora e payload anterior vs novo.

---

### PLANO 3: Refatoração da Camada de Negócios, Chamados e Faturamento (Core Services)
- **Objetivo:** Isolar as regras de negócio de transição de status da Ordem de Serviço, cálculo de comissão/faturamento e geração de recibos/garantia fora dos componentes de tela.
- **Arquivos a Criar:**
  - `src/services/workOrderStateService.ts` (valida transições permitidas: Ex: não permite ir de ABERTA direto para CONCLUIDA sem passar por EM_ANDAMENTO ou registrar técnico)
  - `src/services/billingService.ts` (cálculo de descontos, formas de pagamento, baixa financeira)
  - `src/hooks/useWorkOrders.ts` (estado centralizado de OS)
- **Arquivos a Refatorar:**
  - `src/lib/api.ts`
  - `server.ts` (extração da lógica de OS para `server/services/workOrderService.ts`)
- **Critério de Validação:**
  - Validação estrita do ciclo de vida da OS em simulação backend e frontend;
  - Baixa financeira refletindo no saldo da empresa sem inconsistências.

---

### PLANO 4: Modularização da Visão do Administrador Geral
- **Objetivo:** Desmembrar o arquivo monolítico `src/pages/WorkOrdersPage.tsx` (2.907 linhas) em componentes especialistas menores (<300 linhas cada), garantindo legibilidade, facilidade de manutenção e zero acoplamento.
- **Arquivos a Criar:**
  - `src/components/workOrders/WorkOrderListTable.tsx`
  - `src/components/workOrders/WorkOrderFilterBar.tsx`
  - `src/components/workOrders/WorkOrderDetailDrawer.tsx`
  - `src/components/workOrders/WorkOrderCreateModal.tsx`
  - `src/components/workOrders/WorkOrderReportTab.tsx`
  - `src/components/workOrders/WorkOrderDispatchPanel.tsx`
- **Arquivos a Refatorar:**
  - `src/pages/WorkOrdersPage.tsx` (transformada em view orquestradora concisa)
- **Critério de Validação:**
  - Abertura, filtro, edição, impressão e despacho de OS funcionando perfeitamente no painel do Administrador;
  - Redução drástica da contagem de linhas do arquivo principal.

---

### PLANO 5: Modularização e Otimização da Visão Mobile (Funcionário)
- **Objetivo:** Refatorar `src/components/technician/MobileTechnicianView.tsx` e `src/components/employee/EmployeeDashboard.tsx`, garantindo performance para dispositivos móveis, baixo consumo de memória, upload rápido de fotos da câmera com compressão e assinatura digital responsiva.
- **Arquivos a Criar:**
  - `src/components/mobile/MobileOrderCard.tsx`
  - `src/components/mobile/MobileStatusActions.tsx`
  - `src/components/mobile/MobilePhotoUploader.tsx`
  - `src/components/mobile/MobileSignaturePad.tsx`
  - `src/hooks/useSignatureCanvas.ts`
  - `src/hooks/usePhotoCapture.ts`
- **Arquivos a Refatorar:**
  - `src/components/technician/MobileTechnicianView.tsx`
  - `src/components/employee/EmployeeDashboard.tsx`
- **Critério de Validação:**
  - Teste da captura de fotos (Câmera ao vivo e Galeria) sem travamentos;
  - Coleta de assinatura touch fluida e salvamento no laudo final;
  - Travas de permissão ativas impedindo visualização de dados financeiros confidenciais da empresa.

---

### PLANO 6: Limpeza Final (Dead Code), Padronização e Revisão Geral
- **Objetivo:** Purga de códigos legados não utilizados, padronização de tratamento de erros com toasts e fallbacks amigáveis, auditoria de dependências e teste de ponta a ponta.
- **Ações:**
  - Remoção de variáveis e importações não utilizadas;
  - Teste do fluxo completo: **Admin abre OS -> Notificação dispara -> Técnico assume no Mobile -> Inicia deslocamento -> Tira fotos e anexa laudo -> Cliente assina na tela do celular -> Técnico conclui -> Admin audita todo o histórico e visualiza o faturamento**.
- **Critério de Validação:**
  - Sucesso em `compile_applet` e `lint_applet`;
  - Execução de script automatizado validando todas as rotas e regras de auditoria.

---

## 4. TERMO DE EXECUÇÃO
Este documento mestre rege todas as etapas da refatoração. A execução será conduzida fase a fase conforme solicitado, mantendo o sistema 100% operacional durante todas as etapas.
