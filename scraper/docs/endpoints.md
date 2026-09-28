# Especificación Técnica de Integración - Endpoints Backend

Este documento detalla el contrato de integración de la API REST del Backend (Spring Boot con Spring Security y JWT) consumida por el Scraper de precios. Rige la separación estricta de capas y comunicación unidireccional desacoplada.

---

## Resumen de Endpoints

| Método | Endpoint | Seguridad | Propósito |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/v1/auth/login` | Público | Autenticación del Scraper y obtención del token JWT. |
| **GET** | `/api/v1/productos-tienda` | Privado (`ROLE_ADMIN`) | [Legacy] Obtención de URLs de supermercados mapeados a raspar. |
| **POST** | `/api/v1/precios` | Privado (`ROLE_ADMIN`) | [Legacy] Almacenamiento histórico de series de precios recolectados. |
| **GET** | `/api/v1/extractor/targets` | Privado (`ROLE_ADMIN`) | [v2.0] Obtención de targets de descubrimiento (supermercado × keyword). |
| **POST** | `/api/v1/extractor/ingesta-masiva` | Privado (`ROLE_ADMIN`) | [v2.0] Ingesta masiva de productos descubiertos en la grilla de búsqueda. |
| **GET** | `/api/v1/productos/busqueda` | Público | [v2.3] **Solo referencia** — Buscador de productos con precios para el frontend. No es consumido por el scraper. |

---

## 1. Autenticación de Cliente (Login)

Flujo inicial público para que el bot de scraping se identifique y capture sus credenciales temporales.

*   **Ruta**: `/api/v1/auth/login`
*   **Método**: `POST`
*   **Encabezados**:
    *   `Content-Type: application/json`

### Cuerpo de la Petición (JSON)
```json
{
  "email": "admin_scraper@tesis.com",
  "password": "password_seguro"
}
```

### Respuesta Exitosa (HTTP 200 OK)
Retorna la información básica del usuario y el token de acceso JWT.
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbl9zY3JhcGVyQHRlc2lzLmNvbSIsImlhdCI6MTc4MTk4NTc4NiwiZXhwIjoxNzgxOTg5Mzg2LCJyb2xlcyI6WyJST0xFX0FETUlOIl19.signature_sample_string...",
  "email": "admin_scraper@tesis.com",
  "roles": [
    "ROLE_ADMIN"
  ]
}
```

### Respuestas de Error
*   **HTTP 401 Unauthorized**: Ocurre al ingresar una contraseña o correo incorrectos.
    ```json
    {
      "message": "Credenciales inválidas"
    }
    ```
*   **HTTP 400 Bad Request**: Payload estructurado incorrectamente (ej: campos faltantes o formato de email inválido).

---

## 2. Obtención de Objetivos de Scraping

Consulta la base de datos de mapeos para saber qué URLs visitar y bajo qué identificador registrar los precios.

*   **Ruta**: `/api/v1/productos-tienda`
*   **Método**: `GET`
*   **Encabezados**:
    *   `Authorization: Bearer <token_jwt_capturado>`
    *   `Accept: application/json`

### Cuerpo de la Petición
*   *Vacío (No requiere payload de entrada)*.

### Respuesta Exitosa (HTTP 200 OK)
Devuelve un arreglo JSON conteniendo los mapeos producto-supermercado. El scraper debe iterar secuencialmente sobre la lista.
```json
[
  {
    "id": 101,
    "producto": {
      "id": 10,
      "nombre": "Aceite de Oliva Extra Virgen 1L",
      "marca": "Deleyda"
    },
    "tienda": {
      "id": 1,
      "nombre": "Jumbo Portal Ñuñoa",
      "cadena": "Jumbo"
    },
    "urlEspecifica": "https://www.jumbo.cl/aceite-oliva-deleyda-1-lt/p"
  },
  {
    "id": 102,
    "producto": {
      "id": 10,
      "nombre": "Aceite de Oliva Extra Virgen 1L",
      "marca": "Deleyda"
    },
    "tienda": {
      "id": 2,
      "nombre": "Lider Irarrázaval",
      "cadena": "Lider"
    },
    "urlEspecifica": "https://www.lider.cl/supermercado/product/sku/1102928"
  }
]
```
*(Nota académica: El scraper solo necesita parsear obligatoriamente `id` y `urlEspecifica` para cumplir su cometido).*

