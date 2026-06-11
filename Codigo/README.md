# Codigo do Projeto

## Configuracao do Resend no Render

1. No Resend, verifique um dominio e crie uma API key.
2. No servico do back-end no Render, configure:
   - `RESEND_API_KEY`: a chave criada no Resend.
   - `RESEND_FROM`: remetente pertencente ao dominio verificado, por exemplo `NATA Gestao <acesso@seudominio.com>`.
   - `APP_FRONTEND_RESET_PASSWORD_URL`: URL publica da pagina `resetarSenha.html`.
3. Faca um novo deploy do back-end.

Enquanto um dominio nao estiver verificado, o remetente de teste `onboarding@resend.dev`
so pode ser usado conforme as restricoes da conta Resend.

As senhas sao armazenadas como hash BCrypt. Senhas antigas em texto puro sao migradas
automaticamente para BCrypt depois de um login bem-sucedido.

Configure tambem `DB_URL`, `DB_USERNAME` e `DB_PASSWORD` no Render. Credenciais nunca
devem ser gravadas no `application.properties`.
