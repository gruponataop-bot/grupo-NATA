package com.natagestao.services;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${app.frontend.reset-password-url}")
    private String resetPasswordUrl;

    @Value("${app.email.resend-api-key:}")
    private String resendApiKey;

    @Value("${app.email.from:NATA <onboarding@resend.dev>}")
    private String remetente;

    private final RestClient resendClient = RestClient.builder()
            .baseUrl("https://api.resend.com")
            .defaultHeader("User-Agent", "NATA-Gestao/1.0")
            .build();

    public void enviarEmailSenha(String para, String nome, String senhaGerada) {
        String texto = "Ola " + nome + ",\n\n" +
                "Seu cadastro foi realizado com sucesso.\n" +
                "Sua senha temporaria e: " + senhaGerada + "\n\n" +
                "Recomendamos altera-la no primeiro acesso.";

        enviar(para, "Bem-vindo! Suas credenciais de acesso", texto);
    }

    public void enviarEmailRedefinirSenha(String para, String nome, String token) {
        String link = resetPasswordUrl + "?token=" + token;
        String texto = "Ola " + nome + ",\n\n" +
                "Recebemos uma solicitacao para redefinir sua senha.\n\n" +
                "Clique no link abaixo para criar uma nova senha:\n\n" +
                link + "\n\n" +
                "Este link e valido por 15 minutos.\n\n" +
                "Se voce nao solicitou esta redefinicao, desconsidere este e-mail.";

        enviar(para, "Redefinicao de Senha", texto);
    }

    private void enviar(String para, String assunto, String texto) {
        if (resendApiKey != null && !resendApiKey.isBlank()) {
            enviarComResend(para, assunto, texto);
            return;
        }

        enviarComSmtp(para, assunto, texto);
    }

    private void enviarComResend(String para, String assunto, String texto) {
        resendClient.post()
                .uri("/emails")
                .header("Authorization", "Bearer " + resendApiKey)
                .body(Map.of(
                        "from", remetente,
                        "to", para,
                        "subject", assunto,
                        "text", texto))
                .retrieve()
                .toBodilessEntity();
    }

    private void enviarComSmtp(String para, String assunto, String texto) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("natasistema120@gmail.com");
        message.setTo(para);
        message.setSubject(assunto);
        message.setText(texto);
        mailSender.send(message);
    }
}
