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
    UsuarioDto asignarRol(Long usuarioId, AssignRoleDto dto);
    Rol crearRol(RolDto rolDto);
    List<Rol> listarRoles();
}
