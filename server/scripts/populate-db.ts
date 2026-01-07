import "dotenv/config";
import "reflect-metadata";
import { AppDataSource, initializeDatabase, closeDatabase } from "@database";
import { OfficeDAO } from "@daos/OfficeDAO";
import { CategoryDAO } from "@daos/CategoryDAO";
import { UserDAO, UserType } from "@daos/UserDAO";
import { logInfo, logError } from "@utils/logger";
import * as bcrypt from "bcryptjs";
import { NotificationDAO } from "@daos/NotificationsDAO";
import { ReportDAO, ReportStatus } from "@daos/ReportDAO";

const OFFICES: string[] = [
  "Organization",
  "Public Services Division",
  "Environmental Quality Division",
  "Green Areas, Parks and Animal Welfare Division",
  "Infrastructure Division",
  "General Services Division",
];

const USERS: Array<{
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userType: UserType;
  offices?: number[];
  company?: number;
  image?: string;
}> = [
  {
    username: "admin",
    email: "admin@gmail.com",
    firstName: "Stefano",
    lastName: "Lo Russo",
    password: "admin",
    userType: UserType.ADMINISTRATOR,
  },
  {
    username: "user1",
    email: "user1@gmail.com",
    firstName: "Francesco",
    lastName: "Totti",
    password: "user1",
    userType: UserType.CITIZEN,
    image:
      "https://th.bing.com/th/id/OIP._oUp254yRW_egOIFBApgxQHaEK?w=332&h=186&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
  },
  {
    username: "user2",
    email: "user2@gmail.com",
    firstName: "Luca",
    lastName: "Bianchi",
    password: "user2",
    userType: UserType.CITIZEN,
    image:
      "https://phantom-marca-us.unidadeditorial.es/b913da75d8c51056cca57fb9cef9b860/resize/1320/f/jpg/assets/multimedia/imagenes/2022/04/16/16501393399190.jpg",
  },
  {
    username: "user3",
    email: "user3@gmail.com",
    firstName: "Maria",
    lastName: "Rossi",
    password: "user3",
    userType: UserType.CITIZEN,
    image:
      "https://tse2.mm.bing.net/th/id/OIP.UPTvC4bPJ1guXnWKgM46MAHaHa?rs=1&pid=ImgDetMain&o=7&rm=3",
  },
  {
    username: "giack.team5",
    email: "giack@five.se",
    firstName: "Giacomo",
    lastName: "Pirlo",
    password: "password",
    userType: UserType.CITIZEN,
  },
  {
    username: "tsm1",
    email: "tsm1@part.se",
    firstName: "Carmine",
    lastName: "Conte",
    password: "password",
    userType: UserType.TECHNICAL_STAFF_MEMBER,
    offices: [1, 2],
  },
  {
    username: "tsm2",
    email: "tsm2@part.se",
    firstName: "Carmine",
    lastName: "Conte",
    password: "password",
    userType: UserType.TECHNICAL_STAFF_MEMBER,
    offices: [2, 3],
  },
  {
    username: "tsm3",
    email: "tsm3@part.se",
    firstName: "Carmine",
    lastName: "Conte",
    password: "password",
    userType: UserType.TECHNICAL_STAFF_MEMBER,
    offices: [3],
  },
  {
    username: "tsm4",
    email: "tsm4@part.se",
    firstName: "Carmine",
    lastName: "Conte",
    password: "password",
    userType: UserType.TECHNICAL_STAFF_MEMBER,
    offices: [4],
  },
  {
    username: "tsm5",
    email: "tsm5@part.se",
    firstName: "Carmine",
    lastName: "Conte",
    password: "password",
    userType: UserType.TECHNICAL_STAFF_MEMBER,
    offices: [5],
  },
  {
    username: "tsm6",
    email: "tsm6@part.se",
    firstName: "Carmine",
    lastName: "Conte",
    password: "password",
    userType: UserType.TECHNICAL_STAFF_MEMBER,
    offices: [6],
  },
  {
    username: "munadm",
    email: "munadm@part.se",
    firstName: "Giorgio",
    lastName: "Turio",
    password: "password",
    userType: UserType.MUNICIPAL_ADMINISTRATOR,
  },
  {
    username: "fake1",
    email: "fake@part.se",
    firstName: "Fake1",
    lastName: "Fake1",
    password: "password",
    userType: UserType.EXTERNAL_MAINTAINER,
    company: 3,
  }, // it has to have id 13
  {
    username: "pro",
    email: "pro@part.se",
    firstName: "Carlo",
    lastName: "Ultimo",
    password: "password",
    userType: UserType.PUBLIC_RELATIONS_OFFICER,
  },
  {
    username: "em1",
    email: "em1@part.se",
    firstName: "Carlo",
    lastName: "Ultimo",
    password: "password",
    userType: UserType.EXTERNAL_MAINTAINER,
    company: 1,
  },
];

