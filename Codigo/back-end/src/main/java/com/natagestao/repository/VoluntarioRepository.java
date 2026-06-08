package com.natagestao.repository;

import com.natagestao.models.Voluntario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VoluntarioRepository extends JpaRepository<Voluntario, Long> {
    // Vazio mesmo! O JpaRepository já tem tudo pronto por baixo dos panos.
}