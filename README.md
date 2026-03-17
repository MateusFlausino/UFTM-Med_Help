# UFTM Mobile

Versão web do UFTM Mobile voltada aos estudantes de Medicina da UFTM, agora preparada para funcionar sem Firebase e sem serviço pago.

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
4. O arquivo pode ser aberto novamente e marcado como PDF ativo.
5. As abas `Hoje` e `Grade` ficam prontas para receber o parser real depois.

## Limitações desta alternativa

- os dados não sincronizam entre aparelhos;
- se o aluno limpar os dados do navegador, precisará reenviar o PDF;
- o parser do PDF ainda não foi ligado nesta etapa.

## Estrutura principal

- [index.html](C:/Users/flaus/Downloads/UFTM%20medmbile/index.html): entrada da aplicação
- [app.local.js](C:/Users/flaus/Downloads/UFTM%20medmbile/app.local.js): fluxo local do aluno e uploads do PDF
- [app.js](C:/Users/flaus/Downloads/UFTM%20medmbile/app.js): implementação anterior baseada em Firebase
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

O próximo avanço técnico é ligar o parser real do PDF ativo para preencher:

- aba `Hoje`;
- aba `Grade`;
- lista de disciplinas;
- salas, docentes e vigências.
