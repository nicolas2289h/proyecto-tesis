package com.tesis.demo.service;

import com.tesis.demo.dto.LoginResponseDto;
import com.tesis.demo.model.Usuario;
import com.tesis.demo.repository.UsuarioRepository;
import com.tesis.demo.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;

    public AuthServiceImpl(AuthenticationManager authenticationManager,
                           JwtService jwtService,
                           UsuarioRepository usuarioRepository) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    public LoginResponseDto login(String email, String password) {
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, password)
        );
        Usuario usuario = usuarioRepository.findByEmail(email).orElseThrow();
        List<String> roles = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .map(r -> r.replaceFirst("^ROLE_", ""))
                .collect(Collectors.toList());
        Map<String, Object> claims = new HashMap<>();
        claims.put("roles", roles);
        String token = jwtService.generateToken(usuario.getEmail(), claims);
        return new LoginResponseDto(token, usuario.getEmail(), roles);
    }
}
