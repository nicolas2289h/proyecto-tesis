package com.tesis.demo.repository;

import com.tesis.demo.model.HistorialPrecio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HistorialPrecioRepository extends JpaRepository<HistorialPrecio, Long> {
    List<HistorialPrecio> findByProductoTiendaIdOrderByFechaRecoleccionDesc(Long productoTiendaId);
    Optional<HistorialPrecio> findTopByProductoTiendaIdOrderByFechaRecoleccionDesc(Long productoTiendaId);
}
