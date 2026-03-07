# Configuración y despliegue

## Variables de entorno (Supabase)
- SUPABASE_DB_URL=jdbc:postgresql://db.<project>.supabase.co:5432/postgres?sslmode=require
- SUPABASE_DB_USER=postgres
- SUPABASE_DB_PASSWORD=******

PowerShell (sesión actual):

```powershell
$env:SUPABASE_DB_URL = "jdbc:postgresql://db.pazwvndclbhamukazeni.supabase.co:5432/postgres?sslmode=require"
$env:SUPABASE_DB_USER = "postgres"
$env:SUPABASE_DB_PASSWORD = "TU_PASSWORD"
```

## Properties clave
- [application.properties](file:///c:/Users/Usuario/Desktop/TESIS/proyecto-tesis/backend/src/main/resources/application.properties)
  - server.port=8080
  - spring.datasource.url=...
  - spring.datasource.username=...
  - spring.datasource.password=...
  - spring.jpa.hibernate.ddl-auto=update
  - spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect

## Compilación

```bash
mvn -DskipTests clean package
```

## Consideraciones de seguridad
- Mantener secretos fuera del repositorio (usar variables de entorno).
- Passwords de usuarios almacenadas con BCrypt (PasswordEncoder).
- JWT con expiración configurable (ver JwtService).
