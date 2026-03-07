package com.tesis.demo.controller;

import com.tesis.demo.dto.AssignRoleDto;
import com.tesis.demo.dto.UsuarioCreateDto;
import com.tesis.demo.dto.UsuarioDto;
import com.tesis.demo.service.UsuarioService;
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
    public ResponseEntity<UsuarioDto> registrar(@RequestBody UsuarioCreateDto dto) {
        return ResponseEntity.ok(usuarioService.registrar(dto));
    }

    @GetMapping
    public ResponseEntity<List<UsuarioDto>> listar() {
        return ResponseEntity.ok(usuarioService.listar());
    }

    @PostMapping("/{id}/roles")
    public ResponseEntity<UsuarioDto> asignarRol(@PathVariable Long id, @RequestBody AssignRoleDto dto) {
        return ResponseEntity.ok(usuarioService.asignarRol(id, dto));
    }
}
