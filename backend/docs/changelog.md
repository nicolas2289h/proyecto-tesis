# Historial de tareas ejecutadas

## Seguridad y autenticación
- Añadidas dependencias de Spring Security y JWT en pom.xml.
- Implementado JwtService para generar/validar tokens.
- Creado JwtAuthenticationFilter para procesar Authorization Bearer.
- Configurado SecurityConfig: stateless, filtros y rutas públicas.
- Endpoint de login: POST /api/v1/auth/login (AuthController + AuthService/Impl).
- Refactor: lógica de login movida a AuthService/Impl.
- Creado paquete dto y DTOs de autenticación (LoginRequestDto, LoginResponseDto).

## Modelo y persistencia
- Entidades JPA: Usuario, Rol, UsuarioRol.
- Repositorios JPA: UsuarioRepository, RolRepository, UsuarioRolRepository.
- Método existsByUsuarioAndRol en UsuarioRolRepository para evitar duplicados.

## Usuarios y roles
- UsersController con endpoints:
  - POST /api/v1/usuarios (registro público).
  - GET /api/v1/usuarios (listado con JWT).
  - POST /api/v1/usuarios/{id}/roles (asignación de rol).
- UsuarioService/Impl: registrar, listar, asignarRol.
- DTOs para usuarios: UsuarioCreateDto, UsuarioDto, AssignRoleDto, RolDto.

## Configuración
- application.properties con datasource PostgreSQL y JPA.
- Opción de uso de Supabase como base de datos (sslmode=require) mediante variables de entorno.

## Validación
- Compilaciones Maven tras cada cambio relevante (sin tests).
