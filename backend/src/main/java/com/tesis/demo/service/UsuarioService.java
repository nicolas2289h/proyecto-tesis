package com.tesis.demo.service;

import com.tesis.demo.dto.AssignRoleDto;
import com.tesis.demo.dto.RolDto;
import com.tesis.demo.dto.UsuarioCreateDto;
import com.tesis.demo.dto.UsuarioDto;
import com.tesis.demo.model.Rol;

import java.util.List;

public interface UsuarioService {
    UsuarioDto registrar(UsuarioCreateDto dto);
    List<UsuarioDto> listar();
    UsuarioDto asignarRol(AssignRoleDto dto);
    UsuarioDto actualizarEstado(Long id, String nuevoEstado, String adminEmail);
    Rol crearRol(RolDto rolDto);
    List<Rol> listarRoles();
}

