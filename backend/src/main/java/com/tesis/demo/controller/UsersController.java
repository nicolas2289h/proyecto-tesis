package com.tesis.demo.controller;

import com.tesis.demo.dto.*;
import com.tesis.demo.model.Rol;
import com.tesis.demo.service.UsuarioService;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/usuarios")
public class UsersController {

    private final UsuarioService usuarioService;

    public UsersController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<UsuarioDto>> registrar(@Valid @RequestBody UsuarioCreateDto dto) {
        return ResponseEntity.status(201).body(ApiResponse.success(HttpStatus.CREATED.value(), "Usuario registrado", usuarioService.registrar(dto)));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<List<UsuarioDto>>> listar() {
        return ResponseEntity.ok(ApiResponse.success(HttpStatus.OK.value(), "Listado de usuarios", usuarioService.listar()));
    }

    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasAnyRole('ADMIN', 'ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<UsuarioDto>> actualizarEstado(
            @PathVariable Long id,
            @Valid @RequestBody UsuarioEstadoDto dto,
            Principal principal) {
        String adminEmail = principal != null ? principal.getName() : null;
        UsuarioDto actualizado = usuarioService.actualizarEstado(id, dto.getEstado(), adminEmail);
        return ResponseEntity.ok(ApiResponse.success(HttpStatus.OK.value(), "Estado de usuario actualizado correctamente", actualizado));
    }

    @PostMapping("/asignar/roles")
    @PreAuthorize("hasAnyRole('ADMIN', 'ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<UsuarioDto>> asignarRol(@RequestBody AssignRoleDto dto) {
        return ResponseEntity.ok(ApiResponse.success(HttpStatus.OK.value(), "Rol asignado", usuarioService.asignarRol(dto)));
    }

    @PostMapping("/roles")
    @PreAuthorize("hasAnyRole('ADMIN', 'ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<Rol>> crearNuevoRol(@RequestBody RolDto rolDto) {
        Rol nuevoRol = usuarioService.crearRol(rolDto);
        return ResponseEntity.status(201).body(ApiResponse.success(HttpStatus.CREATED.value(), "Nuevo Rol creado", nuevoRol));
    }

    @GetMapping("/roles")
    @PreAuthorize("hasAnyRole('ADMIN', 'ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<List<Rol>>> listarRoles() {
        return ResponseEntity.ok(ApiResponse.success(HttpStatus.OK.value(), null, usuarioService.listarRoles()));
    }
}
