const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🦷 Seeding database...');

  // Create default dentist user
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const dentist = await prisma.user.upsert({
    where: { email: 'dentiste@cabinet.com' },
    update: {},
    create: {
      email: 'dentiste@cabinet.com',
      password: hashedPassword,
      firstName: 'Dr.',
      lastName: 'Dentiste',
      role: 'DENTIST'
    }
  });
  console.log('✅ Created dentist user:', dentist.email);

  // Create default secretary user
  const secretary = await prisma.user.upsert({
    where: { email: 'secretaire@cabinet.com' },
    update: {},
    create: {
      email: 'secretaire@cabinet.com',
      password: hashedPassword,
      firstName: 'Marie',
      lastName: 'Secrétaire',
      role: 'SECRETARY'
    }
  });
  console.log('✅ Created secretary user:', secretary.email);

  // Create default treatment types
  const treatmentTypes = [
    'Consultation',
    'Détartrage',
    'Extraction simple',
    'Extraction chirurgicale',
    'Obturation (plombage)',
    'Couronne',
    'Bridge',
    'Implant',
    'Traitement de canal',
    'Blanchiment',
    'Orthodontie',
    'Radiographie',
    'Autre'
  ];

  for (const name of treatmentTypes) {
    await prisma.treatmentType.upsert({
      where: { name },
      update: {},
      create: { name, isCustom: false }
    });
  }
  console.log('✅ Created treatment types');

  // Create default appointment types
  const appointmentTypes = [
    { name: 'Consultation', color: '#3B82F6' },
    { name: 'Détartrage', color: '#10B981' },
    { name: 'Soin', color: '#F59E0B' },
    { name: 'Extraction', color: '#EF4444' },
    { name: 'Contrôle', color: '#8B5CF6' },
    { name: 'Urgence', color: '#DC2626' },
    { name: 'Autre', color: '#6B7280' }
  ];

  for (const type of appointmentTypes) {
    await prisma.appointmentType.upsert({
      where: { name: type.name },
      update: {},
      create: { ...type, isCustom: false }
    });
  }
  console.log('✅ Created appointment types');

  // Create default cabinet settings
  await prisma.cabinetSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      workingHours: JSON.stringify({ start: '08:00', end: '18:00' }),
      workingDays: JSON.stringify([1, 2, 3, 4, 5, 6]) // Mon-Sat
    }
  });
  console.log('✅ Created default settings');

  console.log('');
  console.log('🎉 Database seeded successfully!');
  console.log('');
  console.log('Default credentials:');
  console.log('  Dentiste: dentiste@cabinet.com / admin123');
  console.log('  Secrétaire: secretaire@cabinet.com / admin123');
  console.log('');
  console.log('⚠️  Please change these passwords after first login!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

