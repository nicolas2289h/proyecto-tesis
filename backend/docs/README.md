# Proyecto Tesis - Backend (Spring Boot)

Este backend implementa autenticación con JWT, gestión de usuarios y roles, y persistencia en PostgreSQL (local o Supabase).

## Arquitectura
- Framework: Spring Boot
- Persistencia: Spring Data JPA (Hibernate)
- Seguridad: Spring Security + JWT
- Base de datos: PostgreSQL
- Empaquetado: Maven

## Módulos clave

### Modelos JPA
- Usuario.java
- Rol.java
- UsuarioRol.java

### Repositorios
- UsuarioRepository.java
- RolRepository.java
- UsuarioRolRepository.java

### Seguridad
- SecurityConfig.java
- JwtService.java
- JwtAuthenticationFilter.java

### Autenticación
- AuthController.java
- AuthService.java
- AuthServiceImpl.java

### Usuarios
- UsersController.java
- UsuarioService.java
- UsuarioServiceImpl.java

### DTOs
- LoginRequestDto.java
- LoginResponseDto.java
- UsuarioCreateDto.java
- UsuarioDto.java
- RolDto.java
- AssignRoleDto.java

## Dependencias relevantes (pom.xml)
- spring-boot-starter-security
- jjwt-api
- jjwt-impl
- jjwt-jackson
- spring-boot-starter-data-jpa
- postgresql
- lombok

## Configuración

Archivo de propiedades: `application.properties`

- server.port=8080
- spring.datasource.url=jdbc:postgresql://localhost:5432/tesis_db (o Supabase con sslmode=require)
- spring.datasource.username=postgres
- spring.datasource.password=******
- spring.jpa.hibernate.ddl-auto=update
- spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect

Consulta `docs/setup.md` para variables de entorno y alternativas con Supabase.