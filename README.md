# 📊 Prototipo de Comparación de Precios y Optimización de Compras en Supermercados

Sistema web desarrollado como prototipo de trabajo final de grado que
permite comparar precios de productos entre distintos supermercados
mediante técnicas de **web scraping**, ayudando a los usuarios a
optimizar sus decisiones de compra.

------------------------------------------------------------------------

## 📌 Descripción del proyecto

Este proyecto tiene como objetivo diseñar e implementar una herramienta
digital capaz de:

-   Recolectar precios de productos desde sitios web de supermercados
    mediante técnicas de web scraping.
-   Comparar precios automáticamente.
-   Permitir a los usuarios crear listas de compra.
-   Estimar el presupuesto total basado en los precios obtenidos.
-   Facilitar la toma de decisiones económicas mediante análisis
    comparativo.

El sistema está dividido en dos aplicaciones principales:

-   Backend (API REST) --- Spring Boot
-   Frontend (Aplicación Web) --- React + TypeScript

------------------------------------------------------------------------

## 🏗️ Arquitectura del proyecto

    proyecto-tesis/
    │
    ├── backend/   → API REST desarrollada con Spring Boot
    │
    └── frontend/  → Aplicación cliente en React + TypeScript

------------------------------------------------------------------------

## ⚙️ Tecnologías utilizadas

### Backend

-   Java
-   Spring Boot
-   Spring Web
-   Spring Data
-   Web Scraping (algoritmos personalizados)
-   REST API

### Frontend

-   React
-   TypeScript
-   HTML / CSS
-   Consumo de APIs REST

------------------------------------------------------------------------

## 🚀 Instalación y ejecución

### 1️⃣ Clonar el repositorio

``` bash
git clone https://github.com/nicolas2289h/proyecto-tesis.git
cd proyecto-tesis
```

------------------------------------------------------------------------

### 2️⃣ Ejecutar Backend

``` bash
cd backend
./mvnw spring-boot:run
```

El backend se iniciará en:

    http://localhost:8080

------------------------------------------------------------------------

### 3️⃣ Ejecutar Frontend

``` bash
cd frontend
npm install
npm run dev
```

La aplicación estará disponible en:

    http://localhost:5173

------------------------------------------------------------------------

## 🧩 Funcionalidades principales

✅ Gestión de usuarios (registro/login)\
✅ Creación y gestión de listas de compra\
✅ Comparación de precios entre supermercados\
✅ Búsqueda y filtrado de productos\
✅ Estimación de presupuesto total\
✅ Integración con backend mediante API REST

------------------------------------------------------------------------

## 📚 Metodología

El proyecto sigue un enfoque basado en metodologías ágiles (Scrum),
utilizando iteraciones incrementales para el desarrollo progresivo de
funcionalidades.

------------------------------------------------------------------------

## 🔎 Web Scraping

El sistema implementa técnicas de web scraping para:

-   Obtener información pública sobre productos.
-   Extraer precios actualizados.
-   Normalizar datos para comparación automática.

Se aplican buenas prácticas para:

-   Respetar políticas de uso.
-   Limitar frecuencia de solicitudes.
-   Evitar sobrecarga de servidores.

------------------------------------------------------------------------

## 👨‍💻 Autores

Nicolás Huanca<br>
Nicolás Valdez

------------------------------------------------------------------------

## 📄 Licencia

Proyecto académico desarrollado con fines educativos.

------------------------------------------------------------------------
