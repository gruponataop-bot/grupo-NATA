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
    private final String remetente;
    private final String resetPasswordUrl;

    public EmailService(
            RestClient.Builder restClientBuilder,
            @Value("${resend.api-key}") String apiKey,
            @Value("${resend.from}") String remetente,
            @Value("${app.frontend.reset-password-url}") String resetPasswordUrl) {
        this.restClient = restClientBuilder.baseUrl("https://api.resend.com").build();
        this.apiKey = apiKey;
        this.remetente = remetente;
        this.resetPasswordUrl = resetPasswordUrl;
    }

    public String enviarEmailSenha(String para, String nome, String senhaGerada) {
        String texto = "Ola " + nome + ",\n\n"
                + "Seu cadastro foi realizado com sucesso.\n"
                + "Sua senha temporaria e: " + senhaGerada + "\n\n"
                + "Recomendamos altera-la no primeiro acesso.";

        return enviar(para, "Bem-vindo! Suas credenciais de acesso", texto);
    }

    public void enviarEmailRedefinirSenha(String para, String nome, String token) {
        String separador = resetPasswordUrl.contains("?") ? "&" : "?";
        String link = resetPasswordUrl + separador + "token=" + token;
        String texto = "Ola " + nome + ",\n\n"
                + "Recebemos uma solicitacao para redefinir sua senha.\n\n"
                + "Acesse o link abaixo para criar uma nova senha:\n\n"
                + link + "\n\n"
                + "Este link e valido por 15 minutos.\n\n"
                + "Se voce nao solicitou esta redefinicao, desconsidere este e-mail.";

        enviar(para, "Redefinicao de senha", texto);
    }

    private String enviar(String para, String assunto, String texto) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("RESEND_API_KEY nao configurada.");
        }
        if (remetente == null || remetente.isBlank()) {
            throw new IllegalStateException("RESEND_FROM nao configurado.");
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> resposta = restClient.post()
                .uri("/emails")
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", "Bearer " + apiKey)
                .body(Map.of(
                        "from", remetente,
                        "to", new String[] { para },
                        "subject", assunto,
                        "text", texto))
                .retrieve()
                .body(Map.class);

        Object id = resposta == null ? null : resposta.get("id");
        if (id == null || id.toString().isBlank()) {
            throw new IllegalStateException("O Resend nao retornou o ID do e-mail.");
        }
        return id.toString();
    }
}
