package com.tesis.demo.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "historial_precios")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class HistorialPrecio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_tienda_id", nullable = false)
    private ProductoTienda productoTienda;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal precio;

    @Column(name = "fecha_recoleccion", nullable = false)
    private LocalDateTime fechaRecoleccion;
}
