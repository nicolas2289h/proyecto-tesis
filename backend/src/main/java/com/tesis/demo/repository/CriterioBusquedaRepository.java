package com.tesis.demo.repository;

import com.tesis.demo.model.CriterioBusqueda;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CriterioBusquedaRepository extends JpaRepository<CriterioBusqueda, Long> {

    List<CriterioBusqueda> findByCategoriaId(Long categoriaId);

    boolean existsByTerminoBusquedaIgnoreCaseAndCategoriaId(String terminoBusqueda, Long categoriaId);

    CriterioBusqueda findByTerminoBusquedaIgnoreCase(String terminoBusqueda);
}
