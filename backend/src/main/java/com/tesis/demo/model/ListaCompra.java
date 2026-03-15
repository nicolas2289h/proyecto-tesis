package com.tesis.demo.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "listas_compras")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ListaCompra {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(name = "nombre_lista", nullable = false, length = 255)
    private String nombreLista;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;
}
