import {
  db,
  organizationsTable,
  opportunitiesTable,
  professionalsTable,
  applicationsTable,
  applicationEventsTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";

type NewProfessional = typeof professionalsTable.$inferInsert;
type NewOpportunity = typeof opportunitiesTable.$inferInsert;

const EXTRA_PROFESSIONALS: NewProfessional[] = [
  {
    name: "Mateo Herrera",
    email: "mateo.herrera@example.com",
    headline: "Ingeniero backend | Node.js & Go",
    country: "Argentina",
    city: "Rosario",
    bio: "Desarrollador backend con 3 años de experiencia construyendo APIs y microservicios. Me interesan los sistemas distribuidos y la calidad del software.",
    languages: ["Español (nativo)", "Inglés (B2)"],
    skills: ["Node.js", "Go", "PostgreSQL", "Docker", "AWS", "Testing"],
    education: "Ingeniería en Sistemas — Universidad Nacional de Rosario (2017-2022)",
    experience: "Backend developer en fintech (2022-presente). Freelance de APIs (2021-2022).",
    certifications: ["AWS Solutions Architect Associate"],
    internationalAvailability: true,
    countriesOfInterest: ["España", "Colombia", "México"],
    preferredModality: "remoto",
  },
  {
    name: "Lucía Gómez",
    email: "lucia.gomez@example.com",
    headline: "Desarrolladora frontend | React & accesibilidad",
    country: "Colombia",
    city: "Medellín",
    bio: "Frontend developer enfocada en interfaces accesibles y de alto rendimiento. Disfruto colaborar con diseño para crear experiencias cuidadas.",
    languages: ["Español (nativo)", "Inglés (B2)"],
    skills: ["React", "TypeScript", "CSS", "Tailwind", "Accesibilidad", "Testing"],
    education: "Ingeniería de Software — Universidad EAFIT (2018-2023)",
    experience: "Frontend developer en agencia digital (2023-presente).",
    certifications: ["Meta Front-End Developer"],
    internationalAvailability: true,
    countriesOfInterest: ["Argentina", "España", "Uruguay"],
    preferredModality: "remoto",
  },
  {
    name: "Andrés Vargas",
    email: "andres.vargas@example.com",
    headline: "Ingeniero de datos | Python & SQL",
    country: "Perú",
    city: "Arequipa",
    bio: "Ingeniero de datos con experiencia en pipelines ETL y analítica. Busco proyectos con impacto regional en América Latina.",
    languages: ["Español (nativo)", "Inglés (B1)"],
    skills: ["Python", "SQL", "Airflow", "Spark", "Power BI", "Pandas"],
    education: "Ingeniería Industrial — Universidad Nacional de San Agustín (2016-2021)",
    experience: "Data engineer en retail (2021-presente).",
    certifications: ["Google Data Analytics"],
    internationalAvailability: true,
    countriesOfInterest: ["Argentina", "Chile", "México"],
    preferredModality: "hibrido",
  },
  {
    name: "Sofía Morales",
    email: "sofia.morales@example.com",
    headline: "Diseñadora de producto UX/UI",
    country: "México",
    city: "Ciudad de México",
    bio: "Diseñadora de producto con foco en investigación de usuarios y sistemas de diseño. Me apasiona resolver problemas complejos con simplicidad.",
    languages: ["Español (nativo)", "Inglés (C1)"],
    skills: ["Figma", "Design Systems", "Investigación UX", "Prototipado", "Accesibilidad"],
    education: "Diseño Gráfico — Universidad Iberoamericana (2015-2020)",
    experience: "Product designer en SaaS B2B (2020-presente).",
    certifications: ["Nielsen Norman UX"],
    internationalAvailability: true,
    countriesOfInterest: ["España", "Argentina", "Estados Unidos"],
    preferredModality: "remoto",
  },
  {
    name: "Joaquín Silva",
    email: "joaquin.silva@example.com",
    headline: "Scrum Master & DevOps",
    country: "Chile",
    city: "Santiago",
    bio: "Facilitador ágil y entusiasta de DevOps. Ayudo a equipos a entregar valor de forma continua y sostenible.",
    languages: ["Español (nativo)", "Inglés (B2)"],
    skills: ["Scrum", "Kanban", "CI/CD", "Docker", "Kubernetes", "Facilitación"],
    education: "Ingeniería Civil Informática — Universidad de Chile (2014-2019)",
    experience: "Scrum Master en consultora tech (2020-presente). Developer (2019-2020).",
    certifications: ["Professional Scrum Master I", "Docker Certified Associate"],
    internationalAvailability: false,
    countriesOfInterest: ["Chile", "Argentina"],
    preferredModality: "hibrido",
  },
];

function globantOpps(orgId: number): NewOpportunity[] {
  return [
    {
      organizationId: orgId,
      title: "QA Automation Engineer",
      type: "empleo",
      area: "Tecnología",
      country: "Argentina",
      city: "Buenos Aires",
      modality: "remoto",
      paid: true,
      deadline: "2026-09-15",
      description:
        "Buscamos un QA Automation Engineer para diseñar y mantener suites de pruebas automatizadas en proyectos de clientes globales. Trabajarás junto a desarrollo y producto para asegurar la calidad de cada entrega.",
      requirements: "2+ años en automatización de pruebas. Experiencia con Cypress o Playwright. Inglés B2.",
      competencies: ["Cypress", "Playwright", "JavaScript", "CI/CD", "Inglés B2"],
      benefits: "Trabajo remoto, obra social, presupuesto de formación.",
      requiredDocuments: ["CV actualizado", "Portafolio de proyectos"],
      language: "Español",
      status: "activa",
      views: 87,
    },
    {
      organizationId: orgId,
      title: "Ingeniero de Datos Ssr",
      type: "empleo",
      area: "Tecnología",
      country: "Colombia",
      city: "Bogotá",
      modality: "hibrido",
      paid: true,
      deadline: "2026-09-25",
      description:
        "Únete al equipo de datos para construir pipelines robustos y modelos analíticos que alimentan productos digitales de clientes internacionales.",
      requirements: "3+ años en ingeniería de datos. Python y SQL avanzado. Experiencia con Airflow o Spark.",
      competencies: ["Python", "SQL", "Airflow", "Spark", "Inglés B1"],
      benefits: "Modalidad híbrida, cobertura médica, plan de carrera.",
      requiredDocuments: ["CV actualizado"],
      language: "Español",
      status: "activa",
      views: 112,
    },
    {
      organizationId: orgId,
      title: "Scrum Master Ágil",
      type: "empleo",
      area: "Gestión de Proyectos",
      country: "Chile",
      city: "Santiago",
      modality: "remoto",
      paid: true,
      deadline: "2026-10-05",
      description:
        "Buscamos un Scrum Master para acompañar a equipos multidisciplinarios distribuidos, facilitando ceremonias ágiles y removiendo impedimentos.",
      requirements: "Certificación Scrum. 3+ años facilitando equipos ágiles. Inglés B2.",
      competencies: ["Scrum", "Kanban", "Facilitación", "Inglés B2"],
      benefits: "100% remoto, formación continua, bono anual.",
      requiredDocuments: ["CV actualizado", "Certificaciones ágiles"],
      language: "Español",
      status: "activa",
      views: 64,
    },
    {
      organizationId: orgId,
      title: "Frontend Developer React Ssr",
      type: "empleo",
      area: "Tecnología",
      country: "México",
      city: "Guadalajara",
      modality: "remoto",
      paid: true,
      deadline: "2026-09-28",
      description:
        "Desarrollador frontend con foco en React para construir interfaces de producto escalables y accesibles junto a un equipo de diseño y backend.",
      requirements: "3+ años con React y TypeScript. Experiencia con testing. Inglés B2.",
      competencies: ["React", "TypeScript", "Tailwind", "Testing", "Inglés B2"],
      benefits: "Trabajo remoto, plan de carrera, cobertura médica premium.",
      requiredDocuments: ["CV actualizado", "Portafolio"],
      language: "Español",
      status: "activa",
      views: 149,
    },
  ];
}

const STATUS_ORDER = [
  "enviada",
  "en_revision",
  "preseleccionado",
  "entrevista",
  "aceptado",
] as const;

const EVENT_NOTES: Record<string, string> = {
  enviada: "Postulación recibida.",
  en_revision: "El equipo de reclutamiento comenzó a revisar el perfil.",
  preseleccionado: "Perfil preseleccionado tras una primera evaluación técnica.",
  entrevista: "Se agendó una entrevista con el equipo.",
  aceptado: "¡Felicitaciones! La candidatura fue aceptada.",
  rechazado: "Agradecemos tu interés; en esta ocasión avanzamos con otros perfiles.",
};

function buildTimeline(finalStatus: string, baseDaysAgo: number): { status: string; note: string; createdAt: Date }[] {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const chain: string[] = [];
  if (finalStatus === "rechazado") {
    chain.push("enviada", "en_revision", "rechazado");
  } else {
    for (const s of STATUS_ORDER) {
      chain.push(s);
      if (s === finalStatus) break;
    }
  }
  const step = chain.length > 1 ? baseDaysAgo / (chain.length - 1) : 0;
  return chain.map((status, i) => ({
    status,
    note: EVENT_NOTES[status] ?? "",
    createdAt: new Date(now - (baseDaysAgo - step * i) * dayMs),
  }));
}

type PlannedApplication = {
  opportunityTitle: string;
  professionalEmail: string;
  finalStatus: string;
  score: number | null;
  message: string;
  daysAgo: number;
};

const PLANNED: PlannedApplication[] = [
  {
    opportunityTitle: "QA Automation Engineer",
    professionalEmail: "mateo.herrera@example.com",
    finalStatus: "entrevista",
    score: 4,
    message: "Tengo experiencia sólida con Playwright y CI/CD. Me entusiasma aportar a la calidad de sus productos.",
    daysAgo: 12,
  },
  {
    opportunityTitle: "QA Automation Engineer",
    professionalEmail: "lucia.gomez@example.com",
    finalStatus: "en_revision",
    score: null,
    message: "Aunque mi foco es frontend, tengo buena base en testing automatizado y quiero crecer en QA.",
    daysAgo: 6,
  },
  {
    opportunityTitle: "Ingeniero de Datos Ssr",
    professionalEmail: "andres.vargas@example.com",
    finalStatus: "preseleccionado",
    score: 5,
    message: "He construido pipelines ETL con Airflow y Spark para retail. Me interesa el impacto regional de sus proyectos.",
    daysAgo: 10,
  },
  {
    opportunityTitle: "Scrum Master Ágil",
    professionalEmail: "joaquin.silva@example.com",
    finalStatus: "aceptado",
    score: 5,
    message: "Como PSM I con experiencia en equipos distribuidos, puedo aportar prácticas ágiles sostenibles.",
    daysAgo: 20,
  },
  {
    opportunityTitle: "Frontend Developer React Ssr",
    professionalEmail: "lucia.gomez@example.com",
    finalStatus: "preseleccionado",
    score: 4,
    message: "React y accesibilidad son mi especialidad. Adjunto mi portafolio con proyectos recientes.",
    daysAgo: 8,
  },
  {
    opportunityTitle: "Frontend Developer React Ssr",
    professionalEmail: "mateo.herrera@example.com",
    finalStatus: "rechazado",
    score: 2,
    message: "Vengo de backend pero me gustaría transicionar a frontend.",
    daysAgo: 9,
  },
  {
    opportunityTitle: "Desarrollador Full Stack Semi Senior",
    professionalEmail: "mateo.herrera@example.com",
    finalStatus: "entrevista",
    score: 5,
    message: "Experiencia full stack con Node.js y React. Disponible para sumarme de inmediato.",
    daysAgo: 14,
  },
  {
    opportunityTitle: "Diseñador UX/UI Senior",
    professionalEmail: "sofia.morales@example.com",
    finalStatus: "preseleccionado",
    score: 4,
    message: "Lidero diseño de producto en SaaS B2B. Comparto mi portafolio y casos de estudio.",
    daysAgo: 7,
  },
  {
    opportunityTitle: "Internship en Desarrollo de Software",
    professionalEmail: "lucia.gomez@example.com",
    finalStatus: "enviada",
    score: null,
    message: "Me encantaría iniciar mi carrera en Globant como pasante y aprender de equipos internacionales.",
    daysAgo: 2,
  },
];

async function seedExtra(): Promise<void> {
  const [globant] = await db
    .select()
    .from(organizationsTable)
    .where(eq(organizationsTable.name, "Globant"));
  if (!globant) {
    process.stdout.write("seedExtra: Globant org not found, skipping.\n");
    return;
  }

  let prosInserted = 0;
  for (const pro of EXTRA_PROFESSIONALS) {
    const [existing] = await db
      .select()
      .from(professionalsTable)
      .where(eq(professionalsTable.email, pro.email));
    if (!existing) {
      await db.insert(professionalsTable).values(pro);
      prosInserted++;
    }
  }

  let oppsInserted = 0;
  for (const opp of globantOpps(globant.id)) {
    const [existing] = await db
      .select()
      .from(opportunitiesTable)
      .where(
        and(
          eq(opportunitiesTable.organizationId, globant.id),
          eq(opportunitiesTable.title, opp.title as string),
        ),
      );
    if (!existing) {
      await db.insert(opportunitiesTable).values(opp);
      oppsInserted++;
    }
  }

  let appsInserted = 0;
  let eventsInserted = 0;
  for (const plan of PLANNED) {
    const [opp] = await db
      .select()
      .from(opportunitiesTable)
      .where(eq(opportunitiesTable.title, plan.opportunityTitle));
    const [pro] = await db
      .select()
      .from(professionalsTable)
      .where(eq(professionalsTable.email, plan.professionalEmail));
    if (!opp || !pro) continue;

    const [existingApp] = await db
      .select()
      .from(applicationsTable)
      .where(
        and(
          eq(applicationsTable.opportunityId, opp.id),
          eq(applicationsTable.professionalId, pro.id),
        ),
      );
    if (existingApp) continue;

    const timeline = buildTimeline(plan.finalStatus, plan.daysAgo);
    const [inserted] = await db
      .insert(applicationsTable)
      .values({
        opportunityId: opp.id,
        professionalId: pro.id,
        status: plan.finalStatus,
        message: plan.message,
        score: plan.score,
        createdAt: timeline[0].createdAt,
      })
      .returning();
    appsInserted++;

    await db.insert(applicationEventsTable).values(
      timeline.map((ev) => ({
        applicationId: inserted.id,
        status: ev.status,
        note: ev.note,
        createdAt: ev.createdAt,
      })),
    );
    eventsInserted += timeline.length;
  }

  process.stdout.write(
    `seedExtra: +${prosInserted} professionals, +${oppsInserted} opportunities, +${appsInserted} applications, +${eventsInserted} events.\n`,
  );
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  seedExtra()
    .then(() => process.exit(0))
    .catch((err) => {
      process.stderr.write(`seedExtra failed: ${err}\n`);
      process.exit(1);
    });
}

export { seedExtra };
