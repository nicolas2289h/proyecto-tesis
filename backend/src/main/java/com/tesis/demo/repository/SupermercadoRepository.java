package com.tesis.demo.repository;

import com.tesis.demo.model.Supermercado;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface SupermercadoRepository extends JpaRepository<Supermercado, Long> {
    Optional<Supermercado> findByNombreIgnoreCase(String nombre);
}
