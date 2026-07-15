package com.tesis.demo.repository;

import com.tesis.demo.dto.ProductoBusquedaDto;
import com.tesis.demo.model.HistorialPrecio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface HistorialPrecioRepository extends JpaRepository<HistorialPrecio, Long> {
    List<HistorialPrecio> findByProductoTiendaIdOrderByFechaRecoleccionDesc(Long productoTiendaId);
    Optional<HistorialPrecio> findTopByProductoTiendaIdOrderByFechaRecoleccionDesc(Long productoTiendaId);

    @Query("SELECT new com.tesis.demo.dto.ProductoBusquedaDto(" +
           "pt.id, p.marca, p.nombreGenerico, c.nombre, p.pesoUnidad, p.pesoValor, " +
           "p.varianteEspecifica, pt.urlEspecifica, s.nombre, pt.urlImagen, hp.precio) " +
           "FROM HistorialPrecio hp " +
           "JOIN hp.productoTienda pt " +
           "JOIN pt.producto p " +
           "JOIN p.categoria c " +
           "JOIN pt.supermercado s " +
           "WHERE hp.fechaRecoleccion = (" +
           "    SELECT MAX(hp2.fechaRecoleccion) " +
           "    FROM HistorialPrecio hp2 " +
           "    WHERE hp2.productoTienda.id = pt.id" +
           ") " +
           "AND (:query IS NULL OR LOWER(p.nombreGenerico) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "     OR LOWER(p.marca) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<ProductoBusquedaDto> buscarProductosConPrecios(@Param("query") String query, Pageable pageable);
}