const CATEGORIES: Array<{ name: string; office: string }> = [
  { name: "Water Supply - Drinking Water", office: "Public Services Division" },
  { name: "Architectural Barriers", office: "Infrastructure Division" },
  { name: "Sewer System", office: "Public Services Division" },
  { name: "Public Lighting", office: "Public Services Division" },
  { name: "Waste", office: "Environmental Quality Division" },
  { name: "Road Signs and Traffic Lights", office: "Infrastructure Division" },
  { name: "Roads and Urban Furnishings", office: "Infrastructure Division" },
  {
    name: "Public Green Areas and Playgrounds",
    office: "Green Areas, Parks and Animal Welfare Division",
  },
  { name: "Other", office: "General Services Division" },
];

async function upsertUsers(
  users: Array<{
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    userType: UserType;
    offices?: number[];
    company?: number;
    image?: string;
  }>
) {
  const repo = AppDataSource.getRepository(UserDAO);

  for (const {
    username,
    email,
    password,
    firstName,
    lastName,
    userType,
    offices,
    company,
    image,
  } of users) {
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();
    if (!trimmedUsername || !trimmedEmail) continue;

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    let user = await repo.findOne({ where: { username: trimmedUsername } });
    if (user) {
      logInfo(
        `[populate-db] User already exists: ${trimmedUsername} (id=${user.id})`
      );
    } else if (!offices && !company) {
      user = repo.create({
        username: trimmedUsername,
        email: trimmedEmail,
        passwordHash,
        firstName,
        lastName,
        userType,
        image: image || undefined,
      });
      user = await repo.save(user);
      logInfo(
        `[populate-db] Inserted user: ${trimmedUsername} (id=${user.id})`
      );
    } else if (offices && !company) {
      const officesEntity = [];
      const officeRepo = AppDataSource.getRepository(OfficeDAO);
      for (const office of offices) {
        const officeEntity = await officeRepo.findOne({
          where: { id: office },
        });
        if (officeEntity) {
          officesEntity.push(officeEntity);
        } else {
          logError(
            `[populate-db] Skipping user '${trimmedUsername}': office id='${office}' not found in OFFICES.`
          );
        }
      }
      user = repo.create({
        username: trimmedUsername,
        email: trimmedEmail,
        passwordHash,
        firstName,
        lastName,
        userType,
        offices: officesEntity,
        image: image || undefined,
      });
      user = await repo.save(user);
      logInfo(
        `[populate-db] Inserted user: ${trimmedUsername} (id=${user.id})`
      );
    } else if (company && !offices) {
      const companyRepo = AppDataSource.getRepository("CompanyDAO");
      const companyEntity = await companyRepo.findOne({
        where: { id: company },
      });
      if (!companyEntity) {
        logError(
          `[populate-db] Skipping user '${trimmedUsername}': company id='${company}' not found in COMPANIES.`
        );
        continue;
      }
      user = repo.create({
        username: trimmedUsername,
        email: trimmedEmail,
        passwordHash,
        firstName,
        lastName,
        userType,
        company: companyEntity,
        image: image || undefined,
      });
      user = await repo.save(user);
      logInfo(
        `[populate-db] Inserted user: ${trimmedUsername} (id=${user.id})`
      );
    }
  }
}

