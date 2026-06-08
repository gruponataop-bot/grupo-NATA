package com.natagestao.repository;

import com.natagestao.models.Observacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ObservacaoRepository extends JpaRepository<Observacao, Long> {
    List<Observacao> findByTipoUsuarioAndIdUsuarioRelacionadoOrderByDataRegistroDesc(String tipoUsuario, Long idUsuarioRelacionado);
}