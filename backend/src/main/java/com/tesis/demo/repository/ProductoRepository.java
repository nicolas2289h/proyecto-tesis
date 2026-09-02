package com.tesis.demo.repository;

import com.tesis.demo.dto.ProductoComparativoDto;
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
           "(:nombre IS NULL OR :nombre = '' OR LOWER(p.nombreGenerico) LIKE LOWER(CONCAT('%', CAST(:nombre AS string), '%'))) AND " +
           "(:marca IS NULL OR :marca = '' OR LOWER(p.marca) LIKE LOWER(CONCAT('%', CAST(:marca AS string), '%'))) AND " +
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
    @Query("SELECT p FROM Producto p WHERE LOWER(p.nombreGenerico) = LOWER(CAST(:nombreGenerico AS string))")
    List<Producto> findAllByNombreGenericoIgnoreCase(@Param("nombreGenerico") String nombreGenerico);

    /**
     * Verifica si ya existe un producto con los mismos atributos atómicos y categoría.
     */
    @Query("SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END FROM Producto p WHERE " +
           "LOWER(p.nombreGenerico) = LOWER(CAST(:nombreGenerico AS string)) AND " +
           "((:marca IS NULL AND p.marca IS NULL) OR LOWER(p.marca) = LOWER(CAST(:marca AS string))) AND " +
           "((:variante IS NULL AND p.varianteEspecifica IS NULL) OR LOWER(p.varianteEspecifica) = LOWER(CAST(:variante AS string))) AND " +
           "((:pesoValor IS NULL AND p.pesoValor IS NULL) OR p.pesoValor = :pesoValor) AND " +
           "((:pesoUnidad IS NULL AND p.pesoUnidad IS NULL) OR LOWER(p.pesoUnidad) = LOWER(CAST(:pesoUnidad AS string))) AND " +
           "p.categoria.id = :categoriaId")
    boolean existsProductoDuplicado(
        @Param("nombreGenerico") String nombreGenerico,
        @Param("marca") String marca,
        @Param("variante") String variante,
        @Param("pesoValor") Double pesoValor,
        @Param("pesoUnidad") String pesoUnidad,
        @Param("categoriaId") Long categoriaId
    );

    /**
     * Consulta comparativa de productos con precios ordenados descendentemente.
     * Retorna: nombre_generico, marca, precio, url_imagen, nombre_supermercado.
     */
    @Query(value = "SELECT " +
            "p.id AS id, " +
            "p.nombre_generico AS producto, " +
            "p.marca, " +
            "hp.precio, " +
            "pt.url_imagen, " +
            "s.nombre AS supermercado " +
            "FROM productos p " +
            "INNER JOIN productos_tienda pt ON p.id = pt.producto_id " +
            "INNER JOIN historial_precios hp ON pt.id = hp.producto_tienda_id " +
            "INNER JOIN supermercados s ON pt.supermercado_id = s.id " +
            "GROUP BY p.id, p.nombre_generico, p.marca, hp.precio, pt.url_imagen, s.nombre " +
            "ORDER BY hp.precio DESC",
            nativeQuery = true)
    List<Object[]> obtenerProductosComparativos();
}
