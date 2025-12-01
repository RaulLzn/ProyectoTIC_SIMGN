# SIMGN: Sistema de Información Minero Energético - Gas Natural 🇨🇴

> **Proyecto participante en el concurso "Datos al Ecosistema 2025" - MinTIC** > _Categoría: Reto de Entidad Pública (Ministerio de Minas y Energía)_

![Estado](https://img.shields.io/badge/Estado-Desplegado-purple) ![Licencia](https://img.shields.io/badge/Licencia-MIT-blue) ![Stack](https://img.shields.io/badge/Stack-FastAPI%20%7C%20React%20%7C%20Python-green)

## Contexto y Problemática

El gas natural es un recurso estratégico para la transición energética de Colombia. Sin embargo, la información crítica para la toma de decisiones se encuentra fragmentada:

1.  **Producción:** Gestionada por el Ministerio de Minas y Energía (MME).
2.  **Demanda y Proyecciones:** Gestionada por la UPME.
3.  **Regalías:** Publicada en Datos Abiertos (Socrata) o reportes de la ANH.

**El Problema:** Actualmente, no existe un punto único de consulta. Los analistas, entes de control y la ciudadanía deben visitar múltiples portales, descargar archivos en formatos heterogéneos y realizar cruces manuales. Esto genera opacidad y retrasa la formulación de políticas públicas.

## Nuestra Solución

**SIMGN** es una plataforma unificada que automatiza la recolección, estandarización y visualización de estos datos. Hemos desarrollado un "Punto Único de Verdad" que permite monitorear la cadena de valor del gas natural en tiempo real.

### Características Principales

- **ETL Automatizado:** Extracción y limpieza de datos dispersos (Excel, CSV, API).
- **Cruce de Variables:** Análisis integrado de Producción vs. Demanda vs. Regalías.
- **Inteligencia Territorial:** Mapas interactivos por departamentos.
- **Datos Abiertos:** Exportación de datasets ya estandarizados y limpios.

---

## Instalación y Ejecución Local

Sigue estos pasos para desplegar el entorno completo de desarrollo en tu máquina local.

### Prerrequisitos

- **Git** (Para clonar el repositorio)
- **Python 3.10** o superior
- **Node.js 18** o superior

### 1. Clonar el Repositorio

```bash
git clone [https://github.com/TU_USUARIO/SIMGN.git](https://github.com/TU_USUARIO/SIMGN.git)
cd SIMGN
```

### 2\. Configurar el Backend (API & ETL)

Navega a la carpeta del servidor:

```bash
cd apps/backend
```

Crea el entorno virtual e instala las dependencias:

```bash
# Opción A: En Windows
python -m venv venv
venv\Scripts\activate

# Opción B: En Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

Instala las librerías necesarias:

```bash
pip install -r requirements.txt
```

**(Opcional pero Recomendado)** Ejecutar el Pipeline de Datos inicial:
Este paso descargará, procesará y estandarizará los datos para llenar la base de datos local (`data.db`).

```bash
python -m etl.pipeline
```

Levantar el servidor de desarrollo:

```bash
uvicorn main:app --reload
# La API estará disponible en http://localhost:8000
```

### 3\. Configurar el Frontend (Dashboard)

Abre una **nueva terminal**, regresa a la raíz del proyecto y navega a la carpeta del cliente:

```bash
cd apps/frontend
```

Instala las dependencias y corre el proyecto:

```bash
npm install
npm run dev
```

Abre tu navegador en `http://localhost:3000`. **¡Listo\!**

---

## Contribución y Datos Abiertos

Este proyecto utiliza datos públicos bajo la licencia de Gobierno Abierto de Colombia, promoviendo la transparencia y el acceso a la información.

### Fuentes de Datos Utilizadas

| Dataset                     | Fuente                                                       | Entidad           |
| :-------------------------- | :----------------------------------------------------------- | :---------------- |
| **Liquidación de Regalías** | [Datos Abiertos Colombia](https://www.datos.gov.co/)         | ANH / MinHacienda |
| **Producción de Gas**       | [MinEnergía - Hidrocarburos](https://www.minenergia.gov.co/) | MME               |
| **Proyección de Demanda**   | [Planeación Energética](https://www1.upme.gov.co/)           | UPME              |

---
## Información adicional
**Repositorio:** https://github.com/RaulLzn/ProyectoTIC_SIMGN-backend

**Pagina web:** https://proyectotic-simgn-1.onrender.com/#/produccion

---

<p align="center">
  Desarrollado por
  <a href="https://github.com/ZValentinaF">Valentina Fuentes</a>,
  <a href="https://github.com/RaulLzn">Raúl Lozano</a> y
  <a href="https://github.com/Angelica-994">Angélica Grazt</a>
  <br>
  para el concurso <b>Datos al Ecosistema 2025</b>.
</p>
