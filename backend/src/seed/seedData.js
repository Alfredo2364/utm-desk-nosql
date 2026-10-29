require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Incidencia = require('../models/Incidencia');
const Usuario = require('../models/Usuario');
const Edificio = require('../models/Edificio');
const connectDB = require('../config/db');

const demoUsuarios = [
  {
    nombre: 'Ing. Lizandro Reyes',
    email: 'lizandro.reyes@utmetropolitana.edu.mx',
    correo: 'lizandro.reyes@utmetropolitana.edu.mx',
    passwordPlain: 'lizandro_2026',
    rol: 'superadmin',
    area: null,
    cargo: 'Super Administrador General — Control Total y Ejecución Global',
    departamento_carrera: 'Dirección General de TI y Nube',
    activo: true,
  },
  {
    nombre: 'Administrador Maestro UTM',
    email: 'admin.sistemas@utm.mx',
    correo: 'admin.sistemas@utm.mx',
    passwordPlain: 'utm123456',
    rol: 'admin',
    area: null,
    cargo: 'Administrador de Usuarios y Catálogos (Tabla 3)',
    departamento_carrera: 'Tecnologías de la Información',
    activo: true,
  },
  {
    nombre: 'Dra. Patricia Arango',
    email: 'directora.academica@utm.mx',
    correo: 'directora.academica@utm.mx',
    passwordPlain: 'utm123456',
    rol: 'directivo',
    area: null,
    cargo: 'Directivo de la UTM — Analítica y Reportes (Tabla 3)',
    departamento_carrera: 'Dirección Académica',
    activo: true,
  },
  {
    nombre: 'Ing. Carlos Mendoza',
    email: 'supervisor.campus@utm.mx',
    correo: 'supervisor.campus@utm.mx',
    passwordPlain: 'utm123456',
    rol: 'supervisor',
    area: null,
    cargo: 'Supervisor de Gestión y Seguimiento de Tickets (Tabla 3)',
    departamento_carrera: 'Coordinación de Operaciones',
    activo: true,
  },
  {
    nombre: 'Luis Hernández Pech (Téc. Cómputo)',
    email: 'tecnico.redes@utm.mx',
    correo: 'tecnico.redes@utm.mx',
    passwordPlain: 'utm123456',
    rol: 'tecnico',
    area: 'computo_telecomunicaciones',
    cargo: 'Especialista en Cómputo y Telecomunicaciones (Figura 5)',
    id_tecnico: 'TEC-UTM-092',
    departamento_carrera: 'Infraestructura Tecnológica',
    activo: true,
  },
  {
    nombre: 'Téc. Marco Peña (Téc. Infraestructura)',
    email: 'tecnico.infra@utm.mx',
    correo: 'tecnico.infra@utm.mx',
    passwordPlain: 'utm123456',
    rol: 'tecnico',
    area: 'infraestructura_mantenimiento',
    cargo: 'Técnico de Infraestructura y Mantenimiento Físico',
    id_tecnico: 'TEC-UTM-018',
    departamento_carrera: 'Mantenimiento General',
    activo: true,
  },
  {
    nombre: 'Ing. Daniela Soto (Téc. Sistemas)',
    email: 'tecnico.sistemas@utm.mx',
    correo: 'tecnico.sistemas@utm.mx',
    passwordPlain: 'utm123456',
    rol: 'tecnico',
    area: 'sistemas_servicios_academicos',
    cargo: 'Ingeniera de Sistemas y Servicios Académicos',
    id_tecnico: 'TEC-UTM-045',
    departamento_carrera: 'Servicios de Cómputo Académico',
    activo: true,
  },
  {
    nombre: 'Alumno Daniel García',
    email: 'alumno.garcia@utm.mx',
    correo: 'alumno.garcia@utm.mx',
    passwordPlain: 'utm123456',
    rol: 'reportante',
    area: null,
    cargo: 'Integrante de la Comunidad Universitaria — Reportante (Tabla 3)',
    departamento_carrera: 'Ingeniería en Tecnologías de la Información',
    activo: true,
  },
];

