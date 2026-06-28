package com.tesis.demo.repository;

import com.tesis.demo.model.Producto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductoRepository extends JpaRepository<Producto, Long> {

    Page<Producto> findByNombreGenericoContainingIgnoreCase(String nombre, Pageable pageable);

    Page<Producto> findByCategoriaId(Long categoriaId, Pageable pageable);

    @Query("SELECT p FROM Producto p WHERE " +
           "(:nombre IS NULL OR LOWER(p.nombreGenerico) LIKE LOWER(CONCAT('%', :nombre, '%'))) AND " +
           "(:marca IS NULL OR LOWER(p.marca) LIKE LOWER(CONCAT('%', :marca, '%'))) AND " +
           "(:categoriaId IS NULL OR p.categoria.id = :categoriaId)")
    Page<Producto> buscarAvanzado(
        @Param("nombre") String nombre,
        @Param("marca") String marca,
        @Param("categoriaId") Long categoriaId,
        Pageable pageable
    );

    /**
     * Recupera todos los productos cuyo nombre genérico coincida exactamente (case-insensitive)
     * con el término buscado. Usado por IngestaService para la búsqueda de similitud.
     */
    @Query("SELECT p FROM Producto p WHERE LOWER(p.nombreGenerico) = LOWER(:nombreGenerico)")
    List<Producto> findAllByNombreGenericoIgnoreCase(@Param("nombreGenerico") String nombreGenerico);
}
