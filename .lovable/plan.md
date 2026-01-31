
## Plano: Sistema de Acompanhamento de Estudos (TDAH-Friendly)

### Problema Identificado

Você tem TDAH e precisa de um sistema visual e intuitivo para:
- Saber **o que já estudou** vs **o que falta estudar**
- Evitar a paralisia de escolha (muitas matérias/tópicos)
- Ter uma visão clara do progresso
- Seguir um estudo mais linear/organizado

---

### Solução Proposta: "Plano de Estudos"

Uma nova seção que mostra todos os seus tópicos organizados com status visual de progresso.

---

### 1. Nova Tabela no Banco de Dados

```
study_progress
├── id (uuid)
├── user_id (uuid) - referência ao usuário
├── folder_id (uuid) - referência ao tema/matéria
├── status: 'not_started' | 'in_progress' | 'completed' | 'review'
├── last_studied_at (timestamp) - última vez que estudou
├── study_sessions (integer) - quantas vezes estudou
├── notes (text) - anotações pessoais
├── priority: 'low' | 'medium' | 'high' - prioridade
├── created_at / updated_at
```

---

### 2. Interface Visual: Página "Plano de Estudos"

```
┌──────────────────────────────────────────────────────────────────────┐
│  📚 PLANO DE ESTUDOS                                                 │
│  Progresso Geral: ████████░░░░░░░░ 45%                               │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │ Filtros:  [Todos ▼]  [Por Matéria ▼]  [Por Prioridade ▼]       │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  LÍNGUA PORTUGUESA                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  ✅ Concordância Verbal          [Concluído]   Última: 2 dias   │ │
│  │  🔄 Regência Nominal             [Revisão]     Última: 5 dias   │ │
│  │  ▶️ Pontuação                    [Estudando]   Última: hoje     │ │
│  │  ⭕ Sintaxe                       [A iniciar]   Prioridade: Alta │ │
│  │  ⭕ Semântica                     [A iniciar]   Prioridade: Média│ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  DIREITO ADMINISTRATIVO                                              │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  ✅ Princípios da Administração  [Concluído]   Última: 1 sem    │ │
│  │  ⭕ Atos Administrativos         [A iniciar]   Prioridade: Alta │ │
│  │  ⭕ Licitações                    [A iniciar]   Prioridade: Média│ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

### 3. Status de Estudo (Visual com Cores)

| Status | Ícone | Cor | Significado |
|--------|-------|-----|-------------|
| `not_started` | ⭕ | Cinza | Ainda não estudou |
| `in_progress` | ▶️ | Azul | Está estudando atualmente |
| `completed` | ✅ | Verde | Concluiu o estudo |
| `review` | 🔄 | Laranja | Precisa revisar |

---

### 4. Funcionalidades TDAH-Friendly

1. **"O que estudar agora?"** - Botão que sugere automaticamente o próximo tópico baseado em:
   - Prioridade definida
   - Tempo desde último estudo
   - Tópicos não iniciados

2. **Progresso Visual** - Barras de progresso coloridas por matéria

3. **Filtros Simples**:
   - Ver apenas "A iniciar"
   - Ver apenas "Precisam revisão"
   - Ordenar por prioridade

4. **Priorização** - Arrastar/clicar para definir prioridade (Alta/Média/Baixa)

5. **Lembretes Visuais** - Badge "Revisar!" quando passou muito tempo sem estudar um tema concluído

6. **Notas Rápidas** - Campo para anotar dificuldades ou observações em cada tópico

---

### 5. Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| `supabase/migrations/xxx_study_progress.sql` | Nova migração |
| `src/integrations/supabase/types.ts` | Atualizar tipos |
| `src/pages/StudyPlanPage.tsx` | Nova página principal |
| `src/components/StudyTopicCard.tsx` | Card de cada tópico |
| `src/components/StudyProgressBar.tsx` | Barra de progresso |
| `src/components/Sidebar.tsx` | Adicionar link "Plano de Estudos" |
| `src/components/MobileNav.tsx` | Adicionar link mobile |
| `src/pages/StudentArea.tsx` | Adicionar nova view |

---

### 6. Nova Navegação na Sidebar

```
📁 Minhas Matérias
🎯 Plano de Estudos    ← NOVO!
🔀 Estudo Aleatório
📚 Flash Cards
📋 Simulado
⏱️ Bater Ponto
📊 Estatísticas
```

---

### 7. Fluxo de Uso

1. Usuário acessa "Plano de Estudos"
2. Vê todas as matérias e tópicos organizados
3. Clica em "O que estudar agora?" para sugestão automática
4. Marca status conforme avança (Em progresso / Concluído / Revisar)
5. Pode adicionar prioridade e notas
6. Visualiza progresso geral e por matéria

---

### 8. Integração com Questões

- Ao acessar questões de um tema, automaticamente marca como "Em progresso"
- Ao acertar X% das questões do tema, sugere marcar como "Concluído"
- Após 7 dias sem acessar um tema concluído, marca como "Revisar"

---

### 9. Resumo Técnico

1. Criar tabela `study_progress` no Supabase
2. Configurar RLS para acesso apenas do próprio usuário
3. Criar página `StudyPlanPage.tsx` com:
   - Lista de matérias expandíveis
   - Cards de tópicos com status
   - Barra de progresso geral
   - Botão "Sugerir próximo estudo"
   - Filtros e ordenação
4. Criar componentes auxiliares
5. Integrar na navegação existente
6. Adicionar lógica de atualização automática ao estudar questões