async function upsertOffices(offices: string[]) {
  const repo = AppDataSource.getRepository(OfficeDAO);
  const map = new Map<string, OfficeDAO>();

  for (const name of offices) {
    const trimmed = name.trim();
    if (!trimmed) continue;

    let office = await repo.findOne({ where: { name: trimmed } });
    if (office) {
      logInfo(
        `[populate-db] Office already exists: ${trimmed} (id=${office.id})`
      );
    } else {
      office = repo.create({ name: trimmed });
      office = await repo.save(office);

      logInfo(`[populate-db] Inserted office: ${trimmed} (id=${office.id})`);
    }
    map.set(trimmed, office);
  }

  return map;
}

async function upsertCategories(
  items: Array<{ name: string; office: string }>,
  rolesByName: Map<string, OfficeDAO>
) {
  const repo = AppDataSource.getRepository(CategoryDAO);

  for (const { name, office } of items) {
    const trimmedName = name.trim();
    const trimmedOffice = office.trim();
    if (!trimmedName || !trimmedOffice) continue;

    const role = rolesByName.get(trimmedOffice);
    if (!role) {
      logError(
        `[populate-db] Skipping category '${trimmedName}': office '${trimmedOffice}' not found in OFFICES.`
      );
      continue;
    }

    let cat = await repo.findOne({ where: { name: trimmedName } });
    if (cat) {
      if (!cat.office || cat.office.id !== role.id) {
        cat.office = role;
        await repo.save(cat);

        logInfo(
          `[populate-db] Updated category office: ${trimmedName} -> office=${role.name}`
        );
      } else {
        logInfo(
          `[populate-db] Category already exists: ${trimmedName} (id=${cat.id})`
        );
      }
    } else {
      cat = repo.create({ name: trimmedName, office: role });
      cat = await repo.save(cat);

      logInfo(
        `[populate-db] Inserted category: ${trimmedName} (id=${cat.id}) -> office=${role.name}`
      );
    }
  }
}

