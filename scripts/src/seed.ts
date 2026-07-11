import { seedUsers } from "./seedUsers";
import {
  db,
  organizationsTable,
  opportunitiesTable,
  professionalsTable,
  applicationsTable,
  savedOpportunitiesTable,
} from "@workspace/db";

async function seed(): Promise<void> {
  const existing = await db.select().from(organizationsTable);
  if (existing.length > 0) {
    process.stdout.write("Database already seeded, skipping.\n");
    return;
  }

  const orgs = await db
    .insert(organizationsTable)
    .values([
      {
        name: "Universidad Nacional de Colombia",
        type: "universidad",
        country: "Colombia",
        city: "Bogotá",
        website: "https://unal.edu.co",
        description:
          "La universidad pública más importante de Colombia, con programas de pregrado y posgrado en todas las áreas del conocimiento.",
        contactEmail: "internacional@unal.edu.co",
        status: "verificada",
      },
      {
        name: "Tecnológico de Monterrey",
        type: "universidad",
        country: "México",
        city: "Monterrey",
        website: "https://tec.mx",
        description:
          "Institución privada líder en innovación educativa y emprendimiento en América Latina.",
        contactEmail: "vinculacion@tec.mx",
        status: "verificada",
      },
      {
        name: "Globant",
        type: "empresa",
        country: "Argentina",
        city: "Buenos Aires",
        website: "https://globant.com",
        description:
          "Compañía global de tecnología que crea productos digitales para marcas líderes en el mundo.",
        contactEmail: "talento@globant.com",
        status: "verificada",
      },
      {
        name: "Banco Interamericano de Desarrollo",
        type: "organismo_internacional",
        country: "Estados Unidos",
        city: "Washington D.C.",
        website: "https://iadb.org",
        description:
          "Principal fuente de financiamiento para el desarrollo de América Latina y el Caribe.",
        contactEmail: "becas@iadb.org",
        status: "verificada",
      },
      {
        name: "Ministerio de Ciencia y Tecnología del Perú",
        type: "gobierno",
        country: "Perú",
        city: "Lima",
        website: "https://gob.pe/concytec",
        description:
          "Entidad gubernamental que impulsa la ciencia, tecnología e innovación en el Perú.",
        contactEmail: "convocatorias@concytec.gob.pe",
        status: "verificada",
      },
      {
        name: "Fundación Chile Emprende",
        type: "fundacion",
        country: "Chile",
        city: "Santiago",
        website: "https://chileemprende.cl",
        description:
          "Fundación dedicada a impulsar el emprendimiento y la empleabilidad juvenil en Chile.",
        contactEmail: "contacto@chileemprende.cl",
        status: "pendiente",
      },
      {
        name: "TECHO Internacional",
        type: "ong",
        country: "Uruguay",
        city: "Montevideo",
        website: "https://techo.org",
        description:
          "ONG presente en 18 países de América Latina que trabaja por superar la pobreza en asentamientos.",
        contactEmail: "voluntariado@techo.org",
        status: "pendiente",
      },
      // --- Organizaciones de prueba para visualizar los estados de verificación ---
      {
        name: "Startup Andina (Prueba)",
        type: "empresa",
        country: "Bolivia",
        city: "La Paz",
        website: "https://startupandina.example",
        description:
          "Organización de prueba en estado PENDIENTE: recién registrada, a la espera de revisión por SEMBER.",
        contactEmail: "hola@startupandina.example",
        status: "pendiente",
      },
      {
        name: "Universidad del Pacífico (Prueba)",
        type: "universidad",
        country: "Ecuador",
        city: "Guayaquil",
        website: "https://upacifico.example",
        description:
          "Organización de prueba en estado VERIFICADA: aprobada por SEMBER y visible públicamente.",
        contactEmail: "vinculacion@upacifico.example",
        status: "verificada",
        verifiedAt: new Date("2026-05-20T14:00:00Z"),
      },
      {
        name: "Consultora Global Talent (Prueba)",
        type: "empresa",
        country: "España",
        city: "Madrid",
        website: "https://globaltalent.example",
        description:
          "Organización de prueba en estado VERIFICADA: empresa verificada que puede publicar oportunidades.",
        contactEmail: "rrhh@globaltalent.example",
        status: "verificada",
        verifiedAt: new Date("2026-06-01T09:30:00Z"),
      },
      {
        name: "ONG Manos Unidas (Prueba)",
        type: "ong",
        country: "Guatemala",
        city: "Ciudad de Guatemala",
        website: "https://manosunidas.example",
        description:
          "Organización de prueba en estado SUSPENDIDA: estuvo verificada pero SEMBER suspendió su actividad.",
        contactEmail: "contacto@manosunidas.example",
        status: "suspendida",
        verifiedAt: new Date("2026-04-10T11:00:00Z"),
      },
      {
        name: "Corporación Sin Registro (Prueba)",
        type: "empresa",
        country: "Paraguay",
        city: "Asunción",
        website: "https://sinregistro.example",
        description:
          "Organización de prueba en estado RECHAZADA: su solicitud de ingreso fue rechazada por SEMBER.",
        contactEmail: "info@sinregistro.example",
        status: "rechazada",
        verifiedAt: new Date("2026-05-05T16:45:00Z"),
      },
    ])
    .returning();

  const byName = (name: string) => {
    const org = orgs.find((o) => o.name === name);
    if (!org) throw new Error(`Org not found: ${name}`);
    return org.id;
  };

  const opps = await db
    .insert(opportunitiesTable)
    .values([
      {
        organizationId: byName("Globant"),
        title: "Internship en Desarrollo de Software",
        type: "internship",
        area: "Tecnología",
        country: "Argentina",
        city: "Buenos Aires",
        modality: "hibrido",
        paid: true,
        deadline: "2026-08-15",
        description:
          "Programa de pasantías de 6 meses para estudiantes de últimos semestres de ingeniería de sistemas o carreras afines. Trabajarás en proyectos reales con clientes internacionales, acompañado por mentores senior.",
        requirements:
          "Estudiante activo de ingeniería de sistemas, software o afines. Conocimientos en JavaScript o Python. Inglés intermedio (B1+).",
        competencies: ["JavaScript", "Python", "Git", "Trabajo en equipo", "Inglés B1"],
        benefits: "Remuneración mensual, obra social, cursos de idiomas, posibilidad de contratación.",
        requiredDocuments: ["CV actualizado", "Certificado de estudios", "Carta de motivación"],
        language: "Español",
        status: "activa",
        views: 148,
      },
      {
        organizationId: byName("Banco Interamericano de Desarrollo"),
        title: "Beca de Maestría en Políticas Públicas",
        type: "beca",
        area: "Políticas Públicas",
        country: "Estados Unidos",
        city: "Washington D.C.",
        modality: "presencial",
        paid: true,
        deadline: "2026-09-30",
        description:
          "Beca completa para cursar una maestría en políticas públicas en universidades aliadas de Estados Unidos. Incluye matrícula, manutención mensual, seguro médico y pasajes.",
        requirements:
          "Título universitario con promedio sobresaliente. Dos años de experiencia profesional. TOEFL 100+ o IELTS 7+.",
        competencies: ["Análisis de políticas", "Inglés avanzado", "Investigación"],
        benefits: "Matrícula completa, estipendio mensual, seguro médico, pasajes aéreos.",
        requiredDocuments: ["CV", "Título universitario", "Certificado TOEFL/IELTS", "Dos cartas de recomendación", "Ensayo de motivación"],
        language: "Inglés",
        status: "activa",
        views: 320,
      },
      {
        organizationId: byName("Universidad Nacional de Colombia"),
        title: "Movilidad Académica — Semestre de Intercambio",
        type: "movilidad",
        area: "Educación",
        country: "Colombia",
        city: "Bogotá",
        modality: "presencial",
        paid: false,
        deadline: "2026-07-30",
        description:
          "Convocatoria de intercambio académico para estudiantes internacionales que deseen cursar un semestre en la Universidad Nacional de Colombia. Acceso a todos los cursos de pregrado y actividades culturales.",
        requirements:
          "Estudiante activo de universidad convenio. Promedio mínimo de 4.0/5.0. Español B2 para no hispanohablantes.",
        competencies: ["Adaptabilidad", "Español B2"],
        benefits: "Exención de matrícula, acompañamiento institucional, acceso a bienestar universitario.",
        requiredDocuments: ["Carta de postulación", "Historial académico", "Carta aval de la universidad de origen"],
        language: "Español",
        status: "activa",
        views: 95,
      },
      {
        organizationId: byName("Tecnológico de Monterrey"),
        title: "Bootcamp de Inteligencia Artificial Aplicada",
        type: "bootcamp",
        area: "Tecnología",
        country: "México",
        city: "Monterrey",
        modality: "remoto",
        paid: false,
        deadline: "2026-08-01",
        description:
          "Bootcamp intensivo de 12 semanas en inteligencia artificial aplicada: machine learning, procesamiento de lenguaje natural y despliegue de modelos. Incluye proyecto final con empresas aliadas.",
        requirements: "Conocimientos básicos de programación en Python. Dedicación de 15 horas semanales.",
        competencies: ["Python", "Machine Learning", "Estadística"],
        benefits: "Certificado oficial del Tec de Monterrey, mentoría, bolsa de empleo.",
        requiredDocuments: ["CV", "Formulario de inscripción"],
        language: "Español",
        status: "activa",
        views: 210,
      },
      {
        organizationId: byName("Ministerio de Ciencia y Tecnología del Perú"),
        title: "Convocatoria Nacional de Jóvenes Investigadores",
        type: "convocatoria",
        area: "Investigación",
        country: "Perú",
        city: "Lima",
        modality: "hibrido",
        paid: true,
        deadline: "2026-10-15",
        description:
          "Financiamiento para proyectos de investigación liderados por jóvenes de hasta 30 años en áreas de ciencia, tecnología y salud. Hasta 50.000 soles por proyecto.",
        requirements: "Título universitario. Proyecto de investigación viable. Menor de 30 años.",
        competencies: ["Investigación", "Redacción científica", "Gestión de proyectos"],
        benefits: "Financiamiento de hasta 50.000 soles, mentoría científica, publicación de resultados.",
        requiredDocuments: ["Propuesta de investigación", "CV CTI Vitae", "Carta de respaldo institucional"],
        language: "Español",
        status: "activa",
        views: 76,
      },
      {
        organizationId: byName("Globant"),
        title: "Desarrollador Full Stack Semi Senior",
        type: "empleo",
        area: "Tecnología",
        country: "Colombia",
        city: "Medellín",
        modality: "remoto",
        paid: true,
        deadline: "2026-08-20",
        description:
          "Buscamos desarrollador full stack con experiencia en React y Node.js para integrarse a equipos distribuidos que construyen productos digitales para clientes globales.",
        requirements: "3+ años de experiencia con React y Node.js. Inglés B2+. Experiencia con bases de datos SQL.",
        competencies: ["React", "Node.js", "TypeScript", "SQL", "Inglés B2"],
        benefits: "Contrato indefinido, trabajo 100% remoto, plan de carrera, cobertura médica premium.",
        requiredDocuments: ["CV actualizado"],
        language: "Español",
        status: "activa",
        views: 264,
      },
      {
        organizationId: byName("Tecnológico de Monterrey"),
        title: "Cumbre Latinoamericana de Innovación Educativa",
        type: "evento",
        area: "Educación",
        country: "México",
        city: "Ciudad de México",
        modality: "presencial",
        paid: false,
        deadline: "2026-09-10",
        description:
          "Tres días de conferencias, talleres y networking con líderes de la educación superior de toda América Latina. Convocatoria abierta para ponencias de jóvenes investigadores.",
        requirements: "Abierto a estudiantes, docentes y profesionales del sector educativo.",
        competencies: ["Innovación educativa"],
        benefits: "Acceso a todas las conferencias, certificado de participación, espacios de networking.",
        requiredDocuments: ["Registro en línea"],
        language: "Español",
        status: "activa",
        views: 58,
      },
      {
        organizationId: byName("Universidad Nacional de Colombia"),
        title: "Asistente de Investigación en Biotecnología",
        type: "empleo",
        area: "Investigación",
        country: "Colombia",
        city: "Bogotá",
        modality: "presencial",
        paid: true,
        deadline: "2026-07-25",
        description:
          "Vinculación como asistente de investigación en el Instituto de Biotecnología. Apoyo a proyectos de mejoramiento genético de cultivos andinos.",
        requirements: "Profesional en biología, microbiología o afines. Experiencia en laboratorio.",
        competencies: ["Biología molecular", "Análisis de datos", "Trabajo de laboratorio"],
        benefits: "Contrato por 12 meses renovable, participación en publicaciones científicas.",
        requiredDocuments: ["CV", "Certificados académicos", "Carta de recomendación"],
        language: "Español",
        status: "cerrada",
        views: 132,
      },
      {
        organizationId: byName("Globant"),
        title: "Diseñador UX/UI Senior",
        type: "empleo",
        area: "Diseño",
        country: "España",
        city: "Madrid",
        modality: "remoto",
        paid: true,
        deadline: "2026-09-10",
        description:
          "Buscamos un diseñador UX/UI con experiencia liderando proyectos de producto digital para clientes globales. Trabajarás en un equipo multidisciplinario definiendo flujos, prototipos y sistemas de diseño.",
        requirements: "5+ años en diseño de producto. Dominio de Figma. Portafolio sólido. Inglés B2.",
        competencies: ["Figma", "Design Systems", "Prototipado", "Inglés B2"],
        benefits: "Salario competitivo, trabajo 100% remoto, presupuesto de formación.",
        requiredDocuments: ["CV", "Portafolio"],
        language: "Español",
        status: "activa",
        views: 210,
      },
      {
        organizationId: byName("Banco Interamericano de Desarrollo"),
        title: "Estágio em Análise de Dados",
        type: "internship",
        area: "Finanzas",
        country: "Brasil",
        city: "São Paulo",
        modality: "hibrido",
        paid: true,
        deadline: "2026-08-20",
        description:
          "Programa de estágio para estudantes de economia, estatística ou áreas afins interessados em análise de dados financeiros e visualização de indicadores regionais.",
        requirements: "Estudante de graduação. Conhecimento em SQL e Excel. Português nativo e inglês intermediário.",
        competencies: ["SQL", "Excel", "Power BI", "Inglês B1"],
        benefits: "Bolsa-auxílio, vale-transporte, mentoria.",
        requiredDocuments: ["Currículo", "Histórico escolar"],
        language: "Portugués",
        status: "activa",
        views: 132,
      },
      {
        organizationId: byName("Tecnológico de Monterrey"),
        title: "Bootcamp de Ciencia de Datos",
        type: "bootcamp",
        area: "Tecnología",
        country: "México",
        city: "Monterrey",
        modality: "remoto",
        paid: false,
        deadline: "2026-10-05",
        description:
          "Programa intensivo de 12 semanas en ciencia de datos: Python, estadística, machine learning y despliegue de modelos. Incluye proyecto final con datos reales.",
        requirements: "Conocimientos básicos de programación. Compromiso de 20h semanales.",
        competencies: ["Python", "Pandas", "Machine Learning", "Estadística"],
        benefits: "Certificado, bolsa de empleo, mentorías 1:1.",
        requiredDocuments: ["CV", "Carta de motivación"],
        language: "Español",
        status: "activa",
        views: 178,
      },
      {
        organizationId: byName("Universidad Nacional de Colombia"),
        title: "Beca de Investigación en Salud Pública",
        type: "beca",
        area: "Salud",
        country: "Colombia",
        city: "Medellín",
        modality: "presencial",
        paid: true,
        deadline: "2026-09-25",
        description:
          "Beca para participar en un proyecto de investigación en salud pública enfocado en epidemiología comunitaria. Incluye acompañamiento de investigadores senior.",
        requirements: "Profesional en salud, enfermería o afines. Interés en investigación.",
        competencies: ["Epidemiología", "Investigación", "Estadística"],
        benefits: "Estipendio mensual, publicación conjunta.",
        requiredDocuments: ["CV", "Título profesional", "Carta de recomendación"],
        language: "Español",
        status: "activa",
        views: 143,
      },
      {
        organizationId: byName("Ministerio de Ciencia y Tecnología del Perú"),
        title: "Convocatoria de Energías Renovables",
        type: "convocatoria",
        area: "Sostenibilidad",
        country: "Perú",
        city: "Lima",
        modality: "hibrido",
        paid: true,
        deadline: "2026-11-01",
        description:
          "Convocatoria para financiar proyectos de innovación en energías renovables lideradas por jóvenes profesionales y startups del sector energético.",
        requirements: "Equipo con propuesta técnica. Registro formal opcional.",
        competencies: ["Energías renovables", "Gestión de proyectos"],
        benefits: "Financiamiento, mentoría técnica, acceso a laboratorios.",
        requiredDocuments: ["Propuesta técnica", "Presupuesto"],
        language: "Español",
        status: "activa",
        views: 96,
      },
      {
        organizationId: byName("Consultora Global Talent (Prueba)"),
        title: "Internship in International Marketing",
        type: "internship",
        area: "Marketing",
        country: "Estados Unidos",
        city: "Miami",
        modality: "remoto",
        paid: true,
        deadline: "2026-08-30",
        description:
          "Join our marketing team to support campaigns across Latin American markets. You will work on content, analytics and social media strategy.",
        requirements: "Marketing or communications student. Fluent English and Spanish. Strong writing skills.",
        competencies: ["Marketing", "Social Media", "Analytics", "English C1"],
        benefits: "Paid internship, flexible hours, letter of recommendation.",
        requiredDocuments: ["Resume", "Cover letter"],
        language: "Inglés",
        status: "activa",
        views: 205,
      },
      {
        organizationId: byName("Universidad del Pacífico (Prueba)"),
        title: "Programa de Movilidad Docente",
        type: "movilidad",
        area: "Educación",
        country: "Chile",
        city: "Santiago",
        modality: "presencial",
        paid: false,
        deadline: "2026-10-15",
        description:
          "Programa de intercambio para docentes universitarios que deseen realizar una estancia académica de un semestre compartiendo experiencias pedagógicas.",
        requirements: "Docente universitario activo. Carta aval de la institución de origen.",
        competencies: ["Docencia", "Adaptabilidad"],
        benefits: "Alojamiento, acompañamiento académico.",
        requiredDocuments: ["CV", "Carta aval"],
        language: "Español",
        status: "activa",
        views: 74,
      },
      {
        organizationId: byName("Globant"),
        title: "Evento: Semana de la Innovación Tech",
        type: "evento",
        area: "Tecnología",
        country: "Uruguay",
        city: "Montevideo",
        modality: "presencial",
        paid: false,
        deadline: "2026-09-05",
        description:
          "Encuentro de tres días con charlas, talleres y networking sobre las últimas tendencias en desarrollo de software, IA y producto digital.",
        requirements: "Abierto a estudiantes y profesionales del sector tecnológico.",
        competencies: ["Networking"],
        benefits: "Acceso a talleres, certificado de participación.",
        requiredDocuments: ["Registro en línea"],
        language: "Español",
        status: "activa",
        views: 260,
      },
      {
        organizationId: byName("Banco Interamericano de Desarrollo"),
        title: "Analista de Finanzas Corporativas",
        type: "empleo",
        area: "Finanzas",
        country: "Argentina",
        city: "Córdoba",
        modality: "hibrido",
        paid: true,
        deadline: "2026-09-18",
        description:
          "Responsable del análisis financiero, elaboración de reportes y apoyo en la toma de decisiones de inversión de la organización a nivel regional.",
        requirements: "Título en finanzas, economía o contabilidad. 3+ años de experiencia. Excel avanzado.",
        competencies: ["Análisis financiero", "Excel", "Modelado financiero"],
        benefits: "Salario competitivo, bono anual, obra social premium.",
        requiredDocuments: ["CV", "Título profesional"],
        language: "Español",
        status: "activa",
        views: 119,
      },
      {
        organizationId: byName("Tecnológico de Monterrey"),
        title: "Beca de Derecho Internacional",
        type: "beca",
        area: "Derecho",
        country: "México",
        city: "Ciudad de México",
        modality: "presencial",
        paid: true,
        deadline: "2026-10-20",
        description:
          "Beca completa para cursar un diplomado en derecho internacional y derechos humanos, dirigido a jóvenes abogados de América Latina.",
        requirements: "Abogado titulado. Promedio sobresaliente. Interés en derechos humanos.",
        competencies: ["Derecho internacional", "Investigación jurídica"],
        benefits: "Matrícula completa, estipendio, materiales.",
        requiredDocuments: ["CV", "Título de abogado", "Ensayo"],
        language: "Español",
        status: "activa",
        views: 88,
      },
    ])
    .returning();

  const pros = await db
    .insert(professionalsTable)
    .values([
      {
        name: "Valentina Ríos",
        email: "valentina.rios@example.com",
        headline: "Ingeniera de software junior | Apasionada por la IA",
        country: "Colombia",
        city: "Bogotá",
        bio: "Ingeniera de sistemas recién graduada de la Universidad Nacional de Colombia. Me interesa el desarrollo de software con impacto social y la inteligencia artificial aplicada. Busco oportunidades internacionales para crecer profesionalmente.",
        languages: ["Español (nativo)", "Inglés (B2)", "Portugués (A2)"],
        skills: ["JavaScript", "TypeScript", "React", "Python", "SQL", "Git"],
        education: "Ingeniería de Sistemas — Universidad Nacional de Colombia (2021-2025)",
        experience:
          "Desarrolladora junior en startup fintech (2024-2025). Monitora de programación en la universidad (2023-2024).",
        certifications: ["AWS Cloud Practitioner", "Scrum Foundation"],
        internationalAvailability: true,
        countriesOfInterest: ["México", "Argentina", "España", "Estados Unidos"],
        preferredModality: "remoto",
      },
      {
        name: "Diego Fernández",
        email: "diego.fernandez@example.com",
        headline: "Economista | Interesado en políticas públicas",
        country: "Perú",
        city: "Lima",
        bio: "Economista con dos años de experiencia en consultoría. Busco becas de posgrado en políticas públicas.",
        languages: ["Español (nativo)", "Inglés (C1)"],
        skills: ["Análisis económico", "Stata", "Excel avanzado", "Redacción de informes"],
        education: "Economía — Pontificia Universidad Católica del Perú (2018-2023)",
        experience: "Analista en consultora de políticas públicas (2023-presente).",
        certifications: ["TOEFL iBT 104"],
        internationalAvailability: true,
        countriesOfInterest: ["Estados Unidos", "Chile"],
        preferredModality: "presencial",
      },
      {
        name: "Camila Torres",
        email: "camila.torres@example.com",
        headline: "Estudiante de biología | Voluntaria ambiental",
        country: "México",
        city: "Guadalajara",
        bio: "Estudiante de último semestre de biología interesada en biotecnología y conservación.",
        languages: ["Español (nativo)", "Inglés (B1)"],
        skills: ["Trabajo de laboratorio", "Análisis de datos", "Educación ambiental"],
        education: "Biología — Universidad de Guadalajara (2021-presente)",
        experience: "Voluntaria en programa de reforestación (2022-presente).",
        certifications: [],
        internationalAvailability: false,
        countriesOfInterest: ["México", "Colombia"],
        preferredModality: "hibrido",
      },
    ])
    .returning();

  const oppByTitle = (title: string) => {
    const opp = opps.find((o) => o.title === title);
    if (!opp) throw new Error(`Opp not found: ${title}`);
    return opp.id;
  };
  const proByName = (name: string) => {
    const pro = pros.find((p) => p.name === name);
    if (!pro) throw new Error(`Pro not found: ${name}`);
    return pro.id;
  };

  await db.insert(applicationsTable).values([
    {
      opportunityId: oppByTitle("Internship en Desarrollo de Software"),
      professionalId: proByName("Valentina Ríos"),
      status: "preseleccionado",
      message:
        "Me entusiasma la posibilidad de hacer mi pasantía en Globant. Tengo experiencia con JavaScript y React, y muchas ganas de aprender de equipos internacionales.",
    },
    {
      opportunityId: oppByTitle("Bootcamp de Inteligencia Artificial Aplicada"),
      professionalId: proByName("Valentina Ríos"),
      status: "aceptado",
      message: "La IA aplicada es el área en la que quiero especializarme.",
    },
    {
      opportunityId: oppByTitle("Beca de Maestría en Políticas Públicas"),
      professionalId: proByName("Diego Fernández"),
      status: "en_revision",
      message:
        "Adjunto mi ensayo de motivación y certificado TOEFL. Mi objetivo es especializarme en evaluación de programas sociales.",
    },
    {
      opportunityId: oppByTitle("Convocatoria Nacional de Jóvenes Investigadores"),
      professionalId: proByName("Diego Fernández"),
      status: "enviada",
      message: "Propongo un estudio sobre el impacto de la inversión en CTI en regiones rurales.",
    },
    {
      opportunityId: oppByTitle("Asistente de Investigación en Biotecnología"),
      professionalId: proByName("Camila Torres"),
      status: "rechazado",
      message: "Soy estudiante de último semestre de biología con experiencia en laboratorio.",
    },
  ]);

  await db.insert(savedOpportunitiesTable).values([
    {
      professionalId: proByName("Valentina Ríos"),
      opportunityId: oppByTitle("Desarrollador Full Stack Semi Senior"),
    },
    {
      professionalId: proByName("Valentina Ríos"),
      opportunityId: oppByTitle("Movilidad Académica — Semestre de Intercambio"),
    },
    {
      professionalId: proByName("Camila Torres"),
      opportunityId: oppByTitle("Cumbre Latinoamericana de Innovación Educativa"),
    },
  ]);

  process.stdout.write(
    `Seeded: ${orgs.length} organizations, ${opps.length} opportunities, ${pros.length} professionals.\n`,
  );
}

seed()
  .then(() => seedUsers())
  .then(() => process.exit(0))
  .catch((err) => {
    process.stderr.write(`Seed failed: ${err}\n`);
    process.exit(1);
  });
