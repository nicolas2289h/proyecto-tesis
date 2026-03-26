# Documentación de Rutas y API (Frontend)

## Rutas del Navegador (React Router)
- `/login`: Página de inicio de sesión pública.
- `/registro`: Página de creación de cuenta pública.
- `/home`: Página principal protegida.
- `/mis-listas`: Sección personal de gestión de listas (protegida).

## Consumo de API (Axios)
La configuración centralizada se encuentra en `src/api/axios.ts`.

### URL Base
`http://localhost:8081/api/v1`

### Cabeceras (Headers)
- `Content-Type: application/json`
- `Authorization: Bearer <token>` (se añade automáticamente a través de interceptores si existe un token en `localStorage`).

### Endpoints Consumidos

#### Autenticación (`/auth`)
- `POST /auth/login`: Envía credenciales y recibe el token JWT.

#### Usuarios (`/usuarios`)
- `POST /usuarios`: Envía datos de registro para crear una cuenta.

#### Mis Listas (`/listas`)
- `GET /listas`: Obtiene las listas del usuario logueado.
- `POST /listas`: Crea una nueva lista con nombre y estado favorita.
- `PUT /listas/{id}`: Actualiza el nombre o estado favorita de una lista.
- `DELETE /listas/{id}`: Elimina una lista por su ID.
- `PATCH /listas/{id}/favorita`: Alterna rápidamente el estado de favorita (Toggle).

## Estado Global (Zustand)
Gestionado en `src/store/authStore.ts`:
- **Estado**: `user` (id, email, nombre) y `token`.
- **Acciones**: `setAuth(user, token)` para el login y `logout()` para limpiar la sesión.
