package com.tesis.demo.repository;

import com.tesis.demo.model.ProductoTienda;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ProductoTiendaRepository extends JpaRepository<ProductoTienda, Long> {
    List<ProductoTienda> findByProductoId(Long productoId);
    List<ProductoTienda> findBySupermercadoId(Long supermercadoId);
    Optional<ProductoTienda> findByProductoIdAndSupermercadoId(Long productoId, Long supermercadoId);
    Optional<ProductoTienda> findByCodigoExternoAndSupermercadoId(String codigoExterno, Long supermercadoId);
}
