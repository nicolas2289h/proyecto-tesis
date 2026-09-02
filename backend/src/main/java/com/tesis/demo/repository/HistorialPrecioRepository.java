package com.tesis.demo.repository;

import com.tesis.demo.dto.ProductoBusquedaDto;
import com.tesis.demo.model.HistorialPrecio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HistorialPrecioRepository extends JpaRepository<HistorialPrecio, Long> {
    List<HistorialPrecio> findByProductoTiendaIdOrderByFechaRecoleccionDesc(Long productoTiendaId);
    Optional<HistorialPrecio> findTopByProductoTiendaIdOrderByFechaRecoleccionDesc(Long productoTiendaId);

    /**
     * Consulta personalizada para obtener productos con su último precio, filtrando por nombre (si se proporciona) y supermercado (si se proporciona)
     */
    @Query("SELECT new com.tesis.demo.dto.ProductoBusquedaDto(" +
            "p.id, " +
           "p.nombreGenerico, " +
           "p.marca, " +
           "hp.precio, " +
           "pt.urlImagen, " +
           "s.nombre) " +
           "FROM HistorialPrecio hp " +
           "JOIN hp.productoTienda pt " +
           "JOIN pt.producto p " +
           "JOIN pt.supermercado s " +
           "WHERE hp.fechaRecoleccion = (SELECT MAX(hp2.fechaRecoleccion) FROM HistorialPrecio hp2 WHERE hp2.productoTienda.id = pt.id) " +
           "AND (:nombre IS NULL OR :nombre = '' OR LOWER(p.nombreGenerico) LIKE LOWER(CONCAT('%', CAST(:nombre AS string), '%')) OR LOWER(p.marca) LIKE LOWER(CONCAT('%', CAST(:nombre AS string), '%'))) " +
           "AND (:supermercadoId IS NULL OR s.id = :supermercadoId) " +
           "ORDER BY hp.precio DESC")
    List<ProductoBusquedaDto> buscarProductos(@Param("nombre") String nombre, @Param("supermercadoId") Long supermercadoId);
}
