import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create users
  const hashedPassword = await bcrypt.hash('password123', 10)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@platform.com' },
    update: {},
    create: {
      email: 'admin@platform.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
    },
  })

  const masjidAdmin = await prisma.user.upsert({
    where: { email: 'victoria@masjid.com' },
    update: {},
    create: {
      email: 'victoria@masjid.com',
      name: 'Victoria Masjid',
      password: hashedPassword,
      role: 'MASJID_ADMIN',
    },
  })

  const counsellor = await prisma.user.upsert({
    where: { email: 'counsellor@eclectic.com' },
    update: {},
    create: {
      email: 'counsellor@eclectic.com',
      name: 'Dr. Sarah Ahmed',
      password: hashedPassword,
      role: 'COUNSELLOR',
    },
  })

  const member = await prisma.user.upsert({
    where: { email: 'member@test.com' },
    update: {},
    create: {
      email: 'member@test.com',
      name: 'Community Member',
      password: hashedPassword,
      role: 'COMMUNITY_MEMBER',
    },
  })

  // Create organisations
  const victoriaMasjid = await prisma.organisation.upsert({
    where: { slug: 'victoria-masjid' },
    update: {},
    create: {
      name: 'Victoria Masjid & Community Centre',
      type: 'MASJID',
      slug: 'victoria-masjid',
      description: 'Serving the Muslim community of Burton since 2005',
      address: '123 Victoria Street',
      postcode: 'DE14 2LT',
      lat: 52.8067,
      lng: -1.6397,
      email: 'info@victoriamasjid.org.uk',
      phone: '01283 123456',
      verified: true,
    },
  })

  const eclecticHouse = await prisma.organisation.upsert({
    where: { slug: 'eclectic-house' },
    update: {},
    create: {
      name: 'Eclectic House',
      type: 'THERAPY_CENTRE',
      slug: 'eclectic-house',
      description: 'Islamic therapy and counselling services',
      address: '456 Therapy Lane',
      postcode: 'DE14 3AB',
      email: 'info@eclectichouse.com',
      phone: '01283 987654',
      verified: true,
    },
  })

  // Create events
  const event1 = await prisma.event.create({
    data: {
      title: 'Friday Halaqa: Understanding Surah Al-Kahf',
      slug: 'friday-halaqa-surah-al-kahf',
      description: 'Join Shaykh Ahmed for our weekly study circle exploring the stories and lessons from Surah Al-Kahf. Open discussion format with Q&A.',
      category: 'HALAQA',
      startDate: new Date('2026-02-21T19:30:00'),
      endDate: new Date('2026-02-21T21:00:00'),
      venue: 'Victoria Masjid Main Hall',
      isOnline: false,
      capacity: 100,
      entryType: 'FREE',
      audience: 'ALL',
      ageGroup: 'ALL_AGES',
      status: 'APPROVED',
      organisationId: victoriaMasjid.id,
      organiserId: masjidAdmin.id,
    },
  })

  const event2 = await prisma.event.create({
    data: {
      title: 'Community Iftar & Maghrib',
      slug: 'community-iftar-maghrib',
      description: 'Break your fast with the community. Dates and water followed by hot meal. Maghrib prayer in congregation. Families welcome.',
      category: 'IFTAR',
      startDate: new Date('2026-02-22T18:00:00'),
      endDate: new Date('2026-02-22T20:00:00'),
      venue: 'Victoria Masjid',
      isOnline: false,
      capacity: 200,
      entryType: 'FREE',
      audience: 'FAMILY',
      ageGroup: 'ALL_AGES',
      status: 'APPROVED',
      organisationId: victoriaMasjid.id,
      organiserId: masjidAdmin.id,
    },
  })

  // Create RSVPs
  await prisma.rSVP.create({
    data: {
      userId: member.id,
      eventId: event1.id,
      status: 'CONFIRMED',
    },
  })

  // Create counsellor profile
  await prisma.counsellorProfile.create({
    data: {
      userId: counsellor.id,
      specializations: JSON.stringify(['Depression', 'Anxiety', 'Islamic Counselling']),
      bio: 'Qualified Islamic counsellor with 10 years experience',
      hourlyRate: 50,
      availability: JSON.stringify({ monday: ['09:00-17:00'], tuesday: ['09:00-17:00'] }),
      verified: true,
    },
  })

  // Create room
  await prisma.room.create({
    data: {
      name: 'Counselling Room 1',
      capacity: 2,
      facilities: JSON.stringify(['Private', 'Soundproof', 'Comfortable seating']),
      organisationId: eclecticHouse.id,
    },
  })

  // Create course
  await prisma.course.create({
    data: {
      title: 'Introduction to Mindfulness',
      slug: 'intro-to-mindfulness',
      description: '8-week course on mindfulness and Islamic contemplation',
      duration: '8 weeks',
      schedule: 'Tuesdays 7-9pm',
      startDate: new Date('2026-03-01T19:00:00'),
      endDate: new Date('2026-04-26T21:00:00'),
      capacity: 15,
      price: 120,
      status: 'PUBLISHED',
      organisationId: eclecticHouse.id,
    },
  })

  console.log('✅ Database seeded successfully!')
  console.log('\n📧 Test accounts:')
  console.log('Admin: admin@platform.com / password123')
  console.log('Masjid: victoria@masjid.com / password123')
  console.log('Counsellor: counsellor@eclectic.com / password123')
  console.log('Member: member@test.com / password123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
