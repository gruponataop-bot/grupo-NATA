package com.natagestao.controllers;

import com.natagestao.models.Lancamento;
import com.natagestao.repository.LancamentoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/lancamentos")
@CrossOrigin(origins = "*")
public class LancamentoController {

    @Autowired
    private LancamentoRepository repository;

    @GetMapping
    public List<Lancamento> listarTodos(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim) {
        if (dataInicio != null && dataFim != null) {
            return repository.findByDataBetweenOrderByDataDesc(dataInicio, dataFim);
        }
        return repository.findAllByOrderByDataDesc();
    }

    @GetMapping("/resumo")
    public ResponseEntity<Map<String, Object>> resumo(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFim) {
        BigDecimal totalEntradas;
        BigDecimal totalSaidas;
        if (dataInicio != null && dataFim != null) {
            totalEntradas = repository.somarPorTipoEPeriodo("ENTRADA", dataInicio, dataFim);
            totalSaidas = repository.somarPorTipoEPeriodo("SAIDA", dataInicio, dataFim);
        } else {
            totalEntradas = repository.somarPorTipo("ENTRADA");
            totalSaidas = repository.somarPorTipo("SAIDA");
        }
        BigDecimal saldo = totalEntradas.subtract(totalSaidas);
        return ResponseEntity.ok(Map.of(
                "totalEntradas", totalEntradas,
                "totalSaidas", totalSaidas,
                "saldo", saldo
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Lancamento> buscarPorId(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> criar(@RequestBody Lancamento lancamento) {
        ResponseEntity<?> erro = validar(lancamento);
        if (erro != null) return erro;
        return ResponseEntity.ok(repository.save(lancamento));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(@PathVariable Long id, @RequestBody Lancamento dados) {
        ResponseEntity<?> erro = validar(dados);
        if (erro != null) return erro;
        return repository.findById(id).map(l -> {
            l.setTipo(dados.getTipo());
            l.setValor(dados.getValor());
            l.setDescricao(dados.getDescricao());
            l.setDestinatario(dados.getDestinatario());
            l.setData(dados.getData());
            l.setCategoria(dados.getCategoria());
            l.setFormaPagamento(dados.getFormaPagamento());
            l.setComprovanteUrl(dados.getComprovanteUrl());
            l.setObservacoes(dados.getObservacoes());
            return ResponseEntity.ok(repository.save(l));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private ResponseEntity<?> validar(Lancamento lancamento) {
        if (lancamento.getTipo() == null ||
                (!lancamento.getTipo().equals("ENTRADA") && !lancamento.getTipo().equals("SAIDA"))) {
            return ResponseEntity.badRequest().body(Map.of("erro", "Tipo inválido. Use ENTRADA ou SAIDA."));
        }
        if (lancamento.getValor() == null || lancamento.getValor().compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.badRequest().body(Map.of("erro", "Valor deve ser maior que zero."));
        }
        if (lancamento.getDescricao() == null || lancamento.getDescricao().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("erro", "Descrição é obrigatória."));
        }
        if (lancamento.getData() == null) {
            return ResponseEntity.badRequest().body(Map.of("erro", "Data é obrigatória."));
        }
        if (lancamento.getCategoria() == null || lancamento.getCategoria().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("erro", "Categoria é obrigatória."));
        }
        if ("SAIDA".equals(lancamento.getTipo()) &&
                (lancamento.getDestinatario() == null || lancamento.getDestinatario().isBlank())) {
            return ResponseEntity.badRequest().body(Map.of("erro", "Destinatário obrigatório para saídas."));
        }
        return null;
    }
}
