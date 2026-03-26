package com.tesis.demo.repository;

import com.tesis.demo.model.ListaCompra;
import com.tesis.demo.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ListaCompraRepository extends JpaRepository<ListaCompra, Long> {
    List<ListaCompra> findByUsuario(Usuario usuario);
    List<ListaCompra> findByUsuarioOrderByFavoritaDescFechaCreacionDesc(Usuario usuario);
}
