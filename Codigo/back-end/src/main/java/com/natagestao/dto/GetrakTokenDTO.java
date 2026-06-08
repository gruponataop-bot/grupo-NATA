package com.natagestao.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class GetrakTokenDTO {
    
    @JsonProperty("access_token")
    private String accessToken;
    
    @JsonProperty("expires_in")
    private Integer expiresIn;
    
    @JsonProperty("token_type")
    private String tokenType;

    // Getters
    public String getAccessToken() { return accessToken; }
    public Integer getExpiresIn() { return expiresIn; }
    public String getTokenType() { return tokenType; }

    // Setters
    public void setAccessToken(String accessToken) { this.accessToken = accessToken; }
    public void setExpiresIn(Integer expiresIn) { this.expiresIn = expiresIn; }
    public void setTokenType(String tokenType) { this.tokenType = tokenType; }
}