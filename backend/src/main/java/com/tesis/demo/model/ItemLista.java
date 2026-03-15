package com.tesis.demo.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "items_lista")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ItemLista {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lista_id", nullable = false)
    private ListaCompra listaCompra;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @Column(nullable = false)
    private Integer cantidad;
}
