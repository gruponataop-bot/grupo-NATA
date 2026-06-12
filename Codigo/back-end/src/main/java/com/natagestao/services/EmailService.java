package com.natagestao.services;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class EmailService {

    private final RestClient restClient;
    private final String apiKey;
    private final String remetenteEmail;
    private final String remetenteNome;
    private final String resetPasswordUrl;

    public EmailService(
            RestClient.Builder restClientBuilder,
            @Value("${brevo.api-key}") String apiKey,
            @Value("${brevo.from-email}") String remetenteEmail,
            @Value("${brevo.from-name}") String remetenteNome,
            @Value("${app.frontend.reset-password-url}") String resetPasswordUrl) {
        this.restClient = restClientBuilder.baseUrl("https://api.brevo.com/v3").build();
        this.apiKey = apiKey;
        this.remetenteEmail = remetenteEmail;
        this.remetenteNome = remetenteNome;
        this.resetPasswordUrl = resetPasswordUrl;
    }

    public String enviarEmailSenha(String para, String nome, String senhaGerada) {
        String texto = "Ola " + nome + ",\n\n"
                + "Seu cadastro foi realizado com sucesso.\n"
                + "Sua senha temporaria e: " + senhaGerada + "\n\n"
                + "Recomendamos altera-la no primeiro acesso.";

        return enviar(para, nome, "Bem-vindo! Suas credenciais de acesso", texto);
    }

    public String enviarEmailRedefinirSenha(String para, String nome, String token) {
        String separador = resetPasswordUrl.contains("?") ? "&" : "?";
        String link = resetPasswordUrl + separador + "token=" + token;
        String texto = "Ola " + nome + ",\n\n"
                + "Recebemos uma solicitacao para redefinir sua senha.\n\n"
                + "Acesse o link abaixo para criar uma nova senha:\n\n"
                + link + "\n\n"
                + "Este link e valido por 15 minutos.\n\n"
                + "Se voce nao solicitou esta redefinicao, desconsidere este e-mail.";

        return enviar(para, nome, "Redefinicao de senha", texto);
    }

    private String enviar(String para, String nomeDestinatario, String assunto, String texto) {
        validarConfiguracao();

        @SuppressWarnings("unchecked")
        Map<String, Object> resposta = restClient.post()
                .uri("/smtp/email")
                .contentType(MediaType.APPLICATION_JSON)
                .header("api-key", apiKey)
                .body(Map.of(
                        "sender", Map.of("name", remetenteNome, "email", remetenteEmail),
                        "to", new Object[] { Map.of("name", nomeDestinatario, "email", para) },
                        "subject", assunto,
                        "textContent", texto))
                .retrieve()
                .body(Map.class);

        Object messageId = resposta == null ? null : resposta.get("messageId");
        if (messageId == null || messageId.toString().isBlank()) {
            throw new IllegalStateException("O Brevo nao retornou o ID da mensagem.");
        }
        return messageId.toString();
    }

    private void validarConfiguracao() {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("BREVO_API_KEY nao configurada.");
        }
        if (remetenteEmail == null || remetenteEmail.isBlank()) {
            throw new IllegalStateException("BREVO_FROM_EMAIL nao configurado.");
        }
        if (remetenteNome == null || remetenteNome.isBlank()) {
            throw new IllegalStateException("BREVO_FROM_NAME nao configurado.");
        }
    }
}
