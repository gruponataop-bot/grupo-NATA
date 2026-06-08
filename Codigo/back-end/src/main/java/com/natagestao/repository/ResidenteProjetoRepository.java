package com.natagestao.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.natagestao.models.ResidenteProjeto;

public interface ResidenteProjetoRepository extends JpaRepository<ResidenteProjeto, Long> {
    List<ResidenteProjeto> findByIdProjeto(Long idProjeto);
    Optional<ResidenteProjeto> findByIdProjetoAndIdResidente(Long idProjeto, Long idResidente);
    boolean existsByIdProjetoAndIdResidente(Long idProjeto, Long idResidente);
}