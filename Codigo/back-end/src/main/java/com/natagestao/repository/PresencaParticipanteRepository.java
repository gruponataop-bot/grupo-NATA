package com.natagestao.repository;

import com.natagestao.models.PresencaParticipante;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PresencaParticipanteRepository extends JpaRepository<PresencaParticipante, Long> {
    List<PresencaParticipante> findByIdProjetoAndDataChamadaOrderByIdParticipanteAsc(Long idProjeto, LocalDate dataChamada);
    Optional<PresencaParticipante> findByIdProjetoAndIdParticipanteAndDataChamada(Long idProjeto, Long idParticipante, LocalDate dataChamada);
}