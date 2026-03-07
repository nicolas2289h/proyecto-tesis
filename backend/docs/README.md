# Proyecto Tesis - Backend (Spring Boot)

Este backend implementa autenticación con JWT, gestión de usuarios y roles, y persistencia en PostgreSQL (local o Supabase).

## Arquitectura
- Framework: Spring Boot
- Persistencia: Spring Data JPA (Hibernate)
- Seguridad: Spring Security + JWT
- Base de datos: PostgreSQL
- Empaquetado: Maven

## Módulos clave
- Modelos JPA:
  - [Usuario.java](file:///c:/Users/Usuario/Desktop/TESIS/proyecto-tesis/backend/src/main/java/com/tesis/demo/model/Usuario.java)
  - [Rol.java](file:///c:/Users/Usuario/Desktop/TESIS/proyecto-tesis/backend/src/main/java/com/tesis/demo/model/Rol.java)
  - [UsuarioRol.java](file:///c:/Users/Usuario/Desktop/TESIS/proyecto-tesis/backend/src/main/java/com/tesis/demo/model/UsuarioRol.java)
- Repositorios:
  - [UsuarioRepository.java](file:///c:/Users/Usuario/Desktop/TESIS/proyecto-tesis/backend/src/main/java/com/tesis/demo/repository/UsuarioRepository.java)
  - [RolRepository.java](file:///c:/Users/Usuario/Desktop/TESIS/proyecto-tesis/backend/src/main/java/com/tesis/demo/repository/RolRepository.java)
  - [UsuarioRolRepository.java](file:///c:/Users/Usuario/Desktop/TESIS/proyecto-tesis/backend/src/main/java/com/tesis/demo/repository/UsuarioRolRepository.java)
- Seguridad:
  - [SecurityConfig.java](file:///c:/Users/Usuario/Desktop/TESIS/proyecto-tesis/backend/src/main/java/com/tesis/demo/security/SecurityConfig.java)
  - [JwtService.java](file:///c:/Users/Usuario/Desktop/TESIS/proyecto-tesis/backend/src/main/java/com/tesis/demo/security/JwtService.java)
  - [JwtAuthenticationFilter.java](file:///c:/Users/Usuario/Desktop/TESIS/proyecto-tesis/backend/src/main/java/com/tesis/demo/security/JwtAuthenticationFilter.java)
- Autenticación:
  - [AuthController.java](file:///c:/Users/Usuario/Desktop/TESIS/proyecto-tesis/backend/src/main/java/com/tesis/demo/controller/AuthController.java)
  - [AuthService.java](file:///c:/Users/Usuario/Desktop/TESIS/proyecto-tesis/backend/src/main/java/com/tesis/demo/service/AuthService.java)
  - [AuthServiceImpl.java](file:///c:/Users/Usuario/Desktop/TESIS/proyecto-tesis/backend/src/main/java/com/tesis/demo/service/AuthServiceImpl.java)
- Usuarios:
  - [UsersController.java](file:///c:/Users/Usuario/Desktop/TESIS/proyecto-tesis/backend/src/main/java/com/tesis/demo/controller/UsersController.java)
  - [UsuarioService.java](file:///c:/Users/Usuario/Desktop/TESIS/proyecto-tesis/backend/src/main/java/com/tesis/demo/service/UsuarioService.java)
  - [UsuarioServiceImpl.java](file:///c:/Users/Usuario/Desktop/TESIS/proyecto-tesis/backend/src/main/java/com/tesis/demo/service/UsuarioServiceImpl.java)
- DTOs:
  - [LoginRequestDto.java](file:///c:/Users/Usuario/Desktop/TESIS/proyecto-tesis/backend/src/main/java/com/tesis/demo/dto/LoginRequestDto.java)
  - [LoginResponseDto.java](file:///c:/Users/Usuario/Desktop/TESIS/proyecto-tesis/backend/src/main/java/com/tesis/demo/dto/LoginResponseDto.java)
  - [UsuarioCreateDto.java](file:///c:/Users/Usuario/Desktop/TESIS/proyecto-tesis/backend/src/main/java/com/tesis/demo/dto/UsuarioCreateDto.java)
  - [UsuarioDto.java](file:///c:/Users/Usuario/Desktop/TESIS/proyecto-tesis/backend/src/main/java/com/tesis/demo/dto/UsuarioDto.java)
  - [RolDto.java](file:///c:/Users/Usuario/Desktop/TESIS/proyecto-tesis/backend/src/main/java/com/tesis/demo/dto/RolDto.java)
  - [AssignRoleDto.java](file:///c:/Users/Usuario/Desktop/TESIS/proyecto-tesis/backend/src/main/java/com/tesis/demo/dto/AssignRoleDto.java)

## Dependencias relevantes (pom.xml)
- spring-boot-starter-security
- jjwt-api, jjwt-impl, jjwt-jackson
- spring-boot-starter-data-jpa
- postgresql
- lombok

## Configuración
Archivo de propiedades: [application.properties](file:///c:/Users/Usuario/Desktop/TESIS/proyecto-tesis/backend/src/main/resources/application.properties)

- server.port=8080
- spring.datasource.url=jdbc:postgresql://localhost:5432/tesis_db (o Supabase con sslmode=require)
- spring.datasource.username=postgres
- spring.datasource.password=******
- spring.jpa.hibernate.ddl-auto=update
- spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect

Consulta docs/setup.md para variables de entorno y alternativas con Supabase.
