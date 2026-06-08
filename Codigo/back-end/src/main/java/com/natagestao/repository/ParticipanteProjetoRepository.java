package com.natagestao.repository;

import com.natagestao.models.ParticipanteProjeto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ParticipanteProjetoRepository extends JpaRepository<ParticipanteProjeto, Long> {
    List<ParticipanteProjeto> findByIdProjeto(Long idProjeto);
    Optional<ParticipanteProjeto> findByIdProjetoAndIdParticipante(Long idProjeto, Long idParticipante);
    boolean existsByIdProjetoAndIdParticipante(Long idProjeto, Long idParticipante);
}
