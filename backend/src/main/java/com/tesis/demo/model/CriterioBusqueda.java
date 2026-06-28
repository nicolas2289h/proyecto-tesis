package com.tesis.demo.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "criterios_busqueda")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CriterioBusqueda {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Término genérico que el scraper usará como query de búsqueda en los supermercados.
     * Ejemplos: "arroz", "fideo", "azucar".
     */
    @Column(name = "termino_busqueda", nullable = false, length = 150)
    private String terminoBusqueda;

    /**
     * Categoría a la que se asignarán automáticamente todos los productos
     * descubiertos bajo este término de búsqueda.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categoria_id", nullable = false)
    private Categoria categoria;
}