### Respuestas de Error
*   **HTTP 401 Unauthorized**: El token provisto ha expirado o es sintácticamente inválido. El scraper intentará renovarlo de inmediato en segundo plano.
*   **HTTP 403 Forbidden**: El usuario autenticado no posee el rol necesario (`ROLE_ADMIN`) para ver la lista de mapeos.

---

## 3. Persistencia de Precios Recolectados

Registra los resultados limpios del raspado en la base de datos temporal del backend.

*   **Ruta**: `/api/v1/precios`
*   **Método**: `POST`
*   **Encabezados**:
    *   `Authorization: Bearer <token_jwt_capturado>`
    *   `Content-Type: application/json`

### Cuerpo de la Petición (JSON)
*   `productoTiendaId`: ID extraído en la consulta anterior (corresponde a la llave del mapeo).
*   `precio`: Float limpio (sin separadores de miles y con punto decimal).
*   `fechaRecoleccion`: String con marca de tiempo UTC en formato ISO 8601 completo (`yyyy-MM-ddTHH:mm:ssZ`).

```json
{
  "productoTiendaId": 101,
  "precio": 8990.00,
  "fechaRecoleccion": "2026-05-27T00:48:56Z"
}
```

### Respuesta Exitosa (HTTP 201 Created)
Confirma la correcta persistencia del dato en la serie histórica.
```json
{
  "id": 500021,
  "productoTiendaId": 101,
  "precio": 8990.00,
  "fechaRecoleccion": "2026-05-27T00:48:56Z",
  "creadoEn": "2026-05-27T00:49:02Z"
}
```

### Respuestas de Error
*   **HTTP 400 Bad Request**: Datos de entrada incompletos o tipos de datos mal formateados (ej: precio no numérico o fecha inválida).
*   **HTTP 401 Unauthorized**: Token de acceso ausente, inválido o caducado.
*   **HTTP 403 Forbidden**: Permisos de usuario insuficientes.
*   **HTTP 409 Conflict / 422 Unprocessable Entity**: Violación de integridad (ej: el `productoTiendaId` referenciado no existe en la base de datos de mapeos).

---

## 4. [v2.0] Obtención de Targets de Descubrimiento

Consulta la lista de combinaciones supermercado × keyword configuradas por el administrador.

*   **Ruta**: `/api/v1/extractor/targets`
*   **Método**: `GET`
*   **Encabezados**:
    *   `Authorization: Bearer <token_jwt_capturado>`
    *   `Accept: application/json`

### Respuesta Exitosa (HTTP 200 OK)
```json
{
  "status": 200,
  "message": "Targets de extracción generados: 6 combinaciones",
  "data": [
    {
      "supermercadoId": 1,
      "supermercadoNombre": "Comodin",
      "urlBase": "https://www.comodinencasa.com.ar",
      "palabraClave": "fideo",
      "categoriaId": 2,
      "categoriaNombre": "Almacén"
    },
    {
      "supermercadoId": 1,
      "supermercadoNombre": "Comodin",
      "urlBase": "https://www.comodinencasa.com.ar",
      "palabraClave": "arroz",
      "categoriaId": 2,
      "categoriaNombre": "Almacén"
    }
  ]
}
```

---

## 5. [v2.0] Ingesta Masiva de Productos Descubiertos

Envía todos los productos extraídos de la grilla de resultados para que el backend los normalice, deduplique y persista.

*   **Ruta**: `/api/v1/extractor/ingesta-masiva`
*   **Método**: `POST`
*   **Encabezados**:
    *   `Authorization: Bearer <token_jwt_capturado>`
    *   `Content-Type: application/json`

