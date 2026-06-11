package com.natagestao.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${app.frontend.reset-password-url}")
    private String resetPasswordUrl;

    @Value("${spring.mail.username}")
    private String remetente;

    public void enviarEmailSenha(String para, String nome, String senhaGerada) {
        String texto = "Olá " + nome + ",\n\n"
                + "Seu cadastro foi realizado com sucesso.\n"
                + "Sua senha temporária é: " + senhaGerada + "\n\n"
                + "Recomendamos alterá-la no primeiro acesso.";

        enviar(para, "Bem-vindo! Suas credenciais de acesso", texto);
    }

    public void enviarEmailRedefinirSenha(String para, String nome, String token) {
        String separador = resetPasswordUrl.contains("?") ? "&" : "?";
        String link = resetPasswordUrl + separador + "token=" + token;
        String texto = "Olá " + nome + ",\n\n"
                + "Recebemos uma solicitação para redefinir sua senha.\n\n"
                + "Clique no link abaixo para criar uma nova senha:\n\n"
                + link + "\n\n"
                + "Este link á válido por 15 minutos.\n\n"
                + "Se você não solicitou esta redefinição, desconsidere este e-mail.";

        enviar(para, "Redefinicao de Senha", texto);
    }

    private void enviar(String para, String assunto, String texto) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(remetente);
        message.setTo(para);
        message.setSubject(assunto);
        message.setText(texto);
        mailSender.send(message);
    }
}
