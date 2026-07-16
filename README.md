# 🧬 BotValia Genesis: Autonomous AI Employee Generator

[![Vibecoders League 2.0](https://img.shields.io/badge/Platzi-Vibecoders%20League%202.0-blueviolet?style=for-the-badge&logo=platzi)](https://platzi.com)
[![Next.js](https://img.shields.io/badge/Next.js-15.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Gemini API](https://img.shields.io/badge/Powered%20by-Gemini%20API-blue?style=for-the-badge&logo=google-gemini)](https://ai.google.dev/)

**BotValia Genesis** es un creador autónomo de agentes de inteligencia artificial diseñado para el **Proyecto 1: El asistente que responde por tu negocio** de **The Vibecoders League 2.0 de Platzi**.

En lugar de crear un simple chatbot estático o configurar manualmente un archivo de texto, BotValia Genesis **escanea el sitio web de cualquier negocio real**, extrae autónomamente toda su información relevante (horarios, precios, políticas, servicios), construye un **Grafo de Conocimiento Interactivo** tridimensional y genera un empleado digital de alta fidelidad listo para interactuar con tus clientes.

---

## 🚀 Características Clave

1. **Escaneo Autónomo de Negocios**: Introduce la URL de cualquier negocio. La aplicación simula y procesa la estructura de la web para extraer información valiosa en segundos.
2. **Grafo de Conocimiento Interactivo (Knowledge Graph)**: Visualiza en tiempo real las entidades de tu negocio (Productos, Horarios, Políticas, Ubicación) y cómo se interconectan.
3. **Detección de Vacíos de Información (Gaps)**: El sistema identifica qué datos críticos le faltan al asistente para operar correctamente (ej. métodos de pago o políticas de devolución) y te permite ingresarlos manualmente.
4. **Sandbox de Chat de Alta Fidelidad**: Prueba a tu nuevo empleado de IA. Respuestas rápidas, formateadas y con citas de fuentes verificadas.
5. **Cero Alucinaciones**: El asistente sigue reglas estrictas. Si la información no está en su base de conocimiento estructurada, admite que no la sabe honestamente, previniendo falsas expectativas.
6. **Métricas de Confianza y Ánimo**: Visualiza el *Trust Score* (Nivel de confianza basado en la completitud de los datos) y el estado de ánimo dinámico del agente.

---

## 🎯 Cumplimiento del Reto (Proyecto 1 - Vibecoders)

El proyecto cumple de forma robusta con todos los requerimientos establecidos:

*   **Base de Conocimiento Real (+10 datos)**: Al escanear o enriquecer el negocio, se extrae una base detallada de FAQs, precios, horarios y políticas organizados jerárquicamente.
*   **Sin Inventar (Cero Alucinaciones)**: El sistema implementa un filtro estricto. Si se le pregunta algo fuera de su conocimiento, responde: *"No dispongo de esa información específica en mi base de datos..."* y sugiere actualizar los datos del negocio.
*   **Tono de Respuesta Coherente**: El cerebro extrae el tono de voz de la marca (formal, cercano, técnico, etc.) y el asistente responde alineado a esa personalidad.
*   **Formato Único e Interactivo**: El chat está integrado en un panel de control empresarial que combina visualización de grafos, panel de configuración y herramientas de enriquecimiento manual de datos.

---

## 🛠️ Stack Tecnológico

*   **Framework**: [Next.js 15](https://nextjs.org/) (App Router & React 19)
*   **Estilos y Animaciones**: Tailwind CSS & [Framer Motion](https://www.framer.com/motion/)
*   **Modelos de Lenguaje**: Google Gemini API via SDK oficial [`@google/genai`](https://github.com/google/generative-ai-js)
*   **Iconografía**: Lucide React
*   **Visualización**: SVG interactivo optimizado para grafos relacionales de conocimiento.

---

## 💻 Guía de Inicio Rápido

### Prerrequisitos

*   Node.js (versión 18 o superior)
*   Una API Key de **Google Gemini** (puedes obtenerla gratis en Google AI Studio)

### Instalación

1.  **Clona el repositorio**:
    ```bash
    git clone https://github.com/GaruBrothers/BotValia-Genesis.git
    cd BotValia-Genesis
    ```

2.  **Instala las dependencias**:
    ```bash
    npm install
    ```

3.  **Configura las variables de entorno**:
    Crea un archivo `.env.local` en la raíz del proyecto y añade tus credenciales:
    ```env
    GEMINI_API_KEY="Tu_Gemini_API_Key"
    APP_URL="http://localhost:3000"
    ```

4.  **Inicia el servidor de desarrollo**:
    ```bash
    npm run dev
    ```
    Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la aplicación funcionando.

5.  **Compila para producción**:
    ```bash
    npm run build
    ```

---

## 🤝 Contribuciones y Comunidad

Este proyecto es de código abierto y ha sido adaptado especialmente para el concurso Vibecoders de Platzi. Si deseas probarlo o dar feedback:
1. Deja tu voto y comentario en la sección de aportes del curso de Platzi.
2. ¡Haz preguntas difíciles al bot para comprobar cómo evita alucinaciones!
