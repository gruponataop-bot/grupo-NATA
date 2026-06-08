package com.natagestao.controllers;

import com.natagestao.models.Projeto;
import com.natagestao.repository.FuncionarioRepository;
import com.natagestao.repository.ProjetoRepository;
import com.natagestao.models.Funcionario;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/projetos")
@CrossOrigin(origins = "*")
public class ProjetoController {

    @Autowired
    private ProjetoRepository repository;

    @Autowired
    private FuncionarioRepository funcionarioRepository;

    @GetMapping
    public List<Projeto> listarTodos() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Projeto> buscarPorId(@PathVariable Long id) {
        Optional<Projeto> projeto = repository.findById(id);
        return projeto.map(ResponseEntity::ok)
                      .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> criar(@RequestBody Projeto projeto) {
        if (projeto.getStatus() == null || projeto.getStatus().isEmpty()) {
            projeto.setStatus("Ativo");
        }
        String erroRegra = validarResponsavelOutroProjetoAtivo(projeto, null);
        if (erroRegra != null) {
            return ResponseEntity.badRequest().body(Map.of("erro", erroRegra));
        }
        normalizarReferenciaFuncionario(projeto);
        return ResponseEntity.ok(repository.save(projeto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(@PathVariable Long id, @RequestBody Projeto dados) {
        return repository.findById(id).map(projeto -> {
            String erroRegra = validarResponsavelOutroProjetoAtivo(dados, id);
            if (erroRegra != null) {
                return ResponseEntity.badRequest().body(Map.of("erro", erroRegra));
            }

            projeto.setNome(dados.getNome());
            projeto.setDescricao(dados.getDescricao());
            projeto.setDataInicio(dados.getDataInicio());
            projeto.setDataFim(dados.getDataFim());
            projeto.setStatus(dados.getStatus());
            projeto.setTipo(dados.getTipo());
            projeto.setPublicoAlvo(dados.getPublicoAlvo());
            projeto.setHorarios(dados.getHorarios());
            projeto.setTermoResponsabilidade(dados.getTermoResponsabilidade());
            projeto.setImagemUrl(dados.getImagemUrl());
            if (dados.getFuncionarioResponsavel() != null && dados.getFuncionarioResponsavel().getId_funcionario() != null) {
                Long fid = dados.getFuncionarioResponsavel().getId_funcionario();
                projeto.setFuncionarioResponsavel(funcionarioRepository.getReferenceById(fid));
            } else {
                projeto.setFuncionarioResponsavel(null);
            }
            return ResponseEntity.ok(repository.save(projeto));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * Um mesmo funcionário não pode ser responsável por mais de um projeto com status Ativo.
     */
    private String validarResponsavelOutroProjetoAtivo(Projeto projeto, Long projetoAtualId) {
        Funcionario responsavel = projeto.getFuncionarioResponsavel();
        if (responsavel == null || responsavel.getId_funcionario() == null) {
            return null;
        }

        Optional<Funcionario> funcionarioOpt = funcionarioRepository.findById(responsavel.getId_funcionario());
        if (funcionarioOpt.isEmpty()) {
            return "Funcionário responsável não encontrado.";
        }

        Funcionario funcionario = funcionarioOpt.get();
        boolean projetoAtivo = projeto.getStatus() != null && projeto.getStatus().equalsIgnoreCase("Ativo");
        if (!projetoAtivo) {
            return null;
        }

        boolean jaResponsavelEmOutroAtivo = (projetoAtualId == null)
            ? repository.existsProjetoAtivoComResponsavel(funcionario.getId_funcionario())
            : repository.existsOutroProjetoAtivoComResponsavel(funcionario.getId_funcionario(), projetoAtualId);

        if (jaResponsavelEmOutroAtivo) {
            return "Este funcionário já é responsável por outro projeto ativo.";
        }

        return null;
    }

    private void normalizarReferenciaFuncionario(Projeto projeto) {
        Funcionario resp = projeto.getFuncionarioResponsavel();
        if (resp != null && resp.getId_funcionario() != null) {
            projeto.setFuncionarioResponsavel(funcionarioRepository.getReferenceById(resp.getId_funcionario()));
        } else {
            projeto.setFuncionarioResponsavel(null);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
