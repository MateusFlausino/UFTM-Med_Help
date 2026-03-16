# UFTM Mobile

Documentação do projeto UFTM Mobile, desenvolvido para otimizar a rotina dos estudantes de Medicina da Universidade Federal do Triângulo Mineiro.

## 1. Identidade Visual (UI/UX)

O design foi concebido para transmitir profissionalismo e orgulho institucional, seguindo os padrões visuais da UFTM.

### Cores Oficiais

- **Verde Institucional (`#006837`)**: cor dominante em cabeçalhos, botões principais e estados ativos.
- **Amarelo Ouro (`#F9B233`)**: usado para destaques, alertas e detalhes de matrícula.

### Estilo de Interface

- Design mobile-first com foco em acessibilidade e rapidez.
- Cantos arredondados entre `2.5rem` e `4rem`, criando uma interface moderna e amigável.
- Iconografia vetorial com `lucide-react` para identificação rápida de salas, professores e horários.
- Animações de entrada com `fade-in` e `slide-in` para transições suaves entre abas.

## 2. Funcionalidades Principais

### A. Sistema de Login e Autenticação

- **Firebase Auth** com autenticação anônima inicial, permitindo uso individual sem formulários complexos.
- **UID exclusivo por usuário**, garantindo privacidade dos horários armazenados na nuvem.

### B. Gestor de Horários (SCA)

- **Leitor de PDF (simulado)** para processar a "Relação de Disciplinas por Acadêmico" do SCA.
- **Organização inteligente** das disciplinas de Medicina, com extração de:
  - Nome da disciplina.
  - Professor responsável.
  - Horário e sala/local.
  - Período de vigência, com datas de início e fim.
  - Tipo de aula: teórica, prática ou vivência.

### C. Dashboard Multitarefa

- **Aba "Hoje"** com exibição dinâmica das aulas do dia atual.
- **Aba "Grade"** com visão semanal completa de segunda a sexta.
- **Persistência de dados no Firestore**, eliminando a necessidade de reimportar o PDF em cada acesso.

### D. Cardápio RU Inteligente

- **Integração com IA (Gemini)** para consultar o site oficial da PROACE UFTM em tempo real.
- **Extração via busca Google**, convertendo o cardápio semanal em cartões organizados de almoço e jantar.
- **Coleção pública compartilhada**, permitindo que a sincronização feita por um aluno atualize todos os demais utilizadores.

## 3. Arquitetura Técnica (Stack)

- **Frontend**: React.js com Tailwind CSS.
- **Backend e banco de dados**: Firebase Firestore, com coleções privadas e públicas.
- **Inteligência Artificial**: API Gemini 2.5 Flash Preview.
- **Segurança**: regras de acesso baseadas em UID e isolamento de rotas por `appId`.

## Versão Web e Deploy

O repositório agora inclui uma versão web estática do app, pronta para abrir localmente e servir como base para deploy e empacotamento mobile.

### Abrir localmente

- Abra o arquivo `index.html` diretamente no navegador; ou
- rode `npm start` para subir um servidor local em `http://localhost:4173`.

### Publicar na Vercel

- A estrutura é estática e pode ser publicada diretamente.
- O arquivo `vercel.json` já está incluído para configuração básica de headers.

### Empacotar para mobile

- O arquivo `capacitor.config.json` já foi adicionado como ponto de partida para integração com Capacitor.
- O `manifest.webmanifest` e o `icon.svg` deixam a base preparada para PWA e webview.

## 4. Segurança e Estabilidade

- **Anti-tela branca** com uso de optional chaining (`?.`) e validações de existência antes da renderização.
- **Tratamento de erros** para falhas de Firebase ou conexão, com recuperação segura da aplicação.
- **Fallback de carregamento** com splash screen nas cores da UFTM enquanto os dados são sincronizados.

## 5. Modelo de PDF de Entrada

O aplicativo foi pensado para receber como entrada o PDF oficial gerado pela UFTM com o título **"Relação de Disciplinas por Acadêmico"**.

### Origem do Documento

- Emitido pela UFTM, com cabeçalho institucional da universidade, PROENS e DRCA.
- Contém identificação do curso, período letivo e dados do acadêmico.
- No modelo analisado, o documento possui `4` páginas.

### Estrutura Geral do PDF

#### Página 1

- Cabeçalho institucional.
- Nome do curso: `MEDICINA (Bacharelado)`.
- Período letivo.
- Identificação do acadêmico.
- Tabela-resumo das disciplinas matriculadas com:
  - código e nome da disciplina;
  - carga horária;
  - docente responsável;
  - e-mail do docente;
  - período de vigência.

#### Páginas seguintes

- Organização por **dia da semana**:
  - Segunda;
  - Terça;
  - Quarta;
  - Quinta;
  - Sexta.
- Cada bloco diário apresenta as colunas:
  - período;
  - turma;
  - disciplina;
  - horário;
  - docente.

### Campos Extraíveis pelo App

Com base no modelo real do PDF, o parser pode extrair:

- nome do aluno;
- matrícula/RA;
- curso;
- período letivo;
- disciplina;
- código da disciplina;
- carga horária;
- docente responsável;
- e-mail do docente;
- intervalo de datas de cada bloco;
- dia da semana;
- turma;
- horário da aula.

### Particularidades do Modelo

- Algumas disciplinas aparecem com nome quebrado em mais de uma linha.
- Alguns nomes de docentes também são quebrados em duas linhas.
- Existem blocos com apenas uma data e outros com intervalo de datas.
- O mesmo componente pode surgir em múltiplos blocos ao longo do semestre, com horários e docentes diferentes.
- Há repetições visuais no PDF que exigem deduplicação durante o processamento.

### Exemplo de Conteúdo Encontrado

- `1501.000.015-0 - ANATOMIA HUMANA I`
- `1008.000.133-2 - ANTROPOLOGIA`
- `1501.000.084-2 - BASES CELULARES E MORFOFISIOLÓGICAS I`
- `1003.000.137-1 - INTRODUÇÃO À ÉTICA MÉDICA E CONTEÚDOS HUMANÍSTICOS`
- `1002.000.102-6 - MEDICINA E ESPIRITUALIDADE`
- `1008.000.136-7 - METODOLOGIA CIENTÍFICA`
- `1008.000.132-4 - PSICOLOGIA`
- `1008.000.135-9 - VIVÊNCIAS I`

### Implicações para o Processamento

- O leitor precisa interpretar texto posicional, não apenas linhas simples.
- O sistema deve consolidar blocos separados da mesma disciplina em uma estrutura única por matéria.
- O app deve associar cada ocorrência ao respetivo dia da semana, período e docente.
- É importante prever normalização de textos com acentos, nomes longos e quebras de linha.

## Status do Projeto

O projeto encontra-se funcional e pronto para expansão com novas funcionalidades, como:

- notas;
- faltas;
- eventos acadêmicos.
# UFTM-Med_Help