async function upsertReports() {
  const userRepo = AppDataSource.getRepository(UserDAO);
  const categoryRepo = AppDataSource.getRepository(CategoryDAO);
  const reportRepo = AppDataSource.getRepository(ReportDAO);

  const creators = await userRepo.find({
    where: [
      { username: "user1" },
      { username: "user2" },
      { username: "user3" },
    ],
  });

  if (!creators.length) {
    const fallback =
      (await userRepo.findOne({ where: { username: "user1" } })) ||
      (await userRepo.findOne({}));
    if (!fallback) {
      logError(
        "[populate-db] No users found to attach reports to. Skipping reports."
      );
      return;
    }
    creators.push(fallback);
  }

  let creatorIndex = 0;

  const allCategories = await categoryRepo.find({ relations: ["office"] });
  if (!allCategories.length) {
    logError(
      "[populate-db] No categories found to attach reports to. Skipping reports."
    );
    return;
  }

  const categoryByName = new Map<string, CategoryDAO>();
  for (const c of allCategories) {
    categoryByName.set(c.name, c);
  }

  const techStaff = await userRepo.find({
    where: { userType: UserType.TECHNICAL_STAFF_MEMBER },
    relations: ["offices"],
  });

  if (!techStaff.length) {
    logError(
      "[populate-db] No technical staff members found. Skipping reports."
    );
    return;
  }

  const officeToTechs = new Map<number, UserDAO[]>();
  for (const u of techStaff) {
    if (!u.offices) continue;

    for (const office of u.offices) {
      const list = officeToTechs.get(office.id) || [];
      list.push(u);
      officeToTechs.set(office.id, list);
    }
  }

  const officeRoundRobinIndex = new Map<number, number>();
  const pickAssigneeForOffice = (officeId?: number | null): UserDAO | null => {
    if (!officeId) return null;

    const list = officeToTechs.get(officeId);
    if (!list?.length) return null;

    const currentIndex = officeRoundRobinIndex.get(officeId) ?? 0;
    const assignee = list[currentIndex % list.length];
    officeRoundRobinIndex.set(officeId, (currentIndex + 1) % list.length);

    return assignee;
  };

  type SampleReport = {
    title: string;
    description: string;
    categoryName: string;
    images: string[];
    lat: number;
    long: number;
    anonymous: boolean;
    status: ReportStatus;
  };

  const samples: SampleReport[] = [
    {
      title: "Pothole in via Garibaldi near Piazza Castello",
      description:
        "Deep pothole close to the tram tracks, dangerous for cyclists and scooters.",
      categoryName: "Roads and Urban Furnishings",
      images: [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Newport_Whitepit_Lane_pot_hole.JPG/330px-Newport_Whitepit_Lane_pot_hole.JPG",
      ],
      lat: 45.0703,
      long: 7.6869,
      anonymous: false,
      status: ReportStatus.Assigned,
    },
    {
      title: "Faded pedestrian crossing in via XX Settembre",
      description:
        "Zebra crossing almost invisible, cars do not slow down when approaching the junction.",
      categoryName: "Road Signs and Traffic Lights",
      images: [
        "https://via.placeholder.com/800x600.png?text=pedestrian+crossing",
      ],
      lat: 45.0698,
      long: 7.6882,
      anonymous: false,
      status: ReportStatus.InProgress,
    },
    {
      title: "Overflowing waste bins in Piazza Castello corner via Po",
      description:
        "Mixed waste bin full since yesterday evening, rubbish on the pavement.",
      categoryName: "Waste",
      images: [
        "https://www.terzobinario.it/wp-content/uploads/2023/06/IMG_3372.jpg",
        "https://www.ilmessaggero.it/photos/MED_HIGH/38/41/5143841_0944_rifiuti.jpg",
      ],
      lat: 45.071,
      long: 7.6855,
      anonymous: false,
      status: ReportStatus.PendingApproval,
    },
    {
      title: "Broken street light in via Madama Cristina",
      description:
        "Lamp post not working for several nights near the pedestrian crossing.",
      categoryName: "Public Lighting",
      images: ["https://via.placeholder.com/800x600.png?text=streetlight+off"],
      lat: 45.0581,
      long: 7.6762,
      anonymous: false,
      status: ReportStatus.Assigned,
    },
    {
      title: "Loose manhole cover in corso Marconi",
      description:
        "Metal cover rattles loudly when cars pass over, possible risk for bicycles.",
      categoryName: "Sewer System",
      images: ["https://via.placeholder.com/800x600.png?text=manhole"],
      lat: 45.0569,
      long: 7.6785,
      anonymous: false,
      status: ReportStatus.InProgress,
    },
    {
      title: "Architectural barrier at tram stop Nizza",
      description:
        "High sidewalk edge without ramp, difficult access for wheelchairs and strollers.",
      categoryName: "Architectural Barriers",
      images: ["https://via.placeholder.com/800x600.png?text=barrier+step"],
      lat: 45.0593,
      long: 7.6748,
      anonymous: false,
      status: ReportStatus.Assigned,
    },
    {
      title: "Large pothole in via Plava near park entrance",
      description:
        "Pothole occupies almost an entire lane, vehicles brake suddenly.",
      categoryName: "Roads and Urban Furnishings",
      images: [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Newport_Whitepit_Lane_pot_hole.JPG/330px-Newport_Whitepit_Lane_pot_hole.JPG",
      ],
      lat: 45.0175,
      long: 7.6203,
      anonymous: false,
      status: ReportStatus.Suspended,
    },
    {
      title: "Damaged playground equipment in Parco Colonnetti",
      description:
        "Broken slide and missing protective panels in the kids area.",
      categoryName: "Public Green Areas and Playgrounds",
      images: ["https://via.placeholder.com/800x600.png?text=playground"],
      lat: 45.019,
      long: 7.6189,
      anonymous: false,
      status: ReportStatus.Assigned,
    },
    {
      title: "Missing waste collection in via Artom",
      description:
        "Organic waste container not emptied for two days, strong smell in the courtyard.",
      categoryName: "Waste",
      images: [
        "https://th.bing.com/th/id/OIP.-8RT2HmbCBCH3ROy3fJXowHaLH?w=122&h=183&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
        "https://th.bing.com/th/id/OIP.niINUwXnY4NmhTSbYo4bOgHaE8?w=256&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
      ],
      lat: 45.0158,
      long: 7.6231,
      anonymous: false,
      status: ReportStatus.PendingApproval,
    },
    {
      title: "Water leak from sidewalk in via Genova",
      description:
        "Continuous trickle of water coming out from below the curb, pavement always wet.",
      categoryName: "Water Supply - Drinking Water",
      images: ["https://via.placeholder.com/800x600.png?text=water+leak"],
      lat: 45.031,
      long: 7.652,
      anonymous: false,
      status: ReportStatus.InProgress,
    },
    {
      title: "Street light blinking in corso Unità d'Italia",
      description:
        "Lamp flickers continuously, disturbing drivers entering the underpass.",
      categoryName: "Public Lighting",
      images: ["https://via.placeholder.com/800x600.png?text=blinking+light"],
      lat: 45.0334,
      long: 7.6591,
      anonymous: false,
      status: ReportStatus.Resolved,
    },
    {
      title: "Abandoned bulky waste in via Cigna",
      description:
        "Old mattress and pieces of furniture left next to the waste bins.",
      categoryName: "Waste",
      images: ["https://via.placeholder.com/800x600.png?text=bulky+waste"],
      lat: 45.091,
      long: 7.6925,
      anonymous: false,
      status: ReportStatus.Assigned,
    },
    {
      title: "Unsignalled roadworks in corso Vigevano",
      description:
        "Open excavation with poor signage, lane narrowing without advance warning.",
      categoryName: "Roads and Urban Furnishings",
      images: ["https://via.placeholder.com/800x600.png?text=roadworks"],
      lat: 45.0827,
      long: 7.6819,
      anonymous: false,
      status: ReportStatus.InProgress,
    },
    {
      title: "Damaged traffic light casing in piazza Crispi",
      description:
        "Plastic cover broken after a collision, internal cables partially exposed.",
      categoryName: "Road Signs and Traffic Lights",
      images: ["https://via.placeholder.com/800x600.png?text=traffic+light"],
      lat: 45.0861,
      long: 7.6938,
      anonymous: false,
      status: ReportStatus.Assigned,
    },
    {
      title: "Sidewalk tree roots lifting pavement in corso Sebastopoli",
      description:
        "Uneven sidewalk, difficult passage for wheelchairs and prams.",
      categoryName: "Architectural Barriers",
      images: ["https://via.placeholder.com/800x600.png?text=tree+roots"],
      lat: 45.0451,
      long: 7.6442,
      anonymous: false,
      status: ReportStatus.Suspended,
    },
    {
      title: "Missing swing chains in Giardino Rignon",
      description:
        "Two swings without chains, area currently unusable for children.",
      categoryName: "Public Green Areas and Playgrounds",
      images: ["https://via.placeholder.com/800x600.png?text=swing"],
      lat: 45.0513,
      long: 7.6389,
      anonymous: false,
      status: ReportStatus.Assigned,
    },
    {
      title: "Water stagnation in underpass of corso Trapani",
      description:
        "After each rainfall, large puddle forms making pedestrian passage difficult.",
      categoryName: "Sewer System",
      images: ["https://via.placeholder.com/800x600.png?text=underpass+water"],
      lat: 45.0602,
      long: 7.6475,
      anonymous: false,
      status: ReportStatus.InProgress,
    },
    {
      title: "Noise from ventilation shaft in via Roma courtyard",
      description: "Loud humming from a ventilation system during the night.",
      categoryName: "Other",
      images: [
        "https://th.bing.com/th/id/OIP.noqLx-v_ra8-Z47iv5dcawHaE7?w=266&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
      ],
      lat: 45.0682,
      long: 7.6811,
      anonymous: true,
      status: ReportStatus.PendingApproval,
    },
    {
      title: "Illegal posters on building facade in via Garibaldi",
      description:
        "Several unauthorised posters glued to the historic building walls.",
      categoryName: "Other",
      images: ["https://via.placeholder.com/800x600.png?text=posters"],
      lat: 45.072,
      long: 7.6844,
      anonymous: false,
      status: ReportStatus.Assigned,
    },
    {
      title: "Graffiti on Murazzi embankment wall",
      description:
        "New large graffiti on the river embankment wall, covering previous mural.",
      categoryName: "Other",
      images: [
        "https://thumbs.dreamstime.com/b/colorful-graffity-wall-donau-river-embankment-wien-colorful-graffity-wall-big-city-colorful-street-art-grafity-265676683.jpg",
      ],
      lat: 45.0745,
      long: 7.7002,
      anonymous: false,
      status: ReportStatus.PendingApproval,
    },
    {
      title: "Broken bench in Parco Dora",
      description:
        "Wooden bench with a missing plank near the playground area.",
      categoryName: "Public Green Areas and Playgrounds",
      images: ["https://via.placeholder.com/800x600.png?text=bench"],
      lat: 45.0921,
      long: 7.6807,
      anonymous: false,
      status: ReportStatus.Assigned,
    },
    {
      title: "Standing water near rainwater drain in via Bologna",
      description:
        "After rainfall, water slowly drains and forms a puddle on the corner.",
      categoryName: "Sewer System",
      images: ["https://via.placeholder.com/800x600.png?text=drain"],
      lat: 45.0809,
      long: 7.6973,
      anonymous: false,
      status: ReportStatus.InProgress,
    },
    {
      title: "Loose paving stones in via Lamarmora sidewalk",
      description: "Several paving stones move underfoot, risk of tripping.",
      categoryName: "Architectural Barriers",
      images: ["https://via.placeholder.com/800x600.png?text=paving+stones"],
      lat: 45.0574,
      long: 7.6741,
      anonymous: false,
      status: ReportStatus.Assigned,
    },
    {
      title: "Intermittent street lighting in corso Re Umberto",
      description:
        "Two consecutive lamp posts turn off and on repeatedly during the night.",
      categoryName: "Public Lighting",
      images: ["https://via.placeholder.com/800x600.png?text=lampposts"],
      lat: 45.0612,
      long: 7.6733,
      anonymous: false,
      status: ReportStatus.InProgress,
    },
    {
      title: "Overflowing glass recycling containers in corso San Maurizio",
      description:
        "Glass bottles piled outside the container, risk of broken glass on pavement.",
      categoryName: "Waste",
      images: ["https://via.placeholder.com/800x600.png?text=glass+container"],
      lat: 45.0709,
      long: 7.6991,
      anonymous: false,
      status: ReportStatus.Assigned,
    },
    {
      title: "Damaged road surface near roundabout in corso Belgio",
      description:
        "Series of small holes and cracks just before the pedestrian crossing.",
      categoryName: "Roads and Urban Furnishings",
      images: ["https://via.placeholder.com/800x600.png?text=road+surface"],
      lat: 45.0728,
      long: 7.712,
      anonymous: false,
      status: ReportStatus.Suspended,
    },
    {
      title: "Playground gate latch broken in Parco della Tesoriera",
      description:
        "Gate does not close properly, children can easily run out onto the street.",
      categoryName: "Public Green Areas and Playgrounds",
      images: ["https://via.placeholder.com/800x600.png?text=gate"],
      lat: 45.0786,
      long: 7.6348,
      anonymous: false,
      status: ReportStatus.Assigned,
    },
    {
      title: "Water accumulation at bus stop in corso Francia",
      description:
        "Puddle regularly forms in front of the bus shelter after rain.",
      categoryName: "Sewer System",
      images: ["https://via.placeholder.com/800x600.png?text=bus+stop"],
      lat: 45.0781,
      long: 7.6489,
      anonymous: false,
      status: ReportStatus.InProgress,
    },
    {
      title: "Flickering pedestrian traffic light in corso Tassoni",
      description:
        "Green figure blinks at irregular intervals, confusing pedestrians.",
      categoryName: "Road Signs and Traffic Lights",
      images: ["https://via.placeholder.com/800x600.png?text=pedestrian+light"],
      lat: 45.0832,
      long: 7.6614,
      anonymous: false,
      status: ReportStatus.Assigned,
    },
    {
      title: "Leaking water hydrant in via Cibrario",
      description: "Small constant leak from the base of a street hydrant.",
      categoryName: "Water Supply - Drinking Water",
      images: ["https://via.placeholder.com/800x600.png?text=hydrant"],
      lat: 45.0803,
      long: 7.6649,
      anonymous: false,
      status: ReportStatus.InProgress,
    },
    {
      title: "Potholes and uneven pavement near Via Germagnano 47",
      description:
        "Several large potholes and uneven paving, causing dangerous conditions for cyclists and pedestrians.",
      categoryName: "Roads and Urban Furnishings",
      images: [
        "https://via.placeholder.com/800x600.png?text=pothole+germagnano",
      ],
      lat: 45.119,
      long: 7.6928,
      anonymous: false,
      status: ReportStatus.Suspended,
    },
    {
      title: "Blocked drainage in via Damiano Chiesa 35",
      description: "Storm drain clogged causing water to pool after rainfalls.",
      categoryName: "Sewer System",
      images: [
        "https://via.placeholder.com/800x600.png?text=drain+damiano+chiesa",
      ],
      lat: 45.1019,
      long: 7.7275667,
      anonymous: false,
      status: ReportStatus.Suspended,
    },
    {
      title: "Damaged sidewalk near Corso Chieri 127",
      description:
        "Cracked and uneven sidewalk slabs, causing tripping hazards for pedestrians.",
      categoryName: "Architectural Barriers",
      images: ["https://via.placeholder.com/800x600.png?text=sidewalk+chieri"],
      lat: 45.0604356,
      long: 7.7408194,
      anonymous: false,
      status: ReportStatus.Suspended,
    },
  ];

  for (const s of samples) {
    try {
      const existing = await reportRepo.findOne({ where: { title: s.title } });
      if (existing) {
        logInfo(
          `[populate-db] Report already exists: ${s.title} (id=${existing.id})`
        );
        continue;
      }

      const category = categoryByName.get(s.categoryName);
      if (!category) {
        logError(
          `[populate-db] Skipping report '${s.title}': category '${s.categoryName}' not found.`
        );
        continue;
      }

      let assignedTo: UserDAO | null = null;
      if (s.status !== ReportStatus.PendingApproval && category.office) {
        assignedTo = pickAssigneeForOffice(category.office.id);
        if (!assignedTo) {
          logError(
            `[populate-db] No technical staff found for office id='${category.office.id}' when creating report '${s.title}'.`
          );
        }
      }

      const r = reportRepo.create({
        title: s.title,
        description: s.description,
        category,
        images: s.images,
        lat: s.lat,
        long: s.long,
        anonymous: s.anonymous,
        status: s.status,
        createdAt: new Date(),
        createdBy: creators[creatorIndex % creators.length],
        assignedTo: assignedTo || undefined,
      });

      const saved = await reportRepo.save(r);
      logInfo(`[populate-db] Inserted report: ${saved.title} (id=${saved.id})`);

      // distribute reports evenly across creators
      creatorIndex = (creatorIndex + 1) % creators.length;
    } catch (err) {
      logError("[populate-db] Error inserting sample report:", err);
    }
  }
}

