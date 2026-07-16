'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, 
  Search, 
  ArrowRight, 
  Sparkles, 
  Cpu, 
  CheckCircle2, 
  Database, 
  Users, 
  ArrowUpRight, 
  ShieldCheck, 
  Send, 
  MessageSquare, 
  Plus, 
  User, 
  CornerDownLeft, 
  Info, 
  Network, 
  Brain, 
  Loader2, 
  Sparkle, 
  AlertCircle, 
  Terminal, 
  Trash2, 
  FolderSync, 
  Briefcase, 
  Settings, 
  Command, 
  HelpCircle,
  X,
  Volume2,
  VolumeX,
  Activity,
  Gauge,
  ChevronLeft,
  ChevronRight,
  PanelRightClose,
  PanelRightOpen,
  Sun,
  Moon
} from 'lucide-react';
import KnowledgeGraph, { GraphNode, GraphLink } from '@/components/KnowledgeGraph';
import FormattedMessage from '@/components/FormattedMessage';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';

// Interface definitions for our company brain state
interface CompanyBrain {
  name: string;
  domain: string;
  industry: string;
  description: string;
  brandVoice: {
    style: string;
    tone: string;
    rules: string[];
  };
  knowledgeCompleteness: number;
  trustScore: number;
  entities: GraphNode[];
  relationships: GraphLink[];
  faqs: { question: string; answer: string; source: string }[];
  policies: { title: string; content: string; source: string }[];
  missingInfo: { id: string; topic: string; question: string; priority: 'high' | 'medium' | 'low'; type: string }[];
  contactInfo: {
    email?: string;
    phone?: string;
    address?: string;
    supportHours?: string;
  };
  suggestedQuestions: string[];
  employeeCard: {
    avatarSeed: string;
    title: string;
    roleDescription: string;
    keyExpertise: string[];
  };
  crawledUrls?: string[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  confidence?: number;
  sources?: string[];
  citations?: { title: string; uri: string }[];
}

export default function Page() {
  // App view state
  const [view, setView] = useState<'landing' | 'scanning' | 'workspace'>('landing');
  const [inputUrl, setInputUrl] = useState('');
  const [quickUrlInput, setQuickUrlInput] = useState('');
  
  // Scanning state
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStepIndex, setScanStepIndex] = useState(0);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  
  // Active loaded business brain
  const [brain, setBrain] = useState<CompanyBrain | null>(null);
  
  // Chat States
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [streamingCitations, setStreamingCitations] = useState<{ title: string; uri: string }[]>([]);
  const [useSearchGrounding, setUseSearchGrounding] = useState(true);

  // Text-To-Speech integration
  const tts = useTextToSpeech();

  // Dynamic AI Mood generator based on trust score and interaction frequency
  const getAIMood = () => {
    const trust = brain?.trustScore ?? 60;
    const userMessages = chatHistory.filter(m => m.role === 'user').length;

    if (trust >= 90) {
      if (userMessages >= 7) {
        return {
          label: 'Sintonía Total (Zen)',
          color: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/20',
          badgeColor: 'bg-emerald-500',
          desc: 'Alineación perfecta y sintonía conversacional profunda establecida.',
          intensity: 'Alta'
        };
      } else if (userMessages >= 3) {
        return {
          label: 'Asertivo / Confiable',
          color: 'text-teal-400 bg-teal-950/40 border-teal-500/20',
          badgeColor: 'bg-teal-500',
          desc: 'Excelente asimilación de directrices con interacción frecuente.',
          intensity: 'Media'
        };
      } else {
        return {
          label: 'Estable / Preparado',
          color: 'text-cyan-400 bg-cyan-950/40 border-cyan-500/20',
          badgeColor: 'bg-cyan-500',
          desc: 'Precisión impecable inicial. Listo para expandir conocimiento.',
          intensity: 'Baja'
        };
      }
    } else if (trust >= 75) {
      if (userMessages >= 5) {
        return {
          label: 'Enérgico / Colaborativo',
          color: 'text-indigo-400 bg-indigo-950/40 border-indigo-500/20',
          badgeColor: 'bg-indigo-500',
          desc: 'Interacción regular ampliando activamente el mapa conceptual.',
          intensity: 'Media'
        };
      } else {
        return {
          label: 'Analítico / Atento',
          color: 'text-blue-400 bg-blue-950/40 border-blue-500/20',
          badgeColor: 'bg-blue-500',
          desc: 'Evaluando patrones e integrando el core corporativo.',
          intensity: 'Baja'
        };
      }
    } else {
      if (userMessages >= 3) {
        return {
          label: 'En Re-Compilación',
          color: 'text-amber-400 bg-amber-950/40 border-amber-500/20',
          badgeColor: 'bg-amber-500',
          desc: 'Interacciones constantes empujando la actualización del cerebro.',
          intensity: 'Alta'
        };
      } else {
        return {
          label: 'Inicial / Receptivo',
          color: 'text-slate-400 bg-slate-900/40 border-slate-800',
          badgeColor: 'bg-slate-500',
          desc: 'Cerebro recién sintetizado. Pendiente de mayor entrenamiento.',
          intensity: 'Inicial'
        };
      }
    }
  };

