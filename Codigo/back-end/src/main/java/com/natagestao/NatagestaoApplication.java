package com.natagestao;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class NatagestaoApplication {

    public static void main(String[] args) {
        SpringApplication.run(NatagestaoApplication.class, args);
    }

}