package com.natagestao.repository;

import com.natagestao.models.Projeto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ProjetoRepository extends JpaRepository<Projeto, Long> {

    /**
     * Não usar nomes derivados com {@code id_funcionario}: o underscore no nome da propriedade
     * conflita com o parser de underscores do Spring Data.
     */
    @Query("SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END FROM Projeto p WHERE p.funcionarioResponsavel.id_funcionario = :fid AND LOWER(TRIM(p.status)) = 'ativo'")
    boolean existsProjetoAtivoComResponsavel(@Param("fid") Long fid);

    @Query("SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END FROM Projeto p WHERE p.funcionarioResponsavel.id_funcionario = :fid AND LOWER(TRIM(p.status)) = 'ativo' AND p.id <> :pid")
    boolean existsOutroProjetoAtivoComResponsavel(@Param("fid") Long fid, @Param("pid") Long pid);
}
