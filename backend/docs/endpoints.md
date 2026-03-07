# Endpoints

## Autenticación
- POST /api/v1/auth/login
  - Request: LoginRequestDto { email, password }
  - Response: LoginResponseDto { token, email, roles }
  - Controlador: [AuthController.java](file:///c:/Users/Usuario/Desktop/TESIS/proyecto-tesis/backend/src/main/java/com/tesis/demo/controller/AuthController.java)
  - Seguridad: público (permitAll)

## Usuarios
- POST /api/v1/usuarios
  - Request: UsuarioCreateDto { email, password, nombre, estado }
  - Response: UsuarioDto { id, email, nombre, estado }
  - Controlador: [UsersController.java](file:///c:/Users/Usuario/Desktop/TESIS/proyecto-tesis/backend/src/main/java/com/tesis/demo/controller/UsersController.java)
  - Seguridad: público (permitAll)
- GET /api/v1/usuarios
  - Response: List<UsuarioDto>
  - Controlador: [UsersController.java](file:///c:/Users/Usuario/Desktop/TESIS/proyecto-tesis/backend/src/main/java/com/tesis/demo/controller/UsersController.java)
  - Seguridad: requiere JWT
- POST /api/v1/usuarios/{id}/roles
  - Request: AssignRoleDto { usuarioId, rolId }
  - Response: UsuarioDto
  - Controlador: [UsersController.java](file:///c:/Users/Usuario/Desktop/TESIS/proyecto-tesis/backend/src/main/java/com/tesis/demo/controller/UsersController.java)
  - Seguridad: requiere JWT y rol adecuado (ajustable)

## Roles
- Roles soportados: USUARIO, ADMINISTRADOR, COMERCIANTE, MODERADOR
- Tabla: rol; relación N–N mediante usuario_rol
