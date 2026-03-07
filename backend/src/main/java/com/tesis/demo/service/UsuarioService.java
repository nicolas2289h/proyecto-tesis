package com.tesis.demo.service;

import com.tesis.demo.dto.AssignRoleDto;
import com.tesis.demo.dto.UsuarioCreateDto;
import com.tesis.demo.dto.UsuarioDto;

import java.util.List;

public interface UsuarioService {
    UsuarioDto registrar(UsuarioCreateDto dto);
    List<UsuarioDto> listar();
    UsuarioDto asignarRol(Long usuarioId, AssignRoleDto dto);
}
