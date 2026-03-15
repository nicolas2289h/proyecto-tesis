package com.tesis.demo.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "productos_tienda")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductoTienda {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supermercado_id", nullable = false)
    private Supermercado supermercado;

    @Column(name = "url_especifica", columnDefinition = "TEXT")
    private String urlEspecifica;

    @Column(name = "codigo_externo", length = 100)
    private String codigoExterno;
}