async function upsertNotifications() {
  const userRepo = AppDataSource.getRepository(UserDAO);
  const reportRepo = AppDataSource.getRepository(ReportDAO);
  const notifRepo = AppDataSource.getRepository(NotificationDAO);

  const user1 =
    (await userRepo.findOne({ where: { username: "user1" } })) ||
    (await userRepo.findOne({}));
  const user2 =
    (await userRepo.findOne({ where: { username: "admin" } })) || null;

  if (!user1) {
    logError(
      "[populate-db] No users found to attach notifications to. Skipping notifications."
    );
    return;
  }

  const reports = await reportRepo.find({ take: 2 });
  if (!reports || reports.length === 0) {
    logError("[populate-db] No reports found. Skipping notifications.");
    return;
  }

  // First notification
  try {
    const exists1 = await notifRepo.findOne({
      where: {
        user: { id: user1.id },
        report: { id: reports[0].id },
        previousStatus: ReportStatus.PendingApproval,
        newStatus: ReportStatus.Assigned,
      },
      relations: ["user", "report"],
    });
    if (exists1) {
      logInfo(
        `[populate-db] Notification already exists for user=${user1.username} reportId=${reports[0].id}`
      );
    } else {
      const notif1 = notifRepo.create({
        user: user1,
        report: reports[0],
        previousStatus: ReportStatus.PendingApproval,
        newStatus: ReportStatus.Assigned,
        seen: false,
      });
      await notifRepo.save(notif1);
      logInfo(
        `[populate-db] Inserted notification id=${notif1.id} for user=${user1.username} reportId=${reports[0].id}`
      );
    }
  } catch (err) {
    logError("[populate-db] Error inserting first notification:", err);
  }

  // Second notification
  try {
    const targetUser = user2 || user1;
    const secondReport = reports[1] || reports[0];
    const exists2 = await notifRepo.findOne({
      where: {
        user: { id: targetUser.id },
        report: { id: secondReport.id },
        previousStatus: ReportStatus.Assigned,
        newStatus: ReportStatus.Resolved,
      },
      relations: ["user", "report"],
    });
    if (exists2) {
      logInfo(
        `[populate-db] Notification already exists for user=${targetUser.username} reportId=${secondReport.id}`
      );
    } else {
      const notif2 = notifRepo.create({
        user: targetUser,
        report: secondReport,
        previousStatus: ReportStatus.Assigned,
        newStatus: ReportStatus.Resolved,
        seen: false,
      });
      await notifRepo.save(notif2);
      logInfo(
        `[populate-db] Inserted notification id=${notif2.id} for user=${targetUser.username} reportId=${secondReport.id}`
      );
    }
  } catch (err) {
    logError("[populate-db] Error inserting second notification:", err);
  }
}

