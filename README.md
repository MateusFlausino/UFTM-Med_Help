# Agenda DAGV

Painel web do DAGV voltado aos estudantes de Medicina, preparado para reunir horários, RU e o PDF do SCA em uma experiência online com autenticação.

## O que já está pronto

- conta do aluno com login Google via Supabase Auth;
- upload do PDF real do SCA para o Supabase Storage;
- metadados do aluno e dados extraídos salvos no Postgres da Supabase;
- escolha de um PDF ativo por conta;
- cardápio do dia da Unidade Abadia via rota `/api/ru-abadia`;
- interface pronta para deploy estático na Vercel.

## Como funciona o modo online

1. O aluno entra com a conta Google.
2. O Supabase Auth gerencia a sessão do navegador.
3. O PDF oficial do SCA é lido no navegador e enviado para o bucket privado `student-pdfs`.
4. O app salva em `profiles` e `uploads` o perfil, o PDF ativo e os dados extraídos do arquivo.
5. A mesma conta pode acessar os PDFs e a agenda em outros aparelhos.

## Limitações desta alternativa

- o reconhecimento depende do PDF oficial do SCA em formato textual;
- é preciso configurar o provider Google na Supabase e no Google Cloud;
- o bucket privado e as policies do Storage precisam existir no projeto.

## Estrutura principal

- [index.html](C:/Users/flaus/Downloads/UFTM%20medmbile/index.html): entrada da aplicação
- [app.local.js](C:/Users/flaus/Downloads/UFTM%20medmbile/app.local.js): fluxo online do aluno, autenticação Google e uploads do PDF
- [supabase-config.js](C:/Users/flaus/Downloads/UFTM%20medmbile/supabase-config.js): URL, chave pública e bucket do projeto Supabase
- [supabase/schema.sql](C:/Users/flaus/Downloads/UFTM%20medmbile/supabase/schema.sql): tabelas, RLS e policies do Storage
- [app.js](C:/Users/flaus/Downloads/UFTM%20medmbile/app.js): implementação anterior do projeto
- [styles.css](C:/Users/flaus/Downloads/UFTM%20medmbile/styles.css): identidade visual
- [api/ru-abadia.js](C:/Users/flaus/Downloads/UFTM%20medmbile/api/ru-abadia.js): endpoint do cardápio RU
- [ru-abadia.js](C:/Users/flaus/Downloads/UFTM%20medmbile/ru-abadia.js): extração do cardápio oficial

## Configuração do Supabase

1. Crie um projeto na Supabase.
2. Em `Authentication > URL Configuration`, adicione `http://localhost:4173/**` e a URL de produção.
3. Em `Authentication > Providers > Google`, habilite o provider e preencha `Client ID` e `Client Secret`.
4. No Google Cloud Console, adicione o callback `https://<project-ref>.supabase.co/auth/v1/callback` em `Authorized redirect URIs`.
5. Rode o SQL de [supabase/schema.sql](C:/Users/flaus/Downloads/UFTM%20medmbile/supabase/schema.sql) no `SQL Editor`.
6. Preencha o arquivo [supabase-config.js](C:/Users/flaus/Downloads/UFTM%20medmbile/supabase-config.js) com a `Project URL` e a `Publishable Key`.

## Observação importante sobre custo

Esta versão foi ajustada para Supabase porque o fluxo de login Google e bucket privado cabe melhor na faixa gratuita para este projeto.

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

- mover a extração do PDF para um worker/backend dedicado;
- adicionar remoção de PDF e limpeza do bucket direto pela interface;
- monitorar uso de Storage e ajustar limites do bucket;
- ampliar a leitura para novos formatos de relatório acadêmico.
