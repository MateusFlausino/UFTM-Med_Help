# Agenda DAGV

Painel web do DAGV voltado aos estudantes de Medicina, preparado para reunir horários, RU e o PDF do SCA em uma experiência online com autenticação.

## O que já está pronto

- conta do aluno com email e senha via Firebase Authentication;
- upload do PDF real do SCA para o Firebase Storage;
- metadados do aluno e dados extraídos salvos no Cloud Firestore;
- escolha de um PDF ativo por conta;
- cardápio do dia da Unidade Abadia via rota `/api/ru-abadia`;
- interface pronta para deploy estático na Vercel.

## Como funciona o modo online

1. O aluno cria a conta com nome, e-mail e senha.
2. O Firebase Authentication guarda a senha da conta.
3. O PDF oficial do SCA é lido no navegador e enviado para o Firebase Storage.
4. O app salva no Firestore o perfil, o PDF ativo e os dados extraídos do arquivo.
5. A mesma conta pode acessar os PDFs e a agenda em outros aparelhos.

## Limitações desta alternativa

- o reconhecimento depende do PDF oficial do SCA em formato textual;
- o Firebase Storage precisa estar habilitado no projeto;
- se o Storage do Firebase não estiver configurado, o login funciona, mas o envio do PDF falha.

## Estrutura principal

- [index.html](C:/Users/flaus/Downloads/UFTM%20medmbile/index.html): entrada da aplicação
- [app.local.js](C:/Users/flaus/Downloads/UFTM%20medmbile/app.local.js): fluxo online do aluno, autenticação e uploads do PDF
- [app.js](C:/Users/flaus/Downloads/UFTM%20medmbile/app.js): implementação anterior do projeto
- [styles.css](C:/Users/flaus/Downloads/UFTM%20medmbile/styles.css): identidade visual
- [api/ru-abadia.js](C:/Users/flaus/Downloads/UFTM%20medmbile/api/ru-abadia.js): endpoint do cardápio RU
- [ru-abadia.js](C:/Users/flaus/Downloads/UFTM%20medmbile/ru-abadia.js): extração do cardápio oficial

## Configuração do Firebase

1. Em `Authentication > Sign-in method`, habilite `Email/Password`.
2. Em `Authentication > Settings > Authorized domains`, adicione o domínio local e o de produção.
3. Crie um banco do `Cloud Firestore`.
4. Habilite o `Firebase Storage`.
5. Publique as regras de [firestore.rules](C:/Users/flaus/Downloads/UFTM%20medmbile/firestore.rules) e [storage.rules](C:/Users/flaus/Downloads/UFTM%20medmbile/storage.rules).
6. Preencha o arquivo [firebase-config.js](C:/Users/flaus/Downloads/UFTM%20medmbile/firebase-config.js) com as credenciais do projeto.

## Observação importante sobre custo

O app usa Firebase porque o projeto já estava estruturado nele. Porém o Cloud Storage for Firebase passou a exigir projeto no plano Blaze para manter o bucket padrão ativo, mesmo quando o uso fica dentro da faixa sem cobrança. Se você quiser uma opção estritamente gratuita sem billing account, o caminho mais alinhado é migrar para Supabase.

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
- adicionar recuperação de senha e verificação de e-mail na interface;
- monitorar uso de Storage e decidir entre Firebase Blaze ou migração para Supabase;
- ampliar a leitura para novos formatos de relatório acadêmico.
