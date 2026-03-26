package com.tesis.demo.service;

import com.tesis.demo.dto.AssignRoleDto;
import com.tesis.demo.dto.RolDto;
import com.tesis.demo.dto.UsuarioCreateDto;
import com.tesis.demo.dto.UsuarioDto;
import com.tesis.demo.model.Rol;
import com.tesis.demo.model.Usuario;
import com.tesis.demo.model.UsuarioRol;
import com.tesis.demo.repository.RolRepository;
import com.tesis.demo.repository.UsuarioRepository;
import com.tesis.demo.repository.UsuarioRolRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class UsuarioServiceImpl implements UsuarioService {
    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final UsuarioRolRepository usuarioRolRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioServiceImpl(UsuarioRepository usuarioRepository,
                              RolRepository rolRepository,
                              UsuarioRolRepository usuarioRolRepository,
                              PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.usuarioRolRepository = usuarioRolRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public UsuarioDto registrar(UsuarioCreateDto dto) {
        usuarioRepository.findByEmail(dto.getEmail()).ifPresent(u -> {
            throw new RuntimeException("El correo electrónico ya está registrado");
        });

        // Crear el usuario
        Usuario usuario = new Usuario();
        usuario.setEmail(dto.getEmail());
        usuario.setPassword(passwordEncoder.encode(dto.getPassword()));
        usuario.setNombre(dto.getNombre());
        // Por defecto el estado es ACTIVO si no viene en el DTO
        usuario.setEstado(dto.getEstado() != null ? dto.getEstado() : "ACTIVO");
        
        Usuario saved = usuarioRepository.save(usuario);

        // Asignar rol por defecto USUARIO
        Rol userRol = rolRepository.findByNombreRol("USUARIO")
                .orElseGet(() -> {
                    Rol newRol = new Rol();
                    newRol.setNombreRol("USUARIO");
                    return rolRepository.save(newRol);
                });

        UsuarioRol usuarioRol = new UsuarioRol();
        usuarioRol.setUsuario(saved);
        usuarioRol.setRol(userRol);
        usuarioRolRepository.save(usuarioRol);

        log.info("Usuario registrado con éxito: {}", saved.getEmail());
        return toDto(saved);
    }

    @Override
    public List<UsuarioDto> listar() {
        return usuarioRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    public UsuarioDto asignarRol(Long usuarioId, AssignRoleDto dto) {
        Usuario usuario = usuarioRepository.findById(usuarioId).orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        Rol rol = rolRepository.findById(dto.getRolId()).orElseThrow(() -> new RuntimeException("Rol no encontrado"));
        if (!usuarioRolRepository.existsByUsuarioAndRol(usuario, rol)) {
            UsuarioRol usuarioRol = new UsuarioRol();
            usuarioRol.setUsuario(usuario);
            usuarioRol.setRol(rol);
            usuarioRolRepository.save(usuarioRol);
        }
        return toDto(usuario);
    }

    @Override
    public Rol crearRol(RolDto rolDto) {
        log.info("Inicia crearRol {}", rolDto);
        Rol nuevoRol = new Rol();
        nuevoRol.setNombreRol(rolDto.getNombre().toUpperCase());
        return rolRepository.save(nuevoRol);
    }

    @Override
    public List<Rol> listarRoles() {
        log.info("Inicia listarRoles");
        return rolRepository.findAll();
    }

    private UsuarioDto toDto(Usuario u) {
        UsuarioDto dto = new UsuarioDto();
        dto.setId(u.getId());
        dto.setEmail(u.getEmail());
        dto.setNombre(u.getNombre());
        dto.setEstado(u.getEstado());
        
        // Obtener los nombres de los roles
        List<String> roles = usuarioRolRepository.findByUsuario(u).stream()
                .map(ur -> ur.getRol().getNombreRol())
                .collect(Collectors.toList());
        dto.setRoles(roles);
        
        return dto;
    }
}
