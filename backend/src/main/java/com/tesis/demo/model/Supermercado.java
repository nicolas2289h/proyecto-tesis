package com.tesis.demo.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "supermercados")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Supermercado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(name = "url_base", length = 255)
    private String urlBase;
}