const demoEdificios = [
  {
    clave: 'ED-A',
    codigo: 'ED-A',
    nombre: 'Edificio A - Tecnologías de la Información',
    descripcion: 'Aulas de cómputo, laboratorios de redes, desarrollo de software y telecomunicaciones (Figura 6).',
    pisos: 3,
    responsable: 'Coordinación de Computación',
    aulas: [
      { codigo: 'A-101', nombre: 'Aula 101', tipo: 'aula', piso: 'Planta Baja', capacidad: 40 },
      { codigo: 'A-102', nombre: 'Laboratorio de cómputo', tipo: 'laboratorio', piso: 'Planta Baja', capacidad: 35 },
      { codigo: 'L-02', nombre: 'Laboratorio de Redes y Telecomunicaciones L-02', tipo: 'laboratorio', piso: 'Piso 2', capacidad: 30 },
    ],
  },
  {
    clave: 'ED-B',
    codigo: 'ED-B',
    nombre: 'Edificio B - Ciencias Básicas y Laboratorios',
    descripcion: 'Aulas de tronco común, física, matemáticas y laboratorios especializados (Figura 3).',
    pisos: 2,
    responsable: 'Coordinación de Ciencias Básicas',
    aulas: [
      { codigo: 'B-101', nombre: 'Aula Magna B-101', tipo: 'auditorio', piso: 'Planta Baja', capacidad: 120 },
      { codigo: 'B-204', nombre: 'Laboratorio B-204', tipo: 'laboratorio', piso: 'Piso 2', capacidad: 35 },
    ],
  },
  {
    clave: 'ED-C',
    codigo: 'ED-C',
    nombre: 'Edificio C - Servicios Académicos y Control Escolar',
    descripcion: 'Plataformas académicas, captura de actas, servicios escolares y dirección (Figura 4).',
    pisos: 2,
    responsable: 'Secretaría Académica',
    aulas: [
      { codigo: 'C-001', nombre: 'Sala de Captura Docente y Control Escolar C-001', tipo: 'aula', piso: 'Planta Baja', capacidad: 25 },
      { codigo: 'ESC-03', nombre: 'Ventanilla 3 de Control Escolar', tipo: 'oficina_administrativa', piso: 'Piso 1', capacidad: 15 },
    ],
  },
  {
    clave: 'ED-D',
    codigo: 'ED-D',
    nombre: 'Edificio D - Aulas Multimedia e Innovación',
    descripcion: 'Aulas inteligentes y talleres de innovación digital.',
    pisos: 2,
    responsable: 'Coordinación de Aulas Multimedia',
    aulas: [
      { codigo: 'D-204', nombre: 'Aula Inteligente D-204', tipo: 'aula', piso: 'Piso 2', capacidad: 40 },
      { codigo: 'D-205', nombre: 'Aula de Seminarios D-205', tipo: 'aula', piso: 'Piso 2', capacidad: 35 },
    ],
  },
];