### Cuerpo de la Petición (JSON Array)
```json
[
  {
    "textoCrudoTienda": "Fideos Spaghetti Lucchetti x 500 gramos",
    "urlEspecifica": "https://www.comodinencasa.com.ar/fideos-lucchetti/p",
    "urlImagen": "https://www.comodinencasa.com.ar/images/products/fideos-lucchetti.jpg",
    "precioActual": 1250.50,
    "disponibilidad": true,
    "supermercadoId": 1,
    "palabraClaveBuscada": "fideo"
  },
  {
    "textoCrudoTienda": "Fideo Spaghetti Luchetti 500g",
    "urlEspecifica": "https://www.otrosupermercado.com.ar/fideo-luchetti/p",
    "urlImagen": "https://www.otrosupermercado.com.ar/images/fideo-luchetti.jpg",
    "precioActual": 1189.00,
    "disponibilidad": true,
    "supermercadoId": 2,
    "palabraClaveBuscada": "fideo"
  }
]
```
*(Nota: el backend detectará que ambos ítems corresponden al mismo producto maestro mediante Jaro-Winkler ≥ 0.92 y los unificará bajo el mismo `producto_id`. El campo `urlImagen` es opcional y se asocia a cada mapeo ProductoTienda.)*

### Respuesta Exitosa (HTTP 200 OK)
```json
{
  "status": 200,
  "message": "Ingesta masiva procesada exitosamente.",
  "data": {
    "procesados": 2,
    "nuevosProductos": 1,
    "productosUnificados": 1,
    "preciosRegistrados": 2,
    "errores": 0
  }
}
```

### Respuestas de Error
*   **HTTP 400 Bad Request**: Lista vacía o campos obligatorios faltantes.
*   **HTTP 401 Unauthorized**: Token ausente o expirado.
*   **HTTP 403 Forbidden**: El usuario no tiene `ROLE_ADMIN`.

---

## Referencia: Endpoints de Consumo del Frontend (No usados por el Scraper)

Estos endpoints son generados por el backend a partir de los datos recolectados por el scraper, pero son consumidos directamente por la aplicación frontend (React/móvil). Se documentan aquí como referencia de la arquitectura completa.

### GET /api/v1/productos/busqueda [v2.3]

Permite al usuario final buscar productos y ver sus precios comparativos en tiempo real, cruzando el catálogo maestro con el último precio registrado por supermercado.

*   **Ruta**: `/api/v1/productos/busqueda`
*   **Método**: `GET`
*   **Seguridad**: Público (`permitAll` — no requiere JWT)
*   **Query Params**:
    *   `q` (opcional): Término de búsqueda por nombre genérico o marca del producto. Si se omite, devuelve todos.
    *   `page` (opcional, default `0`): Número de página.
    *   `size` (opcional, default `10`): Resultados por página.
    *   `sort` (opcional): Campo y dirección de ordenamiento.

### Respuesta Exitosa (HTTP 200 OK)
```json
{
  "status": 200,
  "message": null,
  "data": {
    "content": [
      {
        "id": 5,
        "marca": "Lucchetti",
        "nombreGenerico": "Fideos Spaghetti",
        "categoria": "Pastas",
        "pesoUnidad": "g",
        "pesoValor": 500.0,
        "varianteEspecifica": null,
        "urlEspecifica": "https://www.vea.com.ar/fideos-lucchetti-spaghetti-500g/p",
        "supermercado": "Vea",
        "urlImagen": "https://www.vea.com.ar/medias/fideos-lucchetti.jpg",
        "precio": 1250.50
      }
    ],
    "totalElements": 1,
    "totalPages": 1,
    "number": 0,
    "size": 10
  }
}
```

> **Nota arquitectural:** Los datos que devuelve este endpoint son generados por el pipeline de ingesta del scraper (`POST /api/v1/extractor/ingesta-masiva`). El scraper alimenta el sistema; el frontend consume los resultados a través de este endpoint de búsqueda.
