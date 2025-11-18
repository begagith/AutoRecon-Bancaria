# AutoRecon - Sistema de Conciliación Bancaria Automática

## 1. Descripción General
AutoRecon es una aplicación web financiera diseñada para automatizar el proceso de conciliación bancaria. Permite a los contadores subir el Mayor Contable (Libros) y el Extracto Bancario, conciliando automáticamente las transacciones coincidentes mediante algoritmos de referencia y monto. Utiliza Inteligencia Artificial (Google Gemini 2.5) para analizar discrepancias y sugerir asientos contables.

## 2. Arquitectura Técnica
*   **Frontend:** React 18 + TypeScript + Vite (Desplegado en Google Cloud Run).
*   **Estilos:** Tailwind CSS.
*   **IA:** Google Gemini API.
*   **Base de Datos (Producción):** Google Cloud SQL (PostgreSQL).

## 3. Guía de Despliegue en Google Cloud Platform (GCP)

Esta aplicación está configurada ("Containerized") para desplegarse fácilmente en Google Cloud Run con conexión a Cloud SQL.

### Prerrequisitos
*   Cuenta de Google Cloud Platform.
*   Google Cloud SDK (`gcloud`) instalado.
*   Docker instalado.

### Paso 1: Preparación del Entorno
1.  Login en Google Cloud:
    ```bash
    gcloud auth login
    gcloud config set project [TU_ID_DE_PROYECTO]
    ```

2.  Habilitar servicios necesarios:
    ```bash
    gcloud services enable run.googleapis.com sqladmin.googleapis.com artifactregistry.googleapis.com
    ```

### Paso 2: Base de Datos (PostgreSQL)
Para un entorno productivo, crearemos una instancia de Cloud SQL.

1.  Crear instancia:
    ```bash
    gcloud sql instances create autorecon-db \
        --database-version=POSTGRES_15 \
        --cpu=1 --memory=3840MB \
        --region=us-central1
    ```
2.  Establecer contraseña del usuario `postgres`:
    ```bash
    gcloud sql users set-password postgres \
        --instance=autorecon-db \
        --password=[TU_PASSWORD_SEGURO]
    ```
3.  Crear la base de datos:
    ```bash
    gcloud sql databases create conciliacion_db --instance=autorecon-db
    ```

### Paso 3: Construir y Subir la Imagen Docker
Utilizaremos Artifact Registry para almacenar la imagen de la aplicación.

1.  Crear repositorio en Artifact Registry:
    ```bash
    gcloud artifacts repositories create autorecon-repo \
        --repository-format=docker \
        --location=us-central1
    ```
2.  Construir la imagen (Build):
    ```bash
    docker build -t us-central1-docker.pkg.dev/[TU_ID_DE_PROYECTO]/autorecon-repo/autorecon-app:v1 .
    ```
3.  Configurar Docker para autenticarse con GCP:
    ```bash
    gcloud auth configure-docker us-central1-docker.pkg.dev
    ```
4.  Subir la imagen (Push):
    ```bash
    docker push us-central1-docker.pkg.dev/[TU_ID_DE_PROYECTO]/autorecon-repo/autorecon-app:v1
    ```

### Paso 4: Desplegar en Cloud Run
Finalmente, desplegamos la aplicación en un entorno Serverless.

```bash
gcloud run deploy autorecon-app \
    --image us-central1-docker.pkg.dev/[TU_ID_DE_PROYECTO]/autorecon-repo/autorecon-app:v1 \
    --region us-central1 \
    --allow-unauthenticated \
    --set-env-vars API_KEY=[TU_GEMINI_API_KEY]
```

### Notas sobre Conexión a Base de Datos
En la versión actual del código, la base de datos está simulada (`mockData.ts`). Para conectar la aplicación React al Cloud SQL creado en el Paso 2, se requiere un **Backend API (Node.js/Express)** intermedio, ya que no es seguro conectar el Frontend directamente a la Base de Datos.

La arquitectura recomendada es:
1.  **Frontend (Este Repo):** Desplegado en Cloud Run.
2.  **Backend API:** Otro servicio en Cloud Run que utiliza el "Cloud SQL Auth Proxy" para conectarse a la instancia `autorecon-db`.
3.  **Conexión:** El Frontend hace llamadas `fetch()` al Backend API.

## 4. Desarrollo Local
1.  Instalar dependencias: `npm install`
2.  Configurar `.env` con `API_KEY`.
3.  Iniciar: `npm run dev`
