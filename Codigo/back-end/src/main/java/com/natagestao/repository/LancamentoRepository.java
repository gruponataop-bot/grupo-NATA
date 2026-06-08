package com.natagestao.repository;

import com.natagestao.models.Lancamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface LancamentoRepository extends JpaRepository<Lancamento, Long> {

    List<Lancamento> findAllByOrderByDataDesc();

    List<Lancamento> findByDataBetweenOrderByDataDesc(LocalDate inicio, LocalDate fim);

    @Query("SELECT COALESCE(SUM(l.valor), 0) FROM Lancamento l WHERE l.tipo = :tipo AND l.data BETWEEN :inicio AND :fim")
    BigDecimal somarPorTipoEPeriodo(@Param("tipo") String tipo,
                                    @Param("inicio") LocalDate inicio,
                                    @Param("fim") LocalDate fim);

    @Query("SELECT COALESCE(SUM(l.valor), 0) FROM Lancamento l WHERE l.tipo = :tipo")
    BigDecimal somarPorTipo(@Param("tipo") String tipo);
}
