package com.natagestao.repository;

import com.natagestao.models.Funcionario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FuncionarioRepository extends JpaRepository<Funcionario, Long> {

      @Query("select f from Funcionario f where lower(trim(f.email)) = lower(trim(:email))")
      Optional<Funcionario> buscarPorEmailLogin(@Param("email") String email);
      Optional<Funcionario> findByEmailIgnoreCase(String email);
      Optional<Funcionario> findByEmail(String email);
      boolean existsByEmail(String email);
      boolean existsByCpf(String cpf);
}
