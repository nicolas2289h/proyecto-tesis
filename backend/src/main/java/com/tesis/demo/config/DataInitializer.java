package com.tesis.demo.config;

import com.tesis.demo.model.Rol;
import com.tesis.demo.model.Supermercado;
import com.tesis.demo.model.Usuario;
import com.tesis.demo.model.UsuarioRol;
import com.tesis.demo.repository.RolRepository;
import com.tesis.demo.repository.SupermercadoRepository;
import com.tesis.demo.repository.UsuarioRepository;
import com.tesis.demo.repository.UsuarioRolRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@Profile("!prod")  // No ejecutar en producción
public class DataInitializer implements CommandLineRunner {

    private final RolRepository rolRepository;
    private final UsuarioRepository usuarioRepository;
    private final UsuarioRolRepository usuarioRolRepository;
    private final SupermercadoRepository supermercadoRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(RolRepository rolRepository,
                           UsuarioRepository usuarioRepository,
                           UsuarioRolRepository usuarioRolRepository,
                           SupermercadoRepository supermercadoRepository,
                           PasswordEncoder passwordEncoder) {
        this.rolRepository = rolRepository;
        this.usuarioRepository = usuarioRepository;
        this.usuarioRolRepository = usuarioRolRepository;
        this.supermercadoRepository = supermercadoRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        // 1. Inicializar roles si no existen
        Rol adminRol = initRol("ADMIN");
        Rol userRol = initRol("USER");

        // 2. Inicializar supermercados si no existen
        initSupermercado("Comodín en Casa", "https://www.comodinencasa.com.ar");
        initSupermercado("Día", "https://diaonline.supermercadosdia.com.ar");
        initSupermercado("Vea", "https://www.vea.com.ar");

        // 3. Inicializar usuario admin de prueba si no existe
        initUsuario(
                "admin@tesis.com",
                "admin123",
                "Administrador",
                "ACTIVO",
                adminRol
        );

        // 4. Inicializar usuario de prueba adicional (opcional)
        initUsuario(
                "usuario@tesis.com",
                "usuario123",
                "Usuario",
                "ACTIVO",
                userRol
        );
    }

    private Rol initRol(String nombre) {
        Optional<Rol> existing = rolRepository.findByNombreRol(nombre);
        if (existing.isEmpty()) {
            Rol rol = new Rol();
            rol.setNombreRol(nombre);
            return rolRepository.save(rol);
        }
        return existing.get();
    }

    private void initSupermercado(String nombre, String urlBase) {
        Optional<Supermercado> existing = supermercadoRepository.findByNombreIgnoreCase(nombre);
        if (existing.isEmpty()) {
            Supermercado supermercado = new Supermercado();
            supermercado.setNombre(nombre);
            supermercado.setUrlBase(urlBase);
            supermercadoRepository.save(supermercado);
            System.out.println("[DataInitializer] Supermercado creado: " + nombre);
        }
    }

    private void initUsuario(String email, String password, String nombre, String estado, Rol rol) {
        Optional<Usuario> existing = usuarioRepository.findByEmail(email);
        if (existing.isEmpty()) {
            Usuario usuario = new Usuario();
            usuario.setEmail(email);
            usuario.setPassword(passwordEncoder.encode(password)); // Encriptar contraseña
            usuario.setNombre(nombre);
            usuario.setEstado(estado);
            usuario = usuarioRepository.save(usuario);

            // Asignar rol al usuario
            UsuarioRol usuarioRol = new UsuarioRol();
            usuarioRol.setUsuario(usuario);
            usuarioRol.setRol(rol);
            usuarioRolRepository.save(usuarioRol);

            System.out.println("[DataInitializer] Usuario creado: " + email);  // Contraseña no se loguea
        }
    }
}
