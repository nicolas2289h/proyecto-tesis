package com.tesis.demo.controller;

import com.tesis.demo.dto.*;
import com.tesis.demo.model.Rol;
import com.tesis.demo.service.UsuarioService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/usuarios")
public class UsersController {

    private final UsuarioService usuarioService;

    public UsersController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<UsuarioDto>> registrar(@RequestBody UsuarioCreateDto dto) {
        return ResponseEntity.status(201).body(ApiResponse.success(HttpStatus.CREATED.value(), "Usuario registrado", usuarioService.registrar(dto)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<UsuarioDto>>> listar() {
        return ResponseEntity.ok(ApiResponse.success(HttpStatus.OK.value(), null, usuarioService.listar()));
    }

    @PostMapping("/{id}/roles")
    public ResponseEntity<ApiResponse<UsuarioDto>> asignarRol(@PathVariable Long id, @RequestBody AssignRoleDto dto) {
        return ResponseEntity.ok(ApiResponse.success(HttpStatus.OK.value(), "Rol asignado", usuarioService.asignarRol(id, dto)));
    }

    @PostMapping("/roles")
    public ResponseEntity<ApiResponse<Rol>> crearNuevoRol(@RequestBody RolDto rolDto) {
        Rol nuevoRol = usuarioService.crearRol(rolDto);
        return ResponseEntity.status(201).body(ApiResponse.success(HttpStatus.CREATED.value(), "Nuevo Rol creado", nuevoRol));
    }

    @GetMapping("/roles")
    ResponseEntity<ApiResponse<List<Rol>>> listarRoles() {
        return ResponseEntity.ok(ApiResponse.success(HttpStatus.OK.value(), null, usuarioService.listarRoles()));
    }
}
