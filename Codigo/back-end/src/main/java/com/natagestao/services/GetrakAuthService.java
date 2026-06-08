package com.natagestao.services;

import com.natagestao.dto.GetrakTokenDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

@Service
public class GetrakAuthService {

    // Puxando as chaves do application.properties
    @Value("${getrak.api.url}")
    private String apiUrl;

    @Value("${getrak.client.id}")
    private String clientId;

    @Value("${getrak.client.secret}")
    private String clientSecret;

    @Value("${getrak.username}")
    private String username;

    @Value("${getrak.password}")
    private String password;

    /**
     * Autentica na Getrak via OAuth2 (Fluxo Client Password)
     * @return O token de acesso String (Access Token)
     */
    public String gerarToken() {
        // Bloqueio de segurança enquanto as chaves não chegam
        if ("aguardando_chave".equals(clientId)) {
            System.out.println("Aviso: Tentativa de login Getrak ignorada. Chaves ainda não configuradas.");
            return "token_mock_temporario";
        }

        try {
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            
            // Define o tipo de corpo que a documentação pede
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            
            // O auth: { username: 'ClientID', password: 'ClientSecret' } do Javascript 
            // se traduz para Basic Auth no Java
            headers.setBasicAuth(clientId, clientSecret);

            // Monta o formulário de login do usuário (Gconnect)
            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("grant_type", "password");
            body.add("username", username);
            body.add("password", password);

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

            // Endpoint exato mostrado na documentação da Getrak
            String endpoint = apiUrl + "/newkoauth/oauth/token";

            ResponseEntity<GetrakTokenDTO> response = restTemplate.postForEntity(
                    endpoint, 
                    request, 
                    GetrakTokenDTO.class
            );

            if (response.getBody() != null) {
                return response.getBody().getAccessToken();
            }

        } catch (Exception e) {
            System.err.println("Erro ao autenticar na Getrak: " + e.getMessage());
        }
        
        return null;
    }
}