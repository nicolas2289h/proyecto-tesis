import time
import logging
from typing import List, Dict, Any, Optional
import requests
from requests.exceptions import RequestException

logger = logging.getLogger(__name__)

class ApiClient:
    """
    Cliente HTTP encargado de la comunicación desacoplada y unidireccional
    con el Backend (Spring Boot). Implementa autenticación basada en JWT,
    almacenamiento en memoria, reintentos con retroceso exponencial
    y refresco automático del token ante expiración (HTTP 401).
    """

    def __init__(self, base_url: str, email: str, password: str, max_retries: int = 3, backoff_factor: float = 1.5):
        """
        Inicializa el cliente de la API.

        Args:
            base_url: URL base del servidor Backend (ej: http://localhost:8080).
            email: Email del scraper para iniciar sesión.
            password: Contraseña del scraper.
            max_retries: Número máximo de reintentos para peticiones fallidas.
            backoff_factor: Multiplicador para el retraso entre reintentos.
        """
        self.base_url = base_url.rstrip('/')
        self.email = email
        self.password = password
        self.max_retries = max_retries
        self.backoff_factor = backoff_factor
        self.token: Optional[str] = None
        self.session = requests.Session()

    def login(self) -> str:
        """
        Realiza el flujo de autenticación pública para obtener un nuevo token JWT.
        Guarda el token en memoria.

        Returns:
            str: El token JWT obtenido.

        Raises:
            Exception: Si la autenticación falla o el servidor responde con error.
        """
        url = f"{self.base_url}/api/v1/auth/login"
        payload = {
            "email": self.email,
            "password": self.password
        }
        
        logger.info(f"Iniciando sesión en el backend para el usuario: {self.email}")
        
        # El login es público y no requiere token previo.
        for attempt in range(self.max_retries):
            try:
                response = self.session.post(url, json=payload, timeout=10)
                
                if response.status_code == 200:
                    response_json = response.json()
                    # Soporte para ApiResponse wrapper del backend (el token viene dentro del campo 'data')
                    if isinstance(response_json, dict) and "data" in response_json and isinstance(response_json["data"], dict):
                        self.token = response_json["data"].get("token")
                    else:
                        self.token = response_json.get("token")
                        
                    if not self.token:
                        raise ValueError("El backend no retornó el campo 'token' en la respuesta.")
                    logger.info("Autenticación exitosa. Token JWT almacenado en memoria.")
                    return self.token
                
                elif response.status_code == 401:
                    logger.error("Credenciales inválidas (401 Unauthorized) en el login.")
                    raise Exception("Credenciales inválidas de Scraper para el backend.")
                
                else:
                    logger.warning(f"Error en login (HTTP {response.status_code}): {response.text}")
                    
            except (RequestException, ValueError) as e:
                logger.warning(f"Intento {attempt + 1} de login fallido: {e}")
                if attempt == self.max_retries - 1:
                    raise Exception(f"No se pudo completar el login tras {self.max_retries} intentos: {e}")
                
            # Esperar antes de reintentar
            time.sleep(self.backoff_factor ** attempt)
            
        raise Exception("Fallo inesperado en el flujo de login.")

    def _get_headers(self) -> Dict[str, str]:
        """
        Construye los encabezados necesarios para peticiones privadas.
        Si no hay un token almacenado en memoria, realiza el login primero.
        """
        if not self.token:
            logger.info("Token JWT no disponible en memoria. Iniciando flujo de login automático.")
            self.login()
            
        return {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

    def _request_with_token(self, method: str, path: str, json_data: Optional[Dict[str, Any]] = None) -> requests.Response:
        """
        Ejecuta una petición HTTP de forma genérica con soporte para re-autenticación
        automática en caso de recibir un HTTP 401 (token expirado).

        Args:
            method: Método HTTP ('GET', 'POST', etc.).
            path: Ruta relativa del endpoint (ej: '/api/v1/productos-tienda').
            json_data: Body JSON opcional.

        Returns:
            requests.Response: Respuesta del servidor.
        """
        url = f"{self.base_url}{path}"
        headers = self._get_headers()
        
        try:
            response = self.session.request(method, url, headers=headers, json=json_data, timeout=15)
            
            # Si el token expiró o es inválido, el backend devolverá 401
            if response.status_code == 401:
                logger.warning("El token JWT ha expirado o es inválido (HTTP 401). Renovando token y reintentando...")
                # Forzar un nuevo login para actualizar self.token
                self.login()
                # Actualizar encabezados con el nuevo token
                headers = self._get_headers()
                # Reintentar la petición una vez con el nuevo token
                response = self.session.request(method, url, headers=headers, json=json_data, timeout=15)
                
            return response
            
        except RequestException as e:
            logger.error(f"Error de red al intentar conectar con el endpoint {path}: {e}")
            raise

    def get_scraping_targets(self) -> List[Dict[str, Any]]:
        """
        Obtiene los objetivos de raspado configurados en el backend.
        Endpoint: GET /api/v1/productos-tienda

        Returns:
            List[Dict[str, Any]]: Lista de mapeos de productos y urls de supermercados.
        """
        logger.info("Obteniendo objetivos de scraping desde el Backend...")
        
        for attempt in range(self.max_retries):
            try:
                response = self._request_with_token("GET", "/api/v1/productos-tienda")
                
                if response.status_code == 200:
                    response_json = response.json()
                    # Soporte para ApiResponse wrapper del backend (el listado viene dentro del campo 'data')
                    if isinstance(response_json, dict) and "data" in response_json:
                        targets = response_json["data"]
                    else:
                        targets = response_json
                        
                    if not isinstance(targets, list):
                        raise ValueError(f"Formato inesperado del backend, se esperaba lista. Recibido: {type(targets)}")
                    logger.info(f"Se obtuvieron con éxito {len(targets)} objetivos de scraping.")
                    return targets
                else:
                    logger.warning(f"Intento {attempt + 1} fallido al obtener objetivos (HTTP {response.status_code}): {response.text}")
                    
            except (RequestException, ValueError) as e:
                logger.warning(f"Error de conexión en intento {attempt + 1} al obtener objetivos: {e}")
                if attempt == self.max_retries - 1:
                    raise Exception(f"No se pudieron obtener los objetivos de scraping tras {self.max_retries} intentos.")
            
            time.sleep(self.backoff_factor ** attempt)
            
        raise Exception("Fallo inesperado al obtener objetivos de scraping.")

    def post_price(self, producto_tienda_id: int, precio: float, fecha_recoleccion: str) -> bool:
        """
        Envía un precio recolectado y normalizado de vuelta al backend para su persistencia.
        Endpoint: POST /api/v1/precios

        Args:
            producto_tienda_id: ID del mapeo del producto-tienda obtenido en el GET.
            precio: Valor numérico limpio del precio.
            fecha_recoleccion: Fecha y hora en formato ISO 8601 (ej: '2026-05-26T21:45:46Z').

        Returns:
            bool: True si el precio se registró exitosamente, False en caso contrario.
        """
        payload = {
            "productoTiendaId": producto_tienda_id,
            "precio": precio,
            "fechaRecoleccion": fecha_recoleccion
        }
        
        logger.info(f"Persistiendo precio en el backend -> ID ProductoTienda: {producto_tienda_id}, Precio: {precio}")
        
        for attempt in range(self.max_retries):
            try:
                response = self._request_with_token("POST", "/api/v1/precios", json_data=payload)
                
                if response.status_code in [200, 201]:
                    logger.info(f"Precio registrado con éxito (HTTP {response.status_code}) para ProductoTienda {producto_tienda_id}.")
                    return True
                elif response.status_code == 403:
                    logger.error(f"Permisos insuficientes (403 Forbidden) para guardar precio. ¿Usuario tiene ROLE_ADMIN?")
                    return False
                else:
                    logger.warning(f"Intento {attempt + 1} fallido al registrar precio (HTTP {response.status_code}): {response.text}")
                    
            except RequestException as e:
                logger.warning(f"Error de red en intento {attempt + 1} al registrar precio: {e}")
                if attempt == self.max_retries - 1:
                    raise Exception(f"Error persistente al registrar precio para ProductoTienda {producto_tienda_id}.")
            
            time.sleep(self.backoff_factor ** attempt)
            
        return False
