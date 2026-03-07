package com.tesis.demo.repository;

import com.tesis.demo.model.Rol;
import com.tesis.demo.model.Usuario;
import com.tesis.demo.model.UsuarioRol;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface UsuarioRolRepository extends JpaRepository<UsuarioRol, Long> {
    List<UsuarioRol> findByUsuario(Usuario usuario);
    boolean existsByUsuarioAndRol(Usuario usuario, Rol rol);
}
