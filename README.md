# Agenda DAGV

Painel web do DAGV voltado aos estudantes de Medicina, preparado para reunir horários, RU e o PDF do SCA sem depender de serviço pago.

## O que já está pronto

- perfil local do aluno por navegador/aparelho;
- upload do PDF real do SCA com armazenamento local em IndexedDB;
- escolha de um PDF ativo por aluno neste aparelho;
- cardápio do dia da Unidade Abadia via rota `/api/ru-abadia`;
- interface pronta para deploy estático na Vercel.

## Como funciona o modo local

1. O aluno abre o app e informa nome e e-mail.
2. O perfil é salvo localmente neste navegador.
3. O PDF oficial do SCA é armazenado no próprio aparelho.
4. O app extrai dados do aluno, disciplinas e horários do PDF.
5. O arquivo pode ser aberto novamente e marcado como PDF ativo.
6. As abas `Hoje` e `Semana` mostram a agenda acadêmica importada.

## Limitações desta alternativa

- os dados não sincronizam entre aparelhos;
- se o aluno limpar os dados do navegador, precisará reenviar o PDF;
- o reconhecimento depende do PDF oficial do SCA em formato textual.

## Estrutura principal

- [index.html](C:/Users/flaus/Downloads/UFTM%20medmbile/index.html): entrada da aplicação
- [app.local.js](C:/Users/flaus/Downloads/UFTM%20medmbile/app.local.js): fluxo local do aluno e uploads do PDF
- [app.js](C:/Users/flaus/Downloads/UFTM%20medmbile/app.js): implementação anterior do projeto
- [styles.css](C:/Users/flaus/Downloads/UFTM%20medmbile/styles.css): identidade visual
- [api/ru-abadia.js](C:/Users/flaus/Downloads/UFTM%20medmbile/api/ru-abadia.js): endpoint do cardápio RU
- [ru-abadia.js](C:/Users/flaus/Downloads/UFTM%20medmbile/ru-abadia.js): extração do cardápio oficial

## Rodar localmente

```bash
npm start
```

Abra:

- `http://localhost:4173`

## Deploy na Vercel

O projeto continua compatível com deploy simples na Vercel.

- publique o repositório no GitHub;
- importe o projeto na Vercel;
- mantenha `Framework Preset` como `Other`;
- a publicação pode ser feita direto da branch principal.

## Próximo passo natural

Os próximos avanços técnicos mais úteis agora são:

- adicionar cobrança e autenticação online;
- sincronizar os PDFs entre aparelhos;
- ampliar a leitura para novos formatos de relatório acadêmico.