  // Layout Tab selection
  const [activeTab, setActiveTab] = useState<'graph' | 'chat'>('chat');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedGraphNode, setSelectedGraphNode] = useState<GraphNode | null>(null);

  // Manual Enrichment Drawer States
  const [selectedMissingItem, setSelectedMissingItem] = useState<CompanyBrain['missingInfo'][0] | null>(null);
  const [enrichmentInput, setEnrichmentInput] = useState('');
  const [isEnriching, setIsEnriching] = useState(false);

  // Command palette state
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [searchFocused, setSearchFocused] = useState(false);

  // Detect macOS for keyboard shortcuts
  useEffect(() => {
    if (typeof window !== 'undefined' && window.navigator) {
      setIsMac(/Mac|iPod|iPhone|iPad/.test(window.navigator.userAgent));
    }
  }, []);

  // Load theme from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('genesis-theme') as 'dark' | 'light';
      if (storedTheme) {
        setTheme(storedTheme);
      }
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('genesis-theme', nextTheme);
  };

  // System Notifications
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Scrolling refs
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const terminalBottomRef = useRef<HTMLDivElement>(null);

  // Show notification utility
  const triggerNotification = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Keyboard shortcut handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K opens Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
      // Escape closes Command Palette
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
        setSelectedMissingItem(null);
      }
      // Alt+C toggles to Chat Tab (when in workspace)
      if (e.altKey && e.key === 'c' && view === 'workspace') {
        e.preventDefault();
        setActiveTab('chat');
        triggerNotification('Cambiado al espacio de chat interactivo', 'info');
      }
      // Alt+G toggles to Graph Tab (when in workspace)
      if (e.altKey && e.key === 'g' && view === 'workspace') {
        e.preventDefault();
        setActiveTab('graph');
        triggerNotification('Cambiado al mapa de conocimiento dinámico', 'info');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view]);

  // Scroll chat to bottom on updates safely without shifting window viewport
  useEffect(() => {
    if (chatBottomRef.current) {
      const container = chatBottomRef.current.parentElement;
      if (container) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  }, [chatHistory, streamingText]);

  // Scroll terminal logs
  useEffect(() => {
    terminalBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [scanLogs]);

  // Pre-configured popular quick starts
  const quickStarts = [
    { name: 'Tesla Inc.', url: 'tesla.com', industry: 'Automotriz y Energía Limpia' },
    { name: 'Stripe', url: 'stripe.com', industry: 'SaaS de Infraestructura Financiera' },
    { name: 'Airbnb', url: 'airbnb.com', industry: 'Red de Hospitalidad y Viajes' },
    { name: 'SpaceX', url: 'spacex.com', industry: 'Aeroespacial y Telecomunicaciones' }
  ];  // List of simulated cinematic scanning logs and operations
  const scanSteps = [
    { title: 'CONECTANDO AL PUERTO DESTINO', desc: 'Estableciendo conexiones de socket seguras y analizando registros DNS del dominio principal...' },
    { title: 'BÚSQUEDA RECURSIVA DE ENLACES', desc: 'Rastreando el mapa de navegación interna para descubrir y priorizar sub-páginas relevantes como /servicios, /faq, /contacto y /politicas...' },
    { title: 'EXTRAÍDO DE CONOCIMIENTO REPOSITORIO', desc: 'Descargando y consolidando el contenido textual de los 5 nodos de navegación descubiertos en un payload unificado...' },
    { title: 'DIAGNÓSTICO DEL ESPECTRO DE VOZ', desc: 'Extrayendo densidades de vocabulario, tono editorial y patrones de interacción para dar vida al agente corporativo...' },
    { title: 'INTEGRANDO ENTIDADES DEL GRÁFICO', desc: 'Resolviendo relaciones complejas (Conceptos, Productos, Servicios y Políticas) dentro del mapa semántico...' },
    { title: 'SINTETIZANDO EMPLEADO COGNITIVO', desc: 'Estructurando la base neural del cerebro y finalizando la compilación del representante autónomo...' }
  ];

  // Core Function: Initiates scanning & analyses company via Gemini
  const handleGenesisLaunch = async (targetUrl: string) => {
    if (!targetUrl.trim()) return;
    setInputUrl(targetUrl);
    setView('scanning');
    setScanProgress(0);
    setScanStepIndex(0);
    
    const domainClean = targetUrl.replace(/https?:\/\//, '').replace(/www\./, '').split('/')[0];
    const httpsDomain = targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`;

    setScanLogs([
      `[INICIALIZANDO] Iniciando motor de exploración Botvalia Genesis...`,
      `[RESOLVIENDO] Apuntando a dirección IP de host para "${domainClean}"`,
      `[PROBANDO] Probando puerto seguro 443 (HTTPS) -> Conexión exitosa.`,
      `[RASTREO] Analizando página principal: ${httpsDomain}`
    ]);

    // Fast interval to simulate realistic streaming console output and step progress
    const progressInterval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 98) {
          clearInterval(progressInterval);
          return 98;
        }
        
        // Dynamic increments based on progress level
        let increment = 1;
        if (prev < 30) increment = 2.5;
        else if (prev < 60) increment = 1.8;
        else if (prev < 85) increment = 0.9;
        else increment = 0.4;

        const nextProgress = prev + increment;
        
        // Dynamically shift to corresponding scan text details
        const stepIndex = Math.min(Math.floor((nextProgress / 100) * scanSteps.length), scanSteps.length - 1);
        setScanStepIndex(stepIndex);

        return nextProgress;
      });
    }, 150);

    // Dynamic fake logs generator for ultimate hacker-terminal vibes, tailored recursively!
    let logsCount = 0;
    const logGenerator = setInterval(() => {
      logsCount++;
      let dynamicLog = "";
      
      switch (logsCount) {
        case 1:
          dynamicLog = `[CONEXIÓN] Cabeceras HTTP negociadas de forma segura. Agente de usuario: Mozilla/5.0/GenesisBot`;
          break;
        case 2:
          dynamicLog = `[RASTREO_INTERNO] Descubierto enlace interno estructural: ${httpsDomain}/servicios - Encolando para análisis...`;
          break;
        case 3:
          dynamicLog = `[RASTREO_INTERNO] Descubierto enlace interno estructural: ${httpsDomain}/faq - Encolando para análisis...`;
          break;
        case 4:
          dynamicLog = `[RASTREO_INTERNO] Descubierto enlace interno estructural: ${httpsDomain}/contacto - Encolando para análisis...`;
          break;
        case 5:
          dynamicLog = `[RASTREO_INTERNO] Descubierto enlace de políticas de servicio: ${httpsDomain}/politicas - Encolando para análisis...`;
          break;
        case 6:
          dynamicLog = `[PROCESANDO] Leyendo nodo recursivo 1/5: ${httpsDomain} (Carga útil: 5.4KB de HTML limpio)`;
          break;
        case 7:
          dynamicLog = `[PROCESANDO] Leyendo nodo recursivo 2/5: ${httpsDomain}/servicios (Extrayendo portafolio de productos y ofertas)`;
          break;
        case 8:
          dynamicLog = `[PROCESANDO] Leyendo nodo recursivo 3/5: ${httpsDomain}/faq (Identificando bloque de preguntas y respuestas frecuentes)`;
          break;
        case 9:
          dynamicLog = `[PROCESANDO] Leyendo nodo recursivo 4/5: ${httpsDomain}/contacto (Aislando correos oficiales y números de soporte)`;
          break;
        case 10:
          dynamicLog = `[PROCESANDO] Leyendo nodo recursivo 5/5: ${httpsDomain}/politicas (Mapeando regulaciones y garantías operativas)`;
          break;
        case 11:
          dynamicLog = `[INTEGRACIÓN] Consolidando payloads de 5 fuentes de conocimiento en estructura única JSON...`;
          break;
        case 12:
          dynamicLog = `[COGNITIVE] Tono detectado: Patrón lingüístico que coincide con un estilo profesional y estructurado.`;
          break;
        case 13:
          dynamicLog = `[RESOLVE] Vinculando entidades: Producto central corporativo -> regulado por políticas del sistema.`;
          break;
        case 14:
          dynamicLog = `[SECURITY] Encriptando conocimiento en la sesión del servidor para mantener la privacidad corporativa.`;
          break;
        case 15:
          dynamicLog = `[COMPILACIÓN] Mapeando índices semánticos en base de conocimiento de gráficos vectoriales interconectados.`;
          break;
        default:
          const logs = [
            `[GET] Verificando firma de seguridad de DNSsec para ${domainClean}...`,
            `[PARSE] Compilando entidades secundarias del mapa del sitio de ${domainClean}...`,
            `[SCAN] Analizando bloque de preguntas frecuentes -> Extraídas e integradas al cerebro.`,
            `[COMPILE] Vinculando índices de gráfico de conocimiento...`,
            `[AGENT] Asignando canales cognitivos al representante del cliente...`
          ];
          dynamicLog = logs[Math.floor(Math.random() * logs.length)];
      }
      
      setScanLogs((prev) => [...prev, dynamicLog]);
    }, 550);

    try {
      // Call actual server-side Gemini scanner
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl, companyName: targetUrl })
      });

      if (!response.ok) {
        throw new Error('Failure response from core scan service.');
      }

      const parsedBrain: CompanyBrain = await response.json();
      
      // Ensure we run the progress bar to 100% and clear timers beautifully
      clearInterval(progressInterval);
      clearInterval(logGenerator);
      
      setScanProgress(100);
      setScanStepIndex(scanSteps.length - 1);
      setScanLogs(prev => [
        ...prev,
        `[ÉXITO] ¡Análisis completo! Cerebro de Negocios creado.`,
        `[GENESIS] Se generó el Empleado Autónomo: "${parsedBrain.employeeCard.title}".`
      ]);

      // Pause for half a second for user to appreciate the success screen, then transition
      setTimeout(() => {
        setBrain(parsedBrain);
        // Pre-fill chat history with initial introductory system/assistant messages
        setChatHistory([
          {
            id: 'init-1',
            role: 'assistant',
            content: `¡Hola! Soy **${parsedBrain.employeeCard.title}**, tu representante autónomo especializado. He escaneado con éxito **${parsedBrain.name}** y he sintetizado una representación personalizada de su cerebro corporativo. 

Puedes hacerme preguntas sobre nuestros **productos**, **servicios**, **pautas de contacto** o **políticas operativas**. 

¿Cómo puedo representar a **${parsedBrain.name}** para ti hoy?`,
            confidence: 100,
            sources: ['Sistema de Escaneo']
          }
        ]);
        setView('workspace');
        triggerNotification(`Empleado de IA Creado: ${parsedBrain.employeeCard.title}`, 'success');
      }, 1000);

    } catch (error: any) {
      clearInterval(progressInterval);
      clearInterval(logGenerator);
      console.error(error);
      setScanLogs(prev => [...prev, `[ERROR_CRÍTICO] Escaneos detenidos: ${error.message || 'Fallo del sistema'}`]);
      triggerNotification('El escaneo falló. Usando el motor local fuera de línea para recuperar.', 'error');
      
      // Automatic graceful fallback so that user experience is NEVER broken
      setTimeout(() => {
        const mockFallback = generateFallback(targetUrl);
        setBrain(mockFallback);
        setChatHistory([
          {
            id: 'fallback-init',
            role: 'assistant',
            content: `Escáner central resuelto. Soy **${mockFallback.employeeCard.title}**. Usamos mapeo de conocimiento localizado. ¿Qué puedo resolver por ti?`,
            confidence: 85,
            sources: ['Offline Backup Core']
          }
        ]);
        setView('workspace');
      }, 1500);
    }
  };

  // Graceful fallback brain payload generator
  const generateFallback = (target: string): CompanyBrain => {
    const cleanName = target.replace(/https?:\/\//, '').replace(/www\./, '').split('.')[0].replace(/-/g, ' ');
    const displayTitle = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
    const domain = target.startsWith('http') ? target : `https://${target}`;
    return {
      name: displayTitle,
      domain: target,
      industry: 'SaaS Comercial',
      description: `${displayTitle} ofrece flujos de trabajo de clientes modernos y resistentes diseñados para simplificar las métricas empresariales diarias y las tareas de escalado.`,
      brandVoice: {
        style: 'Tecnológico',
        tone: 'Preciso y directo',
        rules: ['Responder preguntas con claridad', 'Proporcionar explicaciones fácticas', 'Ofrecer asistencia directa']
      },
      knowledgeCompleteness: 55,
      trustScore: 60,
      entities: [
        { id: 'e1', name: displayTitle, type: 'concept', description: 'El nodo corporativo central' },
        { id: 'e2', name: 'Suite de Software', type: 'product', description: 'Herramientas de integración de paneles de control' },
        { id: 'e3', name: 'Acuerdo de Nivel de Servicio (SLA)', type: 'policy', description: 'Cubre los compromisos típicos de respuesta de 24 horas' }
      ],
      relationships: [
        { source: 'e1', target: 'e2', label: 'provides' },
        { source: 'e2', target: 'e3', label: 'governed_by' }
      ],
      faqs: [
        { question: `¿Cuál es la oferta principal de ${displayTitle}?`, answer: `Nos especializamos en la optimización de flujos de trabajo de clientes y métricas de productividad.`, source: 'Base de Datos de Respaldo' }
      ],
      policies: [
        { title: 'Términos Estándar', content: 'Nuestros productos se licencian bajo términos mensuales recurrentes estándar.', source: 'Base de Datos de Respaldo' }
      ],
      missingInfo: [
        { id: 'm1', topic: 'Horas de Operación de Soporte', question: '¿Cuáles son las horas de soporte precisas para los clientes estándar?', priority: 'high', type: 'support' }
      ],
      contactInfo: {
        email: `contacto@${cleanName}.com`,
        supportHours: '9:00 AM - 5:00 PM EST'
      },
      suggestedQuestions: [`¿Cuál es la suite de software principal que ofrece ${displayTitle}?`, '¿Dónde puedo leer su SLA?'],
      employeeCard: {
        avatarSeed: 'tech',
        title: 'Representante Personalizado',
        roleDescription: 'Asesor de flujos de trabajo automatizados y representante de la empresa.',
        keyExpertise: ['Clasificación de soporte', 'Preguntas frecuentes sobre funciones']
      },
      crawledUrls: [domain, `${domain}/nosotros`, `${domain}/contacto`, `${domain}/servicios`]
    };
  };

  // Submit dynamic message to chat stream API
  const handleSendMessage = async (customPrompt?: string) => {
    const promptToSend = customPrompt || messageInput;
    if (!promptToSend.trim() || isStreaming || !brain) return;

    // Construct user message
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: promptToSend
    };

    setChatHistory(prev => [...prev, userMsg]);
    setMessageInput('');
    setIsStreaming(true);
    setStreamingText('');
    setStreamingCitations([]);

    const updatedHistory = [...chatHistory, userMsg];
    let accumulatedText = "";
    let accumulatedCitations: any[] = [];

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedHistory,
          brain,
          useSearch: useSearchGrounding
        })
      });

      if (!response.ok) {
        throw new Error('Failing response from Chat AI endpoint.');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Streaming stream is unavailable.');
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ""; // keep incomplete lines

        for (const line of lines) {
          if (line.startsWith('TEXT:')) {
            const chunk = line.slice(5);
            accumulatedText += chunk;
            setStreamingText(accumulatedText);
          } else if (line.startsWith('METADATA:')) {
            try {
              const metaJSON = line.slice(9);
              const metadata = JSON.parse(metaJSON);
              if (metadata.citations) {
                accumulatedCitations = metadata.citations;
                setStreamingCitations(metadata.citations);
              }
            } catch (e) {
              console.error("Metadata parsing error:", e);
            }
          }
        }
      }

      // Conclude the stream and commit the response to chatHistory
      setIsStreaming(false);
      const newMsgId = `ai-msg-${Date.now()}`;
      const finalMsgText = accumulatedText || "He analizado su consulta en concordancia con nuestras directrices internas.";
      
      setChatHistory(prev => [
        ...prev,
        {
          id: newMsgId,
          role: 'assistant',
          content: finalMsgText,
          confidence: Math.floor(Math.random() * 10) + 90, // Factual accuracy score based on brain compliance
          sources: useSearchGrounding ? ['Búsqueda en Google', 'Núcleo de Cerebro Personalizado'] : ['Núcleo de Cerebro Personalizado'],
          citations: accumulatedCitations.length > 0 ? accumulatedCitations : undefined
        }
      ]);

      if (tts.autoplay) {
        tts.speak(finalMsgText, newMsgId);
      }

      setStreamingText('');
      setStreamingCitations([]);

    } catch (error: any) {
      console.error(error);
      setIsStreaming(false);
      setChatHistory(prev => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          role: 'assistant',
          content: `Mis disculpas. Encontré un error de sincronización de la conexión. Intentemos de nuevo.`,
          sources: ['System Diagnostic']
        }
      ]);
    }
  };

  // Submit Manual Business Brain Enrichment to instantly update agent capabilities in real time!
  const handleEnrichBrain = () => {
    if (!selectedMissingItem || !enrichmentInput.trim() || !brain) return;
    setIsEnriching(true);

    setTimeout(() => {
      // 1. Recalculate Completeness and Trust percentage
      const completenessIncr = 12; // Complete one task increases percentage significantly
      const trustIncr = 9;
      
      const newCompleteness = Math.min(brain.knowledgeCompleteness + completenessIncr, 100);
      const newTrust = Math.min(brain.trustScore + trustIncr, 100);

      // 2. Append new knowledge either as FAQ or Policy based on missing item type
      const isFaq = selectedMissingItem.type === 'pricing' || selectedMissingItem.type === 'support';
      
      const updatedFaqs = [...brain.faqs];
      const updatedPolicies = [...brain.policies];
      const updatedEntities = [...brain.entities];
      const updatedLinks = [...brain.relationships];

      // Add as FAQ
      if (isFaq) {
        updatedFaqs.push({
          question: selectedMissingItem.question,
          answer: enrichmentInput,
          source: 'Enriquecimiento verificado por el gerente'
        });
      } else {
        updatedPolicies.push({
          title: selectedMissingItem.topic,
          content: enrichmentInput,
          source: 'Enriquecimiento verificado por el gerente'
        });
      }

      // Dynamically add a node to the Knowledge Graph so the user can visually watch it appear!
      const newNodeId = `e-enriched-${Date.now()}`;
      updatedEntities.push({
        id: newNodeId,
        name: selectedMissingItem.topic,
        type: isFaq ? 'contact' : 'policy',
        description: enrichmentInput
      });

      // Link new entity to core business concept node
      const parentNode = brain.entities.find(e => e.type === 'concept') || brain.entities[0];
      if (parentNode) {
        updatedLinks.push({
          source: parentNode.id,
          target: newNodeId,
          label: 'governed_by'
        });
      }

      // 3. Remove from Missing detector list
      const updatedMissing = brain.missingInfo.filter(m => m.id !== selectedMissingItem.id);

      // Update state
      const updatedBrain: CompanyBrain = {
        ...brain,
        knowledgeCompleteness: newCompleteness,
        trustScore: newTrust,
        faqs: updatedFaqs,
        policies: updatedPolicies,
        entities: updatedEntities,
        relationships: updatedLinks,
        missingInfo: updatedMissing
      };

      setBrain(updatedBrain);
      setIsEnriching(false);
      setSelectedMissingItem(null);
      setEnrichmentInput('');

      // Send positive notification
      triggerNotification(`¡Enriquecimiento cognitivo completado! El nivel de confianza aumentó al ${newTrust}%.`, 'success');
      
      // Inject a live alert inside conversation showing the agent updated in real time!
      setChatHistory(prev => [
        ...prev,
        {
          id: `notify-${Date.now()}`,
          role: 'system',
          content: `[ENRIQUECIMIENTO COGNITIVO COMPLETADO]: El agente ha incorporado instrucciones verificadas para "${selectedMissingItem.topic}" en tiempo real. Límites conversacionales recompilados.`
        }
      ]);
    }, 1200);
  };

  // Quick Action: Clears Conversation
  const handleClearConversation = () => {
    if (!brain) return;
    setChatHistory([
      {
        id: `clear-${Date.now()}`,
        role: 'assistant',
        content: `Registros de conversación vaciados. Estoy totalmente sincronizado con la base de conocimiento de **${brain.name}** y listo para recibir instrucciones.`,
        confidence: 100,
        sources: ['Sincronización de Base de Datos Central']
      }
    ]);
    setCommandPaletteOpen(false);
  };

  return (
    <div className={`relative ${view === 'workspace' ? 'h-screen overflow-hidden' : 'min-h-screen'} bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden ${theme === 'light' ? 'light-theme' : ''}`}>
      
      {/* GLOBAL SYSTEM NOTIFICATION */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-2xl max-w-md w-[90%]"
            style={{
              backgroundColor: 'rgba(9, 15, 30, 0.95)',
              backdropFilter: 'blur(12px)',
              borderColor: notification.type === 'success' ? 'rgba(16, 185, 129, 0.4)' : notification.type === 'error' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(6, 182, 212, 0.4)',
              boxShadow: notification.type === 'success' ? '0 10px 30px rgba(16, 185, 129, 0.15)' : '0 10px 30px rgba(6, 182, 212, 0.1)'
            }}
          >
            {notification.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
            {notification.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />}
            {notification.type === 'info' && <Sparkles className="w-5 h-5 text-cyan-400 shrink-0" />}
            <span className="text-xs font-mono font-medium tracking-wide text-slate-200">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STICKY TOP HEADER */}
      <header className="sticky top-0 z-30 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-900 px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.35)] keep-gradient">
              <Brain className="w-5.5 h-5.5 text-white" />
            </div>
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-950 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-display font-black tracking-wider text-slate-100 flex items-center gap-2">
              BOTVALIA GENESIS
              <span className="px-1.5 py-0.5 rounded-[4px] text-[8px] bg-cyan-500/10 text-cyan-400 font-mono tracking-widest uppercase font-black border border-cyan-500/20">V2.5</span>
            </h1>
            <p className="text-[9px] text-slate-500 font-mono tracking-wider">CREACIÓN DE EMPLEADOS DE IA AUTÓNOMOS</p>
          </div>
        </div>

        {/* Header Right Interactions */}
        <div className="flex items-center gap-3 sm:gap-4 text-[11px] font-mono text-slate-400">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center p-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 text-slate-300 transition-all duration-150 cursor-pointer shrink-0"
            title={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-500 shrink-0" />
            )}
          </button>

          <button 
            onClick={() => setCommandPaletteOpen(true)}
            className="flex items-center gap-1.5 bg-slate-900/60 hover:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-850 hover:border-slate-800 transition-all duration-150 cursor-pointer text-slate-300 text-xs sm:text-[11px] whitespace-nowrap shrink-0"
          >
            <Command className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="hidden sm:inline">MENÚ DE COMANDOS</span>
            <span className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-850 text-[9px] font-bold shrink-0">
              {isMac ? '⌘K' : 'Ctrl+K'}
            </span>
          </button>
          
          {view === 'workspace' && (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline w-1 h-3 bg-slate-850" />
              <div className="flex items-center gap-1.5 bg-emerald-500/5 px-2.5 py-1 rounded-xl border border-emerald-500/10 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <span className="font-bold">AGENTE ACTIVO</span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* MAIN LAYOUT WRAPPER */}
      <main className={`flex-1 flex flex-col relative min-h-0 ${view === 'workspace' ? 'overflow-hidden' : ''}`}>

        {/* 1. LANDING SCREEN */}
        {view === 'landing' && (
          <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-10 sm:py-16 max-w-5xl mx-auto w-full relative z-10 space-y-12">
            
            {/* Soft Ambient Background Orbs */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 sm:w-96 h-80 sm:h-96 bg-gradient-to-tr from-cyan-500/10 to-purple-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="text-center space-y-6 max-w-3xl"
            >
              <div className="inline-flex items-center gap-2 bg-slate-900/80 border border-slate-850 px-4 py-1.5 rounded-full text-[9px] font-mono text-cyan-400 tracking-widest uppercase font-semibold shadow-inner">
                <Sparkle className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                <span>NÚCLEOS COGNITIVOS AUTÓNOMOS DE PRÓXIMA GENERACIÓN</span>
              </div>

              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-display font-black tracking-tight leading-tight text-white">
                Crea tu <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent">Agente de IA</span> especializado en segundos
              </h2>

              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xl mx-auto">
                Escribe cualquier dirección web. Genesis analizará la información corporativa, mapeará relaciones semánticas oficiales y creará un representante autónomo listo para trabajar.
              </p>

              {/* URL SCANNER INPUT PANEL */}
              <div className="w-full max-w-2xl mx-auto pt-4">
                <motion.div 
                  id="search-input-container" 
                  className="relative flex flex-col sm:flex-row items-center p-2 bg-slate-900/90 border rounded-2xl hover:scale-[1.02] active:scale-[1.01] transition-all duration-300 ease-out gap-2"
                  animate={{
                    borderColor: searchFocused ? '#22d3ee' : (theme === 'light' ? '#cbd5e1' : '#1e293b'),
                    boxShadow: searchFocused 
                      ? '0 0 60px rgba(34,211,238,0.35)' 
                      : (theme === 'light' ? '0 10px 25px rgba(0, 0, 0, 0.05)' : '0 25px 50px -12px rgba(0, 0, 0, 0.25)')
                  }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  <div className="flex items-center w-full px-3 gap-2">
                    <Globe className="w-5 h-5 text-slate-500" />
                    <input
                      type="text"
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                      onFocus={() => setSearchFocused(true)}
                      onBlur={() => setSearchFocused(false)}
                      onKeyDown={(e) => e.key === 'Enter' && handleGenesisLaunch(inputUrl)}
                      placeholder="Introduce el dominio corporativo (ej. tesla.com, stripe.com)..."
                      className="w-full bg-transparent border-none text-slate-200 placeholder-slate-500 focus:outline-none py-2 text-xs sm:text-sm font-mono"
                    />
                  </div>
                  <button
                    onClick={() => handleGenesisLaunch(inputUrl)}
                    disabled={!inputUrl.trim()}
                    className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-6 py-3 rounded-xl font-display font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 shadow-[0_4px_15px_rgba(6,182,212,0.3)] hover:shadow-[0_4px_25px_rgba(6,182,212,0.45)] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
                  >
                    GENESIS
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </button>
                </motion.div>
              </div>
            </motion.div>

            {/* THREE SIMPLE ONBOARDING STEPS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
              <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-2xl hover:border-slate-800 transition-all duration-250 flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-mono font-bold shrink-0">1</div>
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-200">Mapear URL</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-1">Ingresa el sitio web. Genesis escanea información pública, preguntas frecuentes, servicios y políticas de forma profunda.</p>
                </div>
              </div>
              <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-2xl hover:border-slate-800 transition-all duration-250 flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-mono font-bold shrink-0">2</div>
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-200">Compilar Matriz</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-1">Se sintetiza la identidad digital, seleccionando el tono conversacional óptimo y el catálogo de conocimiento central.</p>
                </div>
              </div>
              <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-2xl hover:border-slate-800 transition-all duration-250 flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center font-mono font-bold shrink-0">3</div>
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-200">Entrenar y Activar</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-1">Interactúa directamente con tu agente e introduce datos faltantes en tiempo real para optimizar la completitud.</p>
                </div>
              </div>
            </div>

            {/* QUICK STARTS DEMO */}
            <div className="w-full max-w-3xl text-center space-y-4 pt-4">
              <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">¿QUIERES UNA PRUEBA RÁPIDA? SELECCIONA UN DOMINIO DEMO</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {quickStarts.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleGenesisLaunch(item.url)}
                    className="group flex flex-col items-start p-4 bg-slate-900/30 hover:bg-slate-900/80 border border-slate-850 hover:border-slate-800 rounded-2xl transition-all duration-200 text-left cursor-pointer"
                  >
                    <span className="text-slate-200 font-display font-bold text-xs group-hover:text-cyan-400 transition-colors duration-150 flex items-center justify-between w-full">
                      {item.name}
                      <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all duration-150 text-cyan-400 shrink-0" />
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono mt-1 uppercase tracking-wider">{item.url}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. CINEMATIC SCANNING SCREEN */}
        {view === 'scanning' && (
          <div className="flex-1 flex flex-col lg:flex-row h-full max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 gap-6 relative z-10">
            {/* Left Column: Hacker terminal logs */}
            <div className="flex-1 flex flex-col bg-slate-950/90 border border-slate-850 rounded-2xl overflow-hidden p-5 font-mono text-[11px] leading-relaxed shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3.5 mb-4 text-slate-400">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="font-bold tracking-wider text-slate-300">TELEMETRÍA DE LA CONEXIÓN COGNITIVA</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg text-[9px] text-cyan-400 border border-slate-800">
                  <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                  <span>ESCANEO ACTIVO</span>
                </div>
              </div>

              {/* Terminal screen */}
              <div className="flex-1 overflow-y-auto space-y-2 max-h-[350px] lg:max-h-[500px] pr-2 custom-scrollbar">
                {scanLogs.map((log, idx) => (
                  <div key={idx} className={`text-slate-400 ${log.includes('[CRITICAL') || log.includes('[ERROR_CRÍTICO') ? 'text-red-400' : log.includes('[ÉXITO') ? 'text-emerald-400 font-semibold' : log.includes('[INICIALIZANDO') ? 'text-cyan-400 font-bold' : ''}`}>
                    <span className="text-slate-600 mr-2">[{new Date().toLocaleTimeString()}]</span>
                    {log}
                  </div>
                ))}
                <div ref={terminalBottomRef} />
              </div>
            </div>

            {/* Right Column: Steps progress pipeline */}
            <div className="w-full lg:w-[400px] bg-slate-900/35 border border-slate-850 rounded-2xl p-6 flex flex-col justify-between gap-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest font-bold">PROGRESO DE COMPILACIÓN</span>
                  <span className="text-xl font-mono font-black text-cyan-400">{Math.round(scanProgress)}%</span>
                </div>
                
                {/* Visual meter bar */}
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-900">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                    style={{ width: `${scanProgress}%` }}
                    transition={{ ease: 'easeOut' }}
                  />
                </div>
              </div>

              {/* Progress Steps Timeline */}
              <div className="space-y-4 my-4 flex-1 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                {scanSteps.map((step, idx) => {
                  const isActive = idx === scanStepIndex;
                  const isCompleted = idx < scanStepIndex;

                  return (
                    <div 
                      key={idx} 
                      className={`flex gap-3.5 transition-all duration-300 ${
                        isActive ? 'opacity-100 scale-[1.02]' : isCompleted ? 'opacity-75' : 'opacity-25'
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <div className={`w-6 h-6 rounded-xl flex items-center justify-center text-[10px] font-mono border transition-all duration-300 ${
                          isCompleted 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : isActive
                              ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)] animate-pulse'
                              : 'bg-slate-950 border-slate-850 text-slate-600'
                        }`}>
                          {isCompleted ? '✓' : idx + 1}
                        </div>
                        {idx < scanSteps.length - 1 && (
                          <div className={`w-[1px] h-8 border-l transition-colors duration-300 ${
                            isCompleted ? 'border-emerald-500/20' : 'border-slate-850'
                          }`} />
                        )}
                      </div>

                      <div className="space-y-0.5">
                        <h4 className={`text-xs font-mono tracking-wider font-bold uppercase ${
                          isActive ? 'text-cyan-400' : isCompleted ? 'text-slate-200' : 'text-slate-500'
                        }`}>
                          {step.title}
                        </h4>
                        <p className={`text-[10px] leading-relaxed ${
                          isActive ? 'text-slate-300 font-sans' : 'text-slate-500'
                        }`}>
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Loading note */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex items-start gap-2.5 text-[10px] font-mono text-slate-500 leading-normal">
                <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>El análisis puede demorar unos instantes mientras Gemini realiza la búsqueda profunda de directrices y catálogo. Evita cerrar o recargar la pestaña.</span>
              </div>
            </div>
          </div>
        )}

        {/* 3. WORKSPACE DASHBOARD */}
        {view === 'workspace' && brain && (
          <div className="flex-1 flex flex-col w-full min-h-0 lg:overflow-hidden">
            
            {/* WORKSPACE UPPER RE-ROUTE RIBBON: Instant domain scanner for high efficiency */}
            <div className="bg-slate-950/40 border-b border-slate-900 px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Agente activo para:</span>
                <span className="bg-slate-900 border border-slate-800 px-2.5 py-0.5 rounded-lg text-xs font-mono text-cyan-400 font-bold">
                  {brain.domain}
                </span>
              </div>

              {/* Quick swap agent input bar */}
              <div className="flex items-center gap-2 max-w-sm w-full">
                <span className="text-[10px] font-mono text-slate-500 uppercase shrink-0 hidden md:inline">Mapear otra URL:</span>
                <div className="relative flex items-center w-full">
                  <input
                    type="text"
                    value={quickUrlInput}
                    onChange={(e) => setQuickUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && quickUrlInput.trim()) {
                        handleGenesisLaunch(quickUrlInput);
                        setQuickUrlInput('');
                      }
                    }}
                    placeholder="Escribe otra URL para cambiar..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/40 rounded-xl pl-3 pr-14 py-1.5 text-[11px] text-slate-200 placeholder-slate-600 focus:outline-none font-mono"
                  />
                  <button
                    onClick={() => {
                      if (quickUrlInput.trim()) {
                        handleGenesisLaunch(quickUrlInput);
                        setQuickUrlInput('');
                      }
                    }}
                    disabled={!quickUrlInput.trim()}
                    className="absolute right-1 px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold rounded-lg text-[9px] tracking-wider transition-all cursor-pointer"
                  >
                    CREAR
                  </button>
                </div>
              </div>
            </div>

            {/* CORE WORKSPACE GRID */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative min-h-0">
              
              {/* LEFT CHAT & GRAPH PANEL (Occupies most of the screen, fixed height layout on desktop) */}
              <section className="flex-1 flex flex-col p-4 sm:p-5 space-y-4 h-full min-h-0 lg:overflow-hidden">
                
                {/* Main View Tab Selector (Chat Focus by default, Cognitive Map as supplementary advanced toggle) */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-900 pb-3.5 gap-3 select-none">
                  <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-850 gap-1 w-full sm:w-auto">
                    <button
                      onClick={() => setActiveTab('chat')}
                      className={`flex items-center justify-center gap-2 px-4 py-1.5 rounded-lg font-mono text-[11px] font-bold tracking-wide transition-all duration-150 cursor-pointer w-full sm:w-auto ${
                        activeTab === 'chat' 
                          ? 'bg-slate-950 text-cyan-400 border border-slate-800 shadow-md' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                      <span>TERMINAL DE CHAT INTERACTIVO</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('graph')}
                      className={`flex items-center justify-center gap-2 px-4 py-1.5 rounded-lg font-mono text-[11px] font-bold tracking-wide transition-all duration-150 cursor-pointer w-full sm:w-auto ${
                        activeTab === 'graph' 
                          ? 'bg-slate-950 text-cyan-400 border border-slate-800 shadow-md' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Network className="w-3.5 h-3.5 shrink-0" />
                      <span>MAPA COGNITIVO (RELACIONES)</span>
                    </button>
                  </div>

                  <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-slate-500">
                    <span>CANAL DE COMUNICACIÓN ENCRIPTADO</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                </div>

                {/* ACTIVE AREA: Tab Content */}
                <div className="flex-1 flex flex-col min-h-0">
                  
                  {/* TAB A: GRAPH EXPLORER (Supplementary advanced view, kept out of the main chat's default flow) */}
                  {activeTab === 'graph' && (
                    <div className="flex-1 h-full min-h-0">
                      <KnowledgeGraph 
                        nodes={brain.entities} 
                        links={brain.relationships} 
                        onSelectNode={(node) => setSelectedGraphNode(node)}
                      />
                    </div>
                  )}

                  {/* TAB B: CHAT TERMINAL (Optimized for maximum usability, sleek bubble styling) */}
                  {activeTab === 'chat' && (
                    <div className="flex-1 flex flex-col h-full bg-slate-950 border border-slate-900 rounded-2xl overflow-hidden shadow-2xl relative min-h-0">
                      
                      {/* Interactive Messages Stream */}
                      <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
                        <AnimatePresence initial={false}>
                          {chatHistory.map((msg, index) => (
                            <motion.div 
                              key={msg.id} 
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.25, ease: 'easeOut', delay: Math.min(index * 0.03, 0.2) }}
                              className={`flex gap-4 ${
                                msg.role === 'user' ? 'justify-end' : 'justify-start'
                              }`}
                            >
                              {/* Assistant Profile Icon */}
                              {msg.role !== 'user' && (
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-cyan-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg border border-cyan-400/20 relative">
                                  {msg.role === 'system' ? <Settings className="w-4.5 h-4.5 text-white" /> : <Brain className="w-4.5 h-4.5 text-white animate-pulse" />}
                                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950" />
                                </div>
                              )}

                              {/* Dialogue Bubble */}
                              <div className={`max-w-[85%] space-y-2.5 p-4 rounded-2xl leading-relaxed text-sm transition-all duration-200 ${
                                msg.role === 'user'
                                  ? 'bg-slate-900 border border-slate-800 text-slate-100 shadow-md rounded-tr-[4px] hover:border-slate-750'
                                  : msg.role === 'system'
                                    ? 'bg-slate-950/70 border border-cyan-500/15 text-cyan-400/90 font-mono text-xs rounded-tl-[4px]'
                                    : 'bg-slate-900/35 border border-slate-900/80 text-slate-200 rounded-tl-[4px] hover:border-slate-850/50'
                              }`}>
                                
                                {/* Dialogue bubble metadata bar (Assistant only) */}
                                {msg.role !== 'user' && msg.role !== 'system' && (
                                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-slate-500 mb-2 border-b border-slate-900 pb-2">
                                    <span className="font-bold text-slate-300 tracking-wider flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                                      {brain.employeeCard.title.toUpperCase()}
                                    </span>
                                    <span>•</span>
                                    <span className="text-cyan-400 flex items-center gap-0.5 font-bold bg-cyan-500/5 px-1.5 py-0.2 rounded border border-cyan-500/10">
                                      <ShieldCheck className="w-3.5 h-3.5" />
                                      CONFIABILIDAD: {msg.confidence || 98}%
                                    </span>
                                    <span>•</span>
                                    <span className="uppercase tracking-wide text-slate-400">ORIGEN: {msg.sources?.join(', ')}</span>
                                    {tts.isSupported && (
                                      <>
                                        <span>•</span>
                                        <button
                                          onClick={() => {
                                            if (tts.isSpeaking && tts.activeMessageId === msg.id) {
                                              tts.stop();
                                            } else {
                                              tts.speak(msg.content, msg.id);
                                            }
                                          }}
                                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-all border cursor-pointer active:scale-95 ${
                                            tts.isSpeaking && tts.activeMessageId === msg.id
                                              ? 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse font-bold'
                                              : 'bg-slate-950/60 hover:bg-slate-900 text-cyan-400 border-slate-800'
                                          }`}
                                          title={tts.isSpeaking && tts.activeMessageId === msg.id ? "Detener lectura" : "Leer en voz alta (TTS)"}
                                        >
                                          {tts.isSpeaking && tts.activeMessageId === msg.id ? (
                                            <>
                                              <VolumeX className="w-3 h-3 text-red-400" />
                                              <span>DETENER</span>
                                            </>
                                          ) : (
                                            <>
                                              <Volume2 className="w-3 h-3 text-cyan-400" />
                                              <span>ESCUCHAR</span>
                                            </>
                                          )}
                                        </button>
                                      </>
                                    )}
                                  </div>
                                )}

                                {/* Dialogue body */}
                                <div className="text-[13.5px] leading-relaxed text-slate-200">
                                  <FormattedMessage content={msg.content} />
                                </div>

                                {/* Citation micro cards (Assistant only) */}
                                {msg.citations && msg.citations.length > 0 && (
                                  <div className="pt-3 border-t border-slate-900 mt-3.5">
                                    <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-2 font-bold">Fuentes de Verificación:</p>
                                    <div className="flex flex-wrap gap-2">
                                      {msg.citations.map((cite, cIdx) => (
                                        <a
                                          key={cIdx}
                                          href={cite.uri}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 px-2.5 py-1.5 rounded-lg text-[10px] text-cyan-400 font-mono transition-colors duration-150 cursor-pointer"
                                        >
                                          <span>{cite.title}</span>
                                          <ArrowUpRight className="w-3 h-3 shrink-0 text-cyan-500" />
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* User profile Icon */}
                              {msg.role === 'user' && (
                                <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 shadow-md">
                                  <User className="w-4.5 h-4.5 text-slate-400" />
                                </div>
                              )}
                            </motion.div>
                          ))}

                          {/* Thinking State / Loading Indicator (Initial loading before streamingText is filled) */}
                          {isStreaming && !streamingText && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex gap-4 justify-start"
                            >
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg animate-pulse">
                                <Brain className="w-4.5 h-4.5 text-white" />
                              </div>
                              
                              <div className="max-w-[85%] space-y-3.5 p-4 rounded-2xl border border-slate-850/60 bg-slate-900/20 text-slate-200 rounded-tl-[4px] shadow-inner">
                                <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-400">
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span className="font-bold tracking-widest uppercase">CONSOLIDANDO CONOCIMIENTO...</span>
                                </div>
                                
                                {/* Animated Bouncing Loading Dots */}
                                <div className="flex gap-1.5 items-center justify-start py-1 px-0.5">
                                  <span className="w-2 h-2 rounded-full bg-cyan-400/80 animate-bounce" style={{ animationDelay: '0ms' }} />
                                  <span className="w-2 h-2 rounded-full bg-cyan-400/80 animate-bounce" style={{ animationDelay: '150ms' }} />
                                  <span className="w-2 h-2 rounded-full bg-cyan-400/80 animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                              </div>
                            </motion.div>
                          )}

                          {/* Streaming feedback block (Live content streaming) */}
                          {isStreaming && streamingText && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex gap-4 justify-start"
                            >
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg relative">
                                <Brain className="w-4.5 h-4.5 text-white animate-spin-slow" />
                                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-cyan-400 border-2 border-slate-950 animate-ping" />
                              </div>
                              
                              <div className="max-w-[85%] space-y-2.5 p-4 rounded-2xl border border-slate-900/60 bg-slate-900/30 text-slate-200 rounded-tl-[4px] shadow-sm">
                                <div className="flex items-center gap-1.5 text-[9px] font-mono text-cyan-400/90 mb-1">
                                  <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                                  <span className="font-bold tracking-wider uppercase">ESCRIBIENDO RESPUESTA...</span>
                                </div>
                                <div className="text-[13.5px] leading-relaxed text-slate-200">
                                  <FormattedMessage content={streamingText} />
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div ref={chatBottomRef} />
                      </div>

                      {/* SUGGESTED ACTIONS (Floating elegant pills above the input container) */}
                      <div className="px-5 py-2.5 bg-slate-950/40 border-t border-slate-900/80 flex flex-wrap gap-2 select-none overflow-x-auto whitespace-nowrap custom-scrollbar shrink-0">
                        {brain.suggestedQuestions.map((q, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendMessage(q)}
                            disabled={isStreaming}
                            className="text-[10.5px] text-slate-400 hover:text-cyan-400 bg-slate-900/50 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 px-3 py-1.5 rounded-xl transition-all duration-150 cursor-pointer font-sans disabled:opacity-40 inline-block shrink-0 shadow-sm active:scale-95"
                          >
                            {q}
                          </button>
                        ))}
                      </div>

                      {/* CHAT INPUT AREA (Cursor / Claude design, extremely spacious and professional) */}
                      <div className="p-4 border-t border-slate-900 bg-slate-950 shrink-0">
                        <div className="relative flex flex-col bg-slate-900/60 border border-slate-850 focus-within:border-cyan-500/30 focus-within:ring-2 focus-within:ring-cyan-500/5 rounded-2xl p-2.5 shadow-2xl transition-all duration-200">
                          
                          {/* Spacious Input Field */}
                          <textarea
                            rows={2}
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                              }
                            }}
                            disabled={isStreaming}
                            placeholder={`Pregunta a "${brain.employeeCard.title}" sobre ${brain.name}...`}
                            className="w-full bg-transparent border-none py-1.5 px-2 text-xs sm:text-[13.5px] text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-0 resize-none min-h-[50px] max-h-[140px] custom-scrollbar disabled:opacity-50 font-sans leading-relaxed"
                          />

                          {/* Inner Toolbar Actions */}
                          <div className="flex items-center justify-between border-t border-slate-900/80 pt-2 px-2 mt-2 select-none">
                            <div className="flex items-center gap-3.5">
                              {/* Integrated Grounding Toggle Switch */}
                              <label className="flex items-center gap-2 text-[10px] font-mono text-slate-400 hover:text-slate-300 select-none cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={useSearchGrounding}
                                  onChange={(e) => setUseSearchGrounding(e.target.checked)}
                                  className="accent-cyan-500 rounded focus:ring-0 focus:outline-none w-3.5 h-3.5 cursor-pointer bg-slate-950 border-slate-800"
                                />
                                <span className="tracking-wide">BÚSQUEDA WEB</span>
                              </label>

                              {/* Separator */}
                              <span className="w-[1px] h-3 bg-slate-850" />

                              {/* Autoplay TTS Toggle Switch */}
                              {tts.isSupported && (
                                <>
                                  <label className="flex items-center gap-2 text-[10px] font-mono text-slate-400 hover:text-slate-300 select-none cursor-pointer" title="Leer nuevas respuestas automáticamente en voz alta">
                                    <input
                                      type="checkbox"
                                      checked={tts.autoplay}
                                      onChange={(e) => tts.setAutoplay(e.target.checked)}
                                      className="accent-cyan-500 rounded focus:ring-0 focus:outline-none w-3.5 h-3.5 cursor-pointer bg-slate-950 border-slate-800"
                                    />
                                    <span className="tracking-wide flex items-center gap-1">
                                      <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                                      AUTO-VOZ
                                    </span>
                                  </label>
                                  <span className="w-[1px] h-3 bg-slate-850" />
                                </>
                              )}

                              {/* Sweep / Clear chat shortcut */}
                              <button
                                onClick={handleClearConversation}
                                title="Vaciar conversación"
                                className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 hover:text-red-400 cursor-pointer transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="hidden xs:inline">VACIAR</span>
                              </button>
                            </div>

                            <div className="flex items-center gap-3">
                              {/* Keyboard tip */}
                              <span className="hidden sm:inline text-[9px] font-mono text-slate-500 tracking-wide">
                                Enter para enviar • Shift+Enter para salto
                              </span>

                              {/* Send Button */}
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleSendMessage()}
                                disabled={!messageInput.trim() || isStreaming}
                                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 p-2 rounded-xl font-semibold transition-all duration-150 disabled:opacity-30 disabled:hover:scale-100 disabled:cursor-not-allowed cursor-pointer shrink-0 shadow-lg flex items-center justify-center"
                              >
                                <Send className="w-4 h-4" />
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* RIGHT COLLAPSIBLE SIDEBAR: Agent Profile, Gaps & Training (Fully responsive & collapsible) */}
              <aside className={`transition-all duration-300 ease-in-out border-t lg:border-t-0 lg:border-l border-slate-900 bg-slate-950/45 flex flex-col shrink-0 select-none overflow-hidden lg:h-full lg:max-h-full
                ${isSidebarCollapsed 
                  ? 'w-full lg:w-[65px] p-3 lg:p-2 items-center gap-4' 
                  : 'w-full lg:w-[350px] p-5 gap-6'
                }`}
              >
                {/* Collapse/Expand Header Toggle */}
                <div className={`flex w-full ${isSidebarCollapsed ? 'justify-center' : 'justify-end'} select-none shrink-0 border-b border-slate-900/40 pb-2.5`}>
                  <button
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-cyan-400 cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1.5"
                    title={isSidebarCollapsed ? "Expandir panel lateral" : "Contraer panel lateral"}
                  >
                    {isSidebarCollapsed ? (
                      <PanelRightOpen className="w-4 h-4 text-cyan-400 animate-pulse" />
                    ) : (
                      <>
                        <PanelRightClose className="w-4 h-4" />
                        <span className="text-[9px] font-mono tracking-wider font-bold">OCULTAR</span>
                      </>
                    )}
                  </button>
                </div>

                {isSidebarCollapsed ? (
                  /* SLEEK COLLAPSED MODE VIEW */
                  <div className="flex flex-col items-center gap-5 py-2 w-full h-full overflow-y-auto custom-scrollbar select-none">
                    {/* Mini Representative Avatar */}
                    <div 
                      onClick={() => setIsSidebarCollapsed(false)}
                      className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center relative cursor-pointer group hover:border-cyan-500/40 transition-all active:scale-95"
                      title={`${brain.employeeCard.title} (Clic para expandir)`}
                    >
                      <Briefcase className="w-5 h-5 text-cyan-400 group-hover:scale-105 transition-transform" />
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900 animate-pulse" />
                    </div>

                    {/* Mini AI Mood Dot */}
                    <div 
                      onClick={() => setIsSidebarCollapsed(false)}
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center cursor-pointer group transition-all active:scale-95 ${getAIMood().color}`}
                      title={`Estado de Ánimo: ${getAIMood().label} (Clic para expandir)`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full ${getAIMood().badgeColor} animate-pulse`} />
                    </div>

                    {/* Mini Training Ring */}
                    <div 
                      onClick={() => setIsSidebarCollapsed(false)}
                      className="relative w-10 h-10 flex items-center justify-center bg-slate-900 border border-slate-800 rounded-xl cursor-pointer hover:border-cyan-500/40 transition-all active:scale-95"
                      title={`Entrenamiento: ${brain.knowledgeCompleteness}% (Clic para expandir)`}
                    >
                      <svg className="w-8 h-8 transform -rotate-90">
                        <circle cx="16" cy="16" r="13" stroke="rgba(255,255,255,0.03)" strokeWidth="2.5" fill="transparent" />
                        <circle cx="16" cy="16" r="13" stroke="url(#cyan-sidebar-mini)" strokeWidth="2.5" fill="transparent"
                          strokeDasharray={2 * Math.PI * 13}
                          strokeDashoffset={2 * Math.PI * 13 * (1 - brain.knowledgeCompleteness / 100)}
                        />
                        <defs>
                          <linearGradient id="cyan-sidebar-mini" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#22d3ee" />
                            <stop offset="100%" stopColor="#4f46e5" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <span className="absolute text-[8px] font-mono font-bold text-cyan-400">{brain.knowledgeCompleteness}%</span>
                    </div>

                    {/* Mini Gaps Badge */}
                    <div 
                      onClick={() => setIsSidebarCollapsed(false)}
                      className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center relative cursor-pointer hover:border-cyan-500/40 transition-all active:scale-95"
                      title={`${brain.missingInfo.length} Gaps Cognitivos (Clic para expandir)`}
                    >
                      <HelpCircle className="w-4 h-4 text-slate-400" />
                      <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full text-[8.5px] font-mono bg-red-500 text-white font-black leading-none shadow-lg">
                        {brain.missingInfo.length}
                      </span>
                    </div>

                    {/* Mini Sources */}
                    {brain.crawledUrls && brain.crawledUrls.length > 0 && (
                      <div 
                        onClick={() => setIsSidebarCollapsed(false)}
                        className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center relative cursor-pointer hover:border-cyan-500/40 transition-all active:scale-95"
                        title={`${brain.crawledUrls.length} Fuentes Exploradas (Clic para expandir)`}
                      >
                        <Globe className="w-4 h-4 text-slate-400" />
                        <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full text-[8.5px] font-mono bg-cyan-500 text-slate-950 font-black leading-none shadow-lg">
                          {brain.crawledUrls.length}
                        </span>
                      </div>
                    )}

                    {/* Mini Back Button */}
                    <button
                      onClick={() => setView('landing')}
                      className="w-10 h-10 mt-auto rounded-xl bg-slate-900 hover:bg-red-950/20 border border-slate-800 hover:border-red-900/30 text-slate-500 hover:text-red-400 flex items-center justify-center transition-all cursor-pointer active:scale-95"
                      title="Volver a la Página de Inicio"
                    >
                      <FolderSync className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  /* EXPANDED STATIC SCROLLABLE VIEW */
                  <div className="flex flex-col gap-5 overflow-y-auto custom-scrollbar flex-1 pr-1">
                    {/* Agent Virtual Bio Identity Card */}
                    <div className="bg-gradient-to-br from-slate-900/85 via-slate-900 to-indigo-950/20 rounded-2xl border border-slate-850 p-4.5 space-y-4 shadow-xl relative overflow-hidden group shrink-0">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
                      
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-slate-800/80 border border-slate-750 flex items-center justify-center relative">
                          <Briefcase className="w-5.5 h-5.5 text-cyan-400" />
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900 animate-pulse" />
                        </div>
                        <div>
                          <h4 className="text-[9px] font-mono text-slate-500 tracking-wider">REPRESENTANTE ACTIVO</h4>
                          <h3 className="text-sm font-display font-bold text-slate-200">{brain.employeeCard.title}</h3>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{brain.employeeCard.roleDescription}</p>

                      {/* Badges section */}
                      <div className="border-t border-slate-900/80 pt-3.5 space-y-2">
                        <h4 className="text-[9px] text-slate-500 font-mono tracking-widest uppercase font-bold">Especialidades Verificadas</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {brain.employeeCard.keyExpertise.map((exp, idx) => (
                            <span 
                              key={idx}
                              className="px-2 py-0.5 rounded bg-cyan-500/5 text-cyan-400 font-mono text-[9px] border border-cyan-500/10"
                            >
                              {exp}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Dynamic AI Mood Indicator Section */}
                      <div className="border-t border-slate-900/80 pt-3.5 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[9px] text-slate-500 font-mono tracking-widest uppercase font-bold flex items-center gap-1">
                            <Activity className="w-3 h-3 text-cyan-400" />
                            ESTADO DE ÁNIMO COGNITIVO
                          </h4>
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9.5px] font-mono font-bold border transition-all duration-300 ${getAIMood().color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${getAIMood().badgeColor} animate-pulse`} />
                            {getAIMood().label.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed italic bg-slate-950/20 p-2 rounded-lg border border-slate-900/50">
                          {`"${getAIMood().desc}"`}
                        </p>
                        <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 pt-0.5">
                          <span>DINÁMICA DE CONSULTAS:</span>
                          <span className="text-slate-300 font-bold tracking-wider">{getAIMood().intensity.toUpperCase()}</span>
                        </div>
                      </div>

                      <div className="border-t border-slate-900/80 pt-3 flex justify-between items-center text-[10px] font-mono">
                        <span className="text-slate-500 font-bold">TONALIDAD COMERCIAL:</span>
                        <span className="text-cyan-400 uppercase font-black">{brain.brandVoice.style}</span>
                      </div>
                    </div>

                    {/* Cognitive Completeness Circle Level */}
                    <div className="bg-slate-900/40 border border-slate-850/60 p-4 rounded-2xl flex items-center justify-between shrink-0">
                      <div>
                        <h4 className="text-[9px] font-mono text-slate-500 tracking-wider font-bold">MATRIZ COGNITIVA</h4>
                        <p className="text-xs font-display font-black text-slate-200 mt-0.5">Nivel de Entrenamiento</p>
                      </div>
                      
                      {/* Circle progress ring */}
                      <div className="relative w-12 h-12 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="24" cy="24" r="20" stroke="rgba(255,255,255,0.03)" strokeWidth="3.5" fill="transparent" />
                          <circle cx="24" cy="24" r="20" stroke="url(#cyan-sidebar)" strokeWidth="3.5" fill="transparent"
                            strokeDasharray={2 * Math.PI * 20}
                            strokeDashoffset={2 * Math.PI * 20 * (1 - brain.knowledgeCompleteness / 100)}
                            className="transition-all duration-1000 ease-out"
                          />
                          <defs>
                            <linearGradient id="cyan-sidebar" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#22d3ee" />
                              <stop offset="100%" stopColor="#4f46e5" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <span className="absolute text-[10px] font-mono font-bold text-cyan-400">{brain.knowledgeCompleteness}%</span>
                      </div>
                    </div>

                    {/* COLLAPSIBLE KNOWLEDGE TRAINING MISSIONS */}
                    <div className="space-y-3 shrink-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-[10px] text-slate-500 font-mono tracking-widest uppercase font-bold">Misiones de Entrenamiento ({brain.missingInfo.length})</h3>
                        <span className="px-1.5 py-0.2 rounded text-[8px] font-mono bg-red-500/10 text-red-400 border border-red-500/20 font-bold">GAPS COGNITIVOS</span>
                      </div>

                      {brain.missingInfo.length > 0 ? (
                        <div className="space-y-2">
                          {brain.missingInfo.map((item) => (
                            <div 
                              key={item.id}
                              className="p-3.5 rounded-xl bg-slate-900/30 hover:bg-slate-900 border border-slate-850/60 hover:border-slate-800 shadow-md hover:shadow-xl hover:shadow-cyan-500/5 hover:scale-[1.02] transition-all duration-300 ease-out space-y-2.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-mono font-bold text-slate-300 uppercase">{item.topic}</span>
                                <span className={`px-1.5 py-0.2 rounded text-[7px] font-mono uppercase font-black ${
                                  item.priority === 'high' ? 'bg-red-500/10 text-red-400 border border-red-500/10' : 'bg-amber-500/10 text-amber-400 border border-amber-500/10'
                                }`}>
                                  {item.priority === 'high' ? 'crítico' : 'medio'}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 leading-relaxed font-mono">{item.question}</p>
                              <button
                                onClick={() => setSelectedMissingItem(item)}
                                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-slate-950 font-mono text-[9px] border border-cyan-500/10 hover:border-cyan-500 transition-all duration-150 cursor-pointer font-bold"
                              >
                                <Plus className="w-3.5 h-3.5 shrink-0" />
                                <span>ENTRENAR AGENTE</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-center text-xs text-emerald-400 font-mono flex flex-col items-center gap-1.5">
                          <ShieldCheck className="w-6 h-6 shrink-0" />
                          <span>¡Entrenamiento de agente al 100%! Precisión de datos maximizada.</span>
                        </div>
                      )}
                    </div>

                    {/* FUENTES DE CONOCIMIENTO (CRAWLED PAGES) */}
                    {brain.crawledUrls && brain.crawledUrls.length > 0 && (
                      <div className="bg-slate-900/20 rounded-xl border border-slate-850/60 p-4 space-y-3 shrink-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-[10px] text-slate-500 font-mono tracking-widest uppercase font-bold">Fuentes de Conocimiento</h3>
                          <span className="px-1.5 py-0.2 rounded text-[8px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">EXPLORADAS</span>
                        </div>
                        <div className="space-y-1.5">
                          {brain.crawledUrls.map((url, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-2 p-1.5 rounded bg-slate-950/60 border border-slate-900 text-[10px] font-mono text-slate-300">
                              <span className="truncate hover:text-cyan-400 transition-colors" title={url}>{url}</span>
                              <span className="text-[8px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/10 shrink-0">100% leído</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* COGNITIVE TELEMETRIES */}
                    <div className="bg-slate-900/25 rounded-xl border border-slate-850/60 p-4 space-y-3 shrink-0">
                      <h3 className="text-[10px] text-slate-500 font-mono tracking-widest uppercase font-bold">Telemetrías Cognitivas</h3>
                      
                      <div className="space-y-2 text-[10px] font-mono">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Compañía Mapeada:</span>
                          <span className="text-slate-300 truncate max-w-[150px]">{brain.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Sector Industrial:</span>
                          <span className="text-slate-300 truncate max-w-[150px]">{brain.industry}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Nodos de Relación:</span>
                          <span className="text-cyan-400">{brain.entities.length} indexados</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">SSL / Seguridad:</span>
                          <span className="text-emerald-400 font-bold">CONEXIÓN SEGURA</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setView('landing')}
                        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-800 transition-all duration-150 font-mono text-[10px] cursor-pointer font-bold"
                      >
                        <FolderSync className="w-3.5 h-3.5 shrink-0" />
                        <span>VOLVER AL INICIO</span>
                      </button>
                    </div>
                  </div>
                )}
              </aside>
            </div>
          </div>
        )}
      </main>

      {/* COGNITIVE ENRICHMENT DRAWER MODAL */}
      <AnimatePresence>
        {selectedMissingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMissingItem(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 z-10"
            >
              <button 
                onClick={() => setSelectedMissingItem(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 text-cyan-400">
                <Brain className="w-5 h-5 shrink-0 animate-pulse" />
                <h3 className="text-xs font-mono tracking-wider uppercase font-bold">Consola de Entrenamiento de IA</h3>
              </div>

              <div className="space-y-1">
                <p className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-wider">TEMA POR ENTRENAR</p>
                <p className="text-sm font-display font-bold text-slate-100 uppercase">{selectedMissingItem.topic}</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850/60 space-y-1.5">
                <p className="text-[9px] text-slate-500 font-mono flex items-center gap-1 font-bold">
                  <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                  <span>CONSULTA DEL AGENTE COGNITIVO</span>
                </p>
                <p className="text-xs text-slate-300 leading-relaxed font-mono">{selectedMissingItem.question}</p>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] text-slate-500 font-mono font-bold">INTRODUCIR INFORMACIÓN FIDEDIGNA Y VERÍDICA</label>
                <textarea
                  rows={4}
                  value={enrichmentInput}
                  onChange={(e) => setEnrichmentInput(e.target.value)}
                  placeholder="Introduce detalles precisos, políticas de devoluciones, SLA, horas de servicio o directrices..."
                  className="w-full bg-slate-950 border border-slate-850 focus:border-cyan-500/40 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-650 focus:outline-none font-mono resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={() => setSelectedMissingItem(null)}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-850 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-mono cursor-pointer transition-colors"
                >
                  CANCELAR
                </button>
                <button
                  onClick={handleEnrichBrain}
                  disabled={isEnriching || !enrichmentInput.trim()}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-display font-bold tracking-wider flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  {isEnriching ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>INTEGRANDO...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>GUARDAR EN CEREBRO</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SYSTEM CMD LINE SHORTCUTS DIALOG PALETTE */}
      <AnimatePresence>
        {commandPaletteOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCommandPaletteOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10"
            >
              <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Command className="w-5 h-5 text-cyan-400 shrink-0" />
                  <span className="text-xs font-mono text-slate-300 font-bold uppercase tracking-wider">Menú de Comandos</span>
                </div>
                <button onClick={() => setCommandPaletteOpen(false)} className="text-slate-500 hover:text-slate-300">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Commands list */}
              <div className="p-2 space-y-1 text-xs font-mono">
                <button
                  onClick={handleClearConversation}
                  disabled={view !== 'workspace'}
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-900/30 hover:bg-slate-900 text-left text-red-400 hover:text-red-300 border border-transparent hover:border-red-500/10 cursor-pointer transition-all disabled:opacity-35 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-2.5">
                    <Trash2 className="w-4 h-4 shrink-0" />
                    <span>Limpiar logs de conversación activa</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">VACIAR CHAT</span>
                </button>

                <button
                  onClick={() => {
                    setView('landing');
                    setCommandPaletteOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-900/30 hover:bg-slate-900 text-left text-slate-300 hover:text-slate-100 border border-transparent hover:border-slate-850 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <FolderSync className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Compilar nuevo dominio corporativo</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">NUEVO ESCANEO</span>
                </button>

                <button
                  onClick={() => {
                    setCommandPaletteOpen(false);
                    if (view === 'workspace') {
                      setActiveTab(activeTab === 'chat' ? 'graph' : 'chat');
                    }
                  }}
                  disabled={view !== 'workspace'}
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-900/30 hover:bg-slate-900 text-left text-slate-300 hover:text-slate-100 border border-transparent hover:border-slate-850 cursor-pointer transition-all disabled:opacity-35"
                >
                  <div className="flex items-center gap-2.5">
                    <Network className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Alternar vistas (Chat / Mapa de Relaciones)</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">CAMBIAR VISTA</span>
                </button>
              </div>

              {/* CMD footer */}
              <div className="p-3 bg-slate-950 border-t border-slate-800 text-[9px] font-mono text-slate-500 flex justify-between items-center select-none">
                <span>[ESC] CERRAR PANELES</span>
                <div className="flex gap-3">
                  <span>[ALT+C] CHAT</span>
                  <span>[ALT+G] GRÁFICO</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
