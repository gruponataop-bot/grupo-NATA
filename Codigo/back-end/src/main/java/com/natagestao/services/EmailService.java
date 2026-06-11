package com.natagestao.services;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final String remetente;
    private final String resetPasswordUrl;

    public EmailService(
            JavaMailSender mailSender,
            @Value("${app.email.from}") String remetente,
            @Value("${app.frontend.reset-password-url}") String resetPasswordUrl) {
        this.mailSender = mailSender;
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
        SimpleMailMessage mensagem = new SimpleMailMessage();
        mensagem.setFrom(remetente);
        mensagem.setTo(para);
        mensagem.setSubject(assunto);
        mensagem.setText(texto);
        mailSender.send(mensagem);

        return "smtp-" + UUID.randomUUID();
    }
}
