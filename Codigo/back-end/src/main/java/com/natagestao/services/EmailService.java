package com.natagestao.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void enviarEmailSenha(String para, String nome, String senhaGerada) {
        SimpleMailMessage message = new SimpleMailMessage();
        
        message.setFrom("natasistema120@gmail.com");
        message.setTo(para);
        message.setSubject("Bem-vindo! Suas credenciais de acesso");
        message.setText("Olá " + nome + ",\n\n" +
                        "Seu cadastro foi realizado com sucesso.\n" +
                        "Sua senha temporária é: " + senhaGerada + "\n\n" +
                        "Recomendamos alterá-la no primeiro acesso.");

        mailSender.send(message);
    }

   public void enviarEmailRedefinirSenha(String para, String nome, String token) {
    try {
        // URL da página do front-end
        String link = "http://127.0.0.1:5500/Codigo/front-end/pages/resetarSenha.html?token=" + token;
        SimpleMailMessage message = new SimpleMailMessage();

        message.setFrom("natasistema120@gmail.com");
        message.setTo(para);
        message.setSubject("Redefinição de Senha");

        message.setText(
            "Olá " + nome + ",\n\n" +
            "Recebemos uma solicitação para redefinir sua senha.\n\n" +
            "Clique no link abaixo para criar uma nova senha:\n\n" +
            link + "\n\n" +
            "Este link é válido por 15 minutos.\n\n" +
            "Se você não solicitou esta redefinição, desconsidere este e-mail."
        );

        mailSender.send(message);

        System.out.println("E-mail com link enviado com sucesso!");
    } catch (Exception e) {
        System.out.println("Erro ao enviar e-mail:");
        e.printStackTrace();
    }
}
}
