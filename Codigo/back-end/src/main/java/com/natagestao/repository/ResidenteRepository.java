package com.natagestao.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.natagestao.models.Residente;

@Repository
public interface ResidenteRepository extends JpaRepository<Residente, Long> {
    // Vazio mesmo! O JpaRepository já tem tudo pronto por baixo dos panos.
}   