const demoIncidencias = [
  {
    codigo: 'UTM-2026-0001',
    titulo: 'Falla intermitente en Switch de borde y pérdida de conexión en Laboratorio de Redes',
    descripcion: 'Durante la práctica de enrutamiento avanzado, los puestos 01 al 15 perdieron conectividad a la puerta de enlace predeterminada. Los LEDs del switch muestran saturación de broadcast.',
    categoria: 'computo_telecomunicaciones',
    estado: 'en_progreso',
    prioridad: 'alta',
    ubicacion: {
      edificio: 'Edificio A - Tecnologías de la Información',
      aula_laboratorio: 'Laboratorio de Redes y Telecomunicaciones L-02',
      piso: 'Piso 2',
      referencias: 'Rack principal de telecomunicaciones, costado norte del laboratorio.',
    },
    reportante: {
      nombre: 'Alumno Daniel García',
      email: 'alumno.garcia@utm.mx',
      rol: 'estudiante',
      departamento_carrera: 'Ingeniería en Computación',
    },
    tecnico_asignado: {
      nombre: 'Ing. Roberto Méndez',
      email: 'tecnico.redes@utm.mx',
      id_tecnico: 'TEC-UTM-092',
      area: 'computo_telecomunicaciones',
      fecha_asignacion: new Date(Date.now() - 20 * 3600 * 1000),
      asignado_por: 'Ing. Carlos Mendoza (SUPERVISOR)',
    },
    detalle: {
      tipo_dispositivo: 'Switch Administrable Capa 3',
      marca_modelo: 'Cisco Catalyst 2960-X (48 Puertos PoE)',
      numero_serie_activo: 'UTM-ACT-2023-8841',
      direccion_ip: '10.20.4.1',
      mac_address: '00:1A:2B:3C:4D:5E',
      sistema_operativo: 'Cisco IOS 15.2(4)E',
      software_afectado: 'VLAN 40 (Alumnos) y Wi-Fi Institucional',
      tipo_falla_red: 'intermitencia',
    },
    revisiones: [
      {
        fecha_revision: new Date(Date.now() - 24 * 3600 * 1000),
        tecnico: {
          nombre: 'Ing. Roberto Méndez',
          id_tecnico: 'TEC-UTM-092',
          departamento: 'Infraestructura de Redes',
        },
        diagnostico: 'Se detectó bucle de capa 2 en el panel de parcheo del rack secundario. Spanning-Tree bloqueó el puerto gi1/0/12 por prevención.',
        estado_anterior: 'abierta',
        estado_asignado: 'en_progreso',
        accion_realizada: 'Aislamiento de la boca de red en conflicto y reconfiguración de BPDU Guard.',
        observaciones: 'Se requiere recableado del patch cord que conecta al puesto 08.',
      },
    ],
    evidencias_adjuntas: [
      {
        nombre_archivo: 'captura_ping_gateway.png',
        nombre_original: 'captura_ping_gateway.png',
        tipo_mime: 'image/png',
        tamanio_bytes: 384500,
        supabase_path: 'incidencias/UTM-2026-0001/evidencia_switch_leds.png',
        url_firmada: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80',
        url_expira: new Date(Date.now() + 6 * 24 * 3600 * 1000),
        subido_por: 'Alumno Daniel García',
        fecha_subida: new Date(Date.now() - 24 * 3600 * 1000),
      },
    ],
  },
  {
    codigo: 'UTM-2026-0002',
    titulo: 'Fuga de agua en tubería de suministro y riesgo en falso plafón de Aula Magna',
    descripcion: 'Se observa gotera constante en el techo falso del Aula Magna B-101. El agua está cayendo cerca del cableado de iluminación y cañón proyector.',
    categoria: 'infraestructura_mantenimiento',
    estado: 'abierta',
    prioridad: 'critica',
    ubicacion: {
      edificio: 'Edificio B - Ciencias Básicas',
      aula_laboratorio: 'Aula Magna B-101',
      piso: 'Planta Baja',
      referencias: 'Justo sobre la hilera central de butacas, sector B.',
    },
    reportante: {
      nombre: 'Mtra. Sofía Valenzuela Cruz',
      email: 'svalenzuela@utm.mx',
      rol: 'docente',
      departamento_carrera: 'Tronco Común Universitario',
    },
    tecnico_asignado: {
      nombre: 'Téc. Marco Peña',
      email: 'tecnico.infra@utm.mx',
      id_tecnico: 'TEC-UTM-018',
      area: 'infraestructura_mantenimiento',
      fecha_asignacion: new Date(Date.now() - 2 * 3600 * 1000),
      asignado_por: 'Asignación Automática por Área',
    },
    detalle: {
      tipo_servicio: 'plomeria_fontaneria',
      tipo_dano: 'Fisura en codo de cobre de 3/4 pulgadas en línea presurizada',
      nivel_urgencia: 'emergencia_riesgo',
      requiere_corte_suministro: true,
      tipo_suministro_afectado: 'agua_potable',
      afecta_seguridad_personal: true,
    },
    revisiones: [],
    evidencias_adjuntas: [
      {
        nombre_archivo: 'dano_plafon_humedad.jpg',
        nombre_original: 'dano_plafon_humedad.jpg',
        tipo_mime: 'image/jpeg',
        tamanio_bytes: 840200,
        supabase_path: 'incidencias/UTM-2026-0002/dano_plafon.jpg',
        url_firmada: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
        url_expira: new Date(Date.now() + 6 * 24 * 3600 * 1000),
        subido_por: 'Mtra. Sofía Valenzuela Cruz',
        fecha_subida: new Date(Date.now() - 3 * 3600 * 1000),
      },
    ],
  },
  {
    codigo: 'UTM-2026-0003',
    titulo: 'Error HTTP 500 al procesar actas de evaluación final en plataforma SICE',
    descripcion: 'Al presionar el botón "Firmar y Emitir Acta Oficial", el sistema SICE arroja pantalla de error interno 500 y no genera el folio digital criptográfico.',
    categoria: 'sistemas_servicios_academicos',
    estado: 'pendiente_revision',
    prioridad: 'alta',
    ubicacion: {
      edificio: 'Edificio Central - Rectoría y Control Escolar',
      aula_laboratorio: 'Ventanilla 3 de Control Escolar',
      piso: 'Piso 1',
      referencias: 'Módulo de Titulación y Certificación.',
    },
    reportante: {
      nombre: 'Lic. Fernando Gutiérrez',
      email: 'fgutierrez@utm.mx',
      rol: 'administrativo',
      departamento_carrera: 'Departamento de Servicios Escolares',
    },
    tecnico_asignado: {
      nombre: 'Ing. Daniela Soto',
      email: 'tecnico.sistemas@utm.mx',
      id_tecnico: 'TEC-UTM-045',
      area: 'sistemas_servicios_academicos',
      fecha_asignacion: new Date(Date.now() - 6 * 3600 * 1000),
      asignado_por: 'Ing. Carlos Mendoza (SUPERVISOR)',
    },
    detalle: {
      plataforma: 'SICE',
      modulo_afectado: 'Módulo de Firma Electrónica y Cierre de Actas',
      matricula_estudiante_afectado: 'Global (Afecta a 124 alumnos del grupo 802-A)',
      url_modulo: 'https://sice.utm.mx/escolares/actas/firma-criptografica',
      codigo_error_http: '500 Internal Server Error - Lock wait timeout exceeded',
      navegador_utilizado: 'Google Chrome v122 (Windows 11 x64)',
    },
    revisiones: [
      {
        fecha_revision: new Date(Date.now() - 5 * 3600 * 1000),
        tecnico: {
          nombre: 'Ing. Daniela Soto',
          id_tecnico: 'TEC-UTM-045',
          departamento: 'Desarrollo de Software Institucional',
        },
        diagnostico: 'Bloqueo transaccional en la tabla de folios debido a concurrencia alta en el periodo de calificaciones ordinarias.',
        estado_anterior: 'abierta',
        estado_asignado: 'pendiente_revision',
        accion_realizada: 'Liberación de hilos colgados en la base de datos relacional del SICE y reinicio del microservicio de firmado.',
        observaciones: 'Monitoreo programado durante la siguiente ventana de carga a las 18:00 hrs.',
      },
    ],
    evidencias_adjuntas: [
      {
        nombre_archivo: 'reporte_error_sice_actas.pdf',
        nombre_original: 'reporte_error_sice_actas.pdf',
        tipo_mime: 'application/pdf',
        tamanio_bytes: 1450000,
        supabase_path: 'incidencias/UTM-2026-0003/reporte_error.pdf',
        url_firmada: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        url_expira: new Date(Date.now() + 6 * 24 * 3600 * 1000),
        subido_por: 'Lic. Fernando Gutiérrez',
        fecha_subida: new Date(Date.now() - 5 * 3600 * 1000),
      },
    ],
  },
  {
    codigo: 'UTM-2026-0004',
    titulo: 'Proyector HDMI sin señal y cable de audio dañado en Aula Inteligente',
    descripcion: 'El proyector láser del aula D-204 parpadea constantemente al intentar proyectar desde laptops con conector HDMI. Se requiere reemplazo de cable y revisión de puertos.',
    categoria: 'computo_telecomunicaciones',
    estado: 'resuelta',
    prioridad: 'media',
    ubicacion: {
      edificio: 'Edificio D - Aulas Generales',
      aula_laboratorio: 'Aula Inteligente D-204',
      piso: 'Piso 2',
      referencias: 'Escritorio docente multimedia.',
    },
    reportante: {
      nombre: 'Ing. Carlos Mendoza',
      email: 'cmendoza@utm.mx',
      rol: 'docente',
      departamento_carrera: 'Ingeniería en Mecatrónica',
    },
    tecnico_asignado: {
      nombre: 'Ing. Roberto Méndez',
      email: 'tecnico.redes@utm.mx',
      id_tecnico: 'TEC-UTM-092',
      area: 'computo_telecomunicaciones',
      fecha_asignacion: new Date(Date.now() - 48 * 3600 * 1000),
      asignado_por: 'Auto-asignación',
    },
    detalle: {
      tipo_dispositivo: 'Videoproyector Láser Multimedia',
      marca_modelo: 'Epson PowerLite L520U',
      numero_serie_activo: 'UTM-PROY-5512',
      direccion_ip: '10.20.12.85',
      mac_address: 'AC:7F:3E:99:11:22',
      sistema_operativo: 'Firmware Epson v2.10',
      software_afectado: 'Ninguno (Falla física)',
      tipo_falla_red: 'falla_hardware',
    },
    fecha_resolucion: new Date(Date.now() - 36 * 3600 * 1000), // Resuelto en 12 horas (MTTR)
    revisiones: [
      {
        fecha_revision: new Date(Date.now() - 48 * 3600 * 1000),
        tecnico: {
          nombre: 'Téc. Marco Peña',
          id_tecnico: 'TEC-UTM-018',
          departamento: 'Soporte a Aulas Multimedia',
        },
        diagnostico: 'Cable HDMI de 10m empotrado en canaleta presentó pines doblados en la punta del atril docente.',
        estado_anterior: 'abierta',
        estado_asignado: 'en_progreso',
        accion_realizada: 'Se procedió al cambio por cable HDMI 2.1 reforzado con terminal de acoplamiento seguro.',
        observaciones: 'Prueba de resolución 4K a 60Hz completada exitosamente.',
      },
      {
        fecha_revision: new Date(Date.now() - 36 * 3600 * 1000),
        tecnico: {
          nombre: 'Téc. Marco Peña',
          id_tecnico: 'TEC-UTM-018',
          departamento: 'Soporte a Aulas Multimedia',
        },
        diagnostico: 'Verificación final con el docente titular. Proyección y audio estéreo operando al 100%.',
        estado_anterior: 'en_progreso',
        estado_asignado: 'resuelta',
        accion_realizada: 'Cierre de ticket y entrega de conformidad.',
        observaciones: 'Incidencia cerrada sin pendientes.',
      },
    ],
    evidencias_adjuntas: [],
  },
  {
    codigo: 'UTM-2026-0005',
    titulo: 'Caída de Access Point y desconexión masiva en Laboratorio L-02',
    descripcion: 'Segunda falla registrada esta semana en el Laboratorio L-02. El punto de acceso Cisco Meraki reinicia continuamente por falta de potencia PoE.',
    categoria: 'computo_telecomunicaciones',
    estado: 'abierta',
    prioridad: 'critica',
    ubicacion: {
      edificio: 'Edificio A - Tecnologías de la Información',
      aula_laboratorio: 'Laboratorio de Redes y Telecomunicaciones L-02',
      piso: 'Piso 2',
      referencias: 'Techo del laboratorio, sector central.',
    },
    reportante: {
      nombre: 'Alumno Daniel García',
      email: 'alumno.garcia@utm.mx',
      rol: 'estudiante',
      departamento_carrera: 'Ingeniería en Computación',
    },
    tecnico_asignado: {
      nombre: 'Ing. Roberto Méndez',
      email: 'tecnico.redes@utm.mx',
      id_tecnico: 'TEC-UTM-092',
      area: 'computo_telecomunicaciones',
      fecha_asignacion: new Date(Date.now() - 1 * 3600 * 1000),
      asignado_por: 'Ing. Carlos Mendoza (SUPERVISOR)',
    },
    detalle: {
      tipo_dispositivo: 'Access Point Wi-Fi 6',
      marca_modelo: 'Cisco Catalyst 9115AX',
      numero_serie_activo: 'UTM-AP-2024-0019',
      direccion_ip: '10.20.4.15',
      mac_address: '00:26:08:9A:BC:DE',
      sistema_operativo: 'Cisco AP-COS',
      tipo_falla_red: 'intermitencia',
    },
    revisiones: [],
    evidencias_adjuntas: [],
  },
  {
    codigo: 'UTM-2026-0006',
    titulo: 'Cortocircuito y parpadeo de luminarias LED en Aula Magna B-101',
    descripcion: 'Se percibe olor a quemado y zumbido eléctrico en la caja de térmicos del Aula Magna. Reincidencia de problemas en el circuito de iluminación.',
    categoria: 'infraestructura_mantenimiento',
    estado: 'resuelta',
    prioridad: 'alta',
    ubicacion: {
      edificio: 'Edificio B - Ciencias Básicas',
      aula_laboratorio: 'Aula Magna B-101',
      piso: 'Planta Baja',
      referencias: 'Tablero eléctrico de control escénico.',
    },
    reportante: {
      nombre: 'Mtra. Sofía Valenzuela Cruz',
      email: 'svalenzuela@utm.mx',
      rol: 'docente',
      departamento_carrera: 'Tronco Común Universitario',
    },
    tecnico_asignado: {
      nombre: 'Téc. Marco Peña',
      email: 'tecnico.infra@utm.mx',
      id_tecnico: 'TEC-UTM-018',
      area: 'infraestructura_mantenimiento',
      fecha_asignacion: new Date(Date.now() - 72 * 3600 * 1000),
      asignado_por: 'Asignación Automática',
    },
    detalle: {
      tipo_servicio: 'electricidad',
      tipo_dano: 'Termomagnético de 30A sulfatado y falso contacto',
      nivel_urgencia: 'urgente',
      requiere_corte_suministro: true,
      tipo_suministro_afectado: 'energia_electrica',
      afecta_seguridad_personal: false,
    },
    fecha_resolucion: new Date(Date.now() - 50 * 3600 * 1000), // Resuelto en 22 horas (MTTR)
    revisiones: [
      {
        fecha_revision: new Date(Date.now() - 50 * 3600 * 1000),
        tecnico: {
          nombre: 'Téc. Marco Peña',
          id_tecnico: 'TEC-UTM-018',
          departamento: 'Mantenimiento General',
        },
        diagnostico: 'Reemplazo de pastilla termomagnética y reapriete de peines de alimentación.',
        estado_anterior: 'en_progreso',
        estado_asignado: 'resuelta',
        accion_realizada: 'Sustitución de breaker y pruebas de carga.',
        observaciones: 'Circuito normalizado.',
      },
    ],
    evidencias_adjuntas: [],
  },
  // === 3 EXPEDIENTES FORMALES DE LAS FIGURAS 2, 3 Y 4 DEL ERS CLOUD ===
  {
    codigo: 'INC-2026-0001',
    titulo: 'Switch de distribución sin respuesta',
    descripcion: 'Switch del rack principal sin respuesta; planta baja sin red.',
    categoria: 'computo_telecomunicaciones',
    prioridad: 'alta',
    estado: 'en_proceso',
    ubicacion: {
      edificioId: 'ED-A',
      aula: 'A-101',
      edificio: 'Edificio A - Tecnologías de la Información',
      aula_laboratorio: 'A-101',
    },
    reportante: {
      nombre: 'Alumno Daniel García',
      email: 'alumno.garcia@utm.mx',
      rol: 'reportante',
      departamento_carrera: 'Ingeniería en Tecnologías de la Información',
    },
    tecnico_asignado: {
      nombre: 'Luis Hernández Pech (Téc. Cómputo)',
      email: 'tecnico.redes@utm.mx',
      id_tecnico: 'TEC-UTM-092',
      area: 'computo_telecomunicaciones',
      fecha_asignacion: new Date('2026-10-15T14:30:00Z'),
      asignado_por: 'Ing. Carlos Mendoza (Supervisor)',
    },
    fechaReporte: new Date('2026-10-15T14:20:00Z'),
    fechaResolucion: null,
    tiempoResolucionMin: null,
    detalle: {
      ip: '10.10.1.2',
      direccion_ip: '10.10.1.2',
      vlan: 20,
      segmento_vlan: 'VLAN-20',
      puertoUplink: 'Gi1/0/48',
      equiposAfectados: 18,
      tipo_dispositivo: 'Switch de Distribución Capa 3',
      marca_modelo: 'Cisco Catalyst 2960-X',
    },
    revisiones: [
      {
        fecha: new Date('2026-10-15T14:45:00Z'),
        fecha_revision: new Date('2026-10-15T14:45:00Z'),
        tecnico: {
          nombre: 'Luis Hernández Pech (Téc. Cómputo)',
          id_tecnico: 'TEC-UTM-092',
          departamento: 'Cómputo y Telecomunicaciones',
        },
        comentario: 'Se revisa el enlace de subida del switch.',
        diagnostico: 'Se revisa el enlace de subida del switch.',
        estadoAnterior: 'asignada',
        estado_anterior: 'asignada',
        estadoNuevo: 'en_proceso',
        estado_asignado: 'en_proceso',
      },
    ],
    evidencias_adjuntas: [
      {
        nombre_archivo: 'switch_rack.jpg',
        nombre_original: 'switch_rack.jpg',
        tipo_mime: 'image/jpeg',
        peso_kb: 412,
        tamanio_bytes: 421888,
        tamanio_original_bytes: 1850000,
        ahorro_compresion: '77.2%',
        ruta_storage: 'INC-2026-0001/1792076400000_switch_rack.jpg',
        supabase_path: 'INC-2026-0001/1792076400000_switch_rack.jpg',
        url_storage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
        url_firmada: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
        url_expira: new Date(Date.now() + 6 * 24 * 3600 * 1000),
        subido_por: 'Luis Hernández Pech',
        fecha_carga: new Date('2026-10-15T15:00:00Z'),
        fecha_subida: new Date('2026-10-15T15:00:00Z'),
      },
    ],
  },
  {
    codigo: 'INC-2026-0012',
    titulo: 'Filtración de agua en el techo del laboratorio',
    descripcion: 'Goteo constante sobre las mesas de trabajo tras la lluvia.',
    categoria: 'infraestructura_mantenimiento',
    prioridad: 'media',
    estado: 'resuelta',
    ubicacion: {
      edificioId: 'ED-B',
      aula: 'B-204',
      edificio: 'Edificio B - Ciencias Básicas y Laboratorios',
      aula_laboratorio: 'B-204',
    },
    reportante: {
      nombre: 'Alumno Daniel García',
      email: 'alumno.garcia@utm.mx',
      rol: 'reportante',
      departamento_carrera: 'Ingeniería en Tecnologías de la Información',
    },
    tecnico_asignado: {
      nombre: 'Téc. Marco Peña (Téc. Infraestructura)',
      email: 'tecnico.infra@utm.mx',
      id_tecnico: 'TEC-UTM-018',
      area: 'infraestructura_mantenimiento',
      fecha_asignacion: new Date('2026-10-16T09:30:00Z'),
      asignado_por: 'Ing. Carlos Mendoza (Supervisor)',
    },
    fechaReporte: new Date('2026-10-16T09:10:00Z'),
    fechaResolucion: new Date('2026-10-16T17:40:00Z'),
    fecha_resolucion: new Date('2026-10-16T17:40:00Z'),
    tiempoResolucionMin: 510,
    detalle: {
      tipoDano: 'filtracion',
      tipo_servicio: 'filtracion',
      riesgoSeguridad: true,
      insumos: ['sellador asfáltico', 'impermeabilizante'],
      materiales_requeridos: ['sellador asfáltico', 'impermeabilizante'],
      contratistaExterno: false,
    },
    revisiones: [
      {
        fecha: new Date('2026-10-16T17:40:00Z'),
        fecha_revision: new Date('2026-10-16T17:40:00Z'),
        tecnico: {
          nombre: 'Téc. Marco Peña (Téc. Infraestructura)',
          id_tecnico: 'TEC-UTM-018',
          departamento: 'Infraestructura y Mantenimiento',
        },
        comentario: 'Se sella la zona afectada y se verifica sin goteo.',
        diagnostico: 'Se sella la zona afectada y se verifica sin goteo.',
        estadoAnterior: 'en_proceso',
        estado_anterior: 'en_proceso',
        estadoNuevo: 'resuelta',
        estado_asignado: 'resuelta',
      },
    ],
    evidencias_adjuntas: [
      {
        nombre_archivo: 'filtracion_techo.png',
        nombre_original: 'filtracion_techo.png',
        tipo_mime: 'image/png',
        peso_kb: 530,
        tamanio_bytes: 542720,
        tamanio_original_bytes: 2100000,
        ahorro_compresion: '74.2%',
        ruta_storage: 'INC-2026-0012/1792163000000_filtracion_techo.png',
        supabase_path: 'INC-2026-0012/1792163000000_filtracion_techo.png',
        url_storage: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
        url_firmada: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
        url_expira: new Date(Date.now() + 6 * 24 * 3600 * 1000),
        subido_por: 'Téc. Marco Peña',
        fecha_carga: new Date('2026-10-16T15:03:20Z'),
        fecha_subida: new Date('2026-10-16T15:03:20Z'),
      },
    ],
  },
  {
    codigo: 'INC-2026-0020',
    titulo: 'Error al capturar actas de calificaciones',
    descripcion: 'La plataforma marca error al guardar las calificaciones.',
    categoria: 'sistemas_servicios_academicos',
    prioridad: 'critica',
    estado: 'asignada',
    ubicacion: {
      edificioId: 'ED-C',
      aula: 'C-001',
      edificio: 'Edificio C - Servicios Académicos y Control Escolar',
      aula_laboratorio: 'C-001',
    },
    reportante: {
      nombre: 'Alumno Daniel García',
      email: 'alumno.garcia@utm.mx',
      rol: 'reportante',
      departamento_carrera: 'Ingeniería en Tecnologías de la Información',
    },
    tecnico_asignado: {
      nombre: 'Ing. Daniela Soto (Téc. Sistemas)',
      email: 'tecnico.sistemas@utm.mx',
      id_tecnico: 'TEC-UTM-045',
      area: 'sistemas_servicios_academicos',
      fecha_asignacion: new Date('2026-10-17T15:30:00Z'),
      asignado_por: 'Ing. Carlos Mendoza (Supervisor)',
    },
    fechaReporte: new Date('2026-10-17T15:00:00Z'),
    fechaResolucion: null,
    tiempoResolucionMin: null,
    detalle: {
      plataforma: 'Portal de calificaciones',
      codigoCurso: 'BDN-501',
      periodoEscolar: '2026-3',
      estudiantesAfectados: 35,
      usuarios_afectados: 35,
      modulo_afectado: 'BDN-501 (2026-3)',
    },
    revisiones: [
      {
        fecha: new Date('2026-10-17T15:30:00Z'),
        fecha_revision: new Date('2026-10-17T15:30:00Z'),
        tecnico: {
          nombre: 'Ing. Daniela Soto (Téc. Sistemas)',
          id_tecnico: 'TEC-UTM-045',
          departamento: 'Sistemas y Servicios Académicos',
        },
        comentario: 'Se asigna la incidencia al área de sistemas.',
        diagnostico: 'Se asigna la incidencia al área de sistemas.',
        estadoAnterior: 'abierta',
        estado_anterior: 'abierta',
        estadoNuevo: 'asignada',
        estado_asignado: 'asignada',
      },
    ],
    evidencias_adjuntas: [
      {
        nombre_archivo: 'error_actas.png',
        nombre_original: 'error_actas.png',
        tipo_mime: 'image/png',
        peso_kb: 286,
        tamanio_bytes: 292864,
        tamanio_original_bytes: 1120000,
        ahorro_compresion: '73.9%',
        ruta_storage: 'INC-2026-0020/1792249500000_error_actas.png',
        supabase_path: 'INC-2026-0020/1792249500000_error_actas.png',
        url_storage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
        url_firmada: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
        url_expira: new Date(Date.now() + 6 * 24 * 3600 * 1000),
        subido_por: 'Alumno Daniel García',
        fecha_carga: new Date('2026-10-17T15:05:00Z'),
        fecha_subida: new Date('2026-10-17T15:05:00Z'),
      },
    ],
  },
];