async function upsertCompanies() {
  const repo = AppDataSource.getRepository("CompanyDAO");
  const categoryRepo = AppDataSource.getRepository(CategoryDAO);

  const companies = [
    {
      name: "Iren",
      categoryNames: ["Water Supply - Drinking Water", "Sewer System"],
    },
    {
      name: "Enel",
      categoryNames: ["Public Lighting", "Road Signs and Traffic Lights"],
    },
    {
      name: "Fake",
      categoryNames: [
        "Water Supply - Drinking Water",
        "Architectural Barriers",
        "Sewer System",
        "Public Lighting",
        "Waste",
        "Road Signs and Traffic Lights",
        "Roads and Urban Furnishings",
        "Public Green Areas and Playgrounds",
        "Other",
      ],
    }, // it has to have id 3
  ];

  for (const { name, categoryNames } of companies) {
    const trimmedName = name.trim();
    if (!trimmedName) continue;

    let company = await repo.findOne({ where: { name: trimmedName } });
    if (company) {
      logInfo(
        `[populate-db] Company already exists: ${trimmedName} (id=${company.id})`
      );
    } else {
      const categories: CategoryDAO[] = [];
      for (const catName of categoryNames) {
        const cat = await categoryRepo.findOne({ where: { name: catName } });
        if (cat) categories.push(cat);
      }

      company = repo.create({ name: trimmedName, categories });
      company = await repo.save(company);

      logInfo(
        `[populate-db] Inserted company: ${trimmedName} (id=${company.id})`
      );
    }
  }
}

async function deleteActualState() {
  const tables = [
    "users",
    "reports",
    "office_roles",
    "categories",
    "notifications",
    "messages",
    "chats",
    "companies",
    "company_categories",
  ];
  for (const t of tables) {
    const sql = "TRUNCATE TABLE " + t + " RESTART IDENTITY CASCADE";
    await AppDataSource.query(sql);

    console.log("Cleaned table *" + t + "*");
  }
}

async function main() {
  try {
    await initializeDatabase();

    await deleteActualState();

    const rolesByName = await upsertOffices(OFFICES);
    await upsertCategories(CATEGORIES, rolesByName);
    await upsertCompanies();
    await upsertUsers(USERS);

    await upsertReports();
    await upsertNotifications();

    logInfo("[populate-db] Done.");
  } catch (err) {
    logError("[populate-db] Failed:", err);
    process.exitCode = 1;
  } finally {
    await closeDatabase();
  }
}

main();
