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

    public void enviarEmailSenha(String para, String nome, String senhaGerada) {
        SimpleMailMessage message = new SimpleMailMessage();

        message.setFrom("natasistema120@gmail.com");
        message.setTo(para);
        message.setSubject("Bem-vindo! Suas credenciais de acesso");
        message.setText("Ola " + nome + ",\n\n" +
                "Seu cadastro foi realizado com sucesso.\n" +
                "Sua senha temporaria e: " + senhaGerada + "\n\n" +
                "Recomendamos altera-la no primeiro acesso.");

        mailSender.send(message);
    }

    public void enviarEmailRedefinirSenha(String para, String nome, String token) {
        String link = resetPasswordUrl + "?token=" + token;
        SimpleMailMessage message = new SimpleMailMessage();

        message.setFrom("natasistema120@gmail.com");
        message.setTo(para);
        message.setSubject("Redefinicao de Senha");
        message.setText("Ola " + nome + ",\n\n" +
                "Recebemos uma solicitacao para redefinir sua senha.\n\n" +
                "Clique no link abaixo para criar uma nova senha:\n\n" +
                link + "\n\n" +
                "Este link e valido por 15 minutos.\n\n" +
                "Se voce nao solicitou esta redefinicao, desconsidere este e-mail.");

        mailSender.send(message);
    }
}