const seedDatabase = async () => {
  try {
    const isConnected = await connectDB();
    if (!isConnected) {
      console.log('⚠️ [Seed] No se pudo conectar a MongoDB Atlas. Saltando seed.');
      return false;
    }

    console.log('🧹 [Seed] Limpiando colecciones anteriores...');
    await Promise.all([
      Incidencia.deleteMany({}),
      Usuario.deleteMany({}),
      Edificio.deleteMany({}),
    ]);

    console.log('🌱 [Seed] Insertando usuarios RBAC + Super Admin con contraseñas encriptadas (bcrypt)...');
    const usuariosConHash = await Promise.all(
      demoUsuarios.map(async (u) => {
        const plain = u.passwordPlain || 'utm123456';
        const hashedPassword = await bcrypt.hash(plain, 10);
        const copy = { ...u, password: hashedPassword, creadoEn: new Date() };
        delete copy.passwordPlain;
        return copy;
      })
    );
    await Usuario.insertMany(usuariosConHash);

    console.log('🏢 [Seed] Insertando catálogo de edificios y aulas...');
    await Edificio.insertMany(demoEdificios);

    console.log('📋 [Seed] Insertando incidencias polimórficas con trazabilidad RBAC...');
    for (const incData of demoIncidencias) {
      const doc = new Incidencia(incData);
      await doc.save();
    }

    console.log('⚡ [Seed] Sincronizando los 4 índices de Tabla 8 en incidencias_campus...');
    await Incidencia.syncIndexes();

    console.log(`✅ [Seed] ¡Base de datos poblada exitosamente!`);
    console.log(`   • ${demoUsuarios.length} usuarios con roles RBAC (incluyendo Super Admin)`);
    console.log(`   • ${demoEdificios.length} edificios con aulas`);
    console.log(`   • ${demoIncidencias.length} incidencias para analítica`);
    return true;
  } catch (error) {
    console.error('❌ [Seed] Error al sembrar datos:', error.message);
    return false;
  }
};

// Si se ejecuta directamente vía línea de comandos: node src/seed/seedData.js
if (require.main === module) {
  seedDatabase().then(() => {
    mongoose.connection.close();
    process.exit(0);
  });
}

module.exports = {
  demoUsuarios,
  demoEdificios,
  demoIncidencias,
  seedDatabase,
};
