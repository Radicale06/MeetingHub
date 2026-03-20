import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

const SEED_USERS = [
  {
    email: 'superadmin@example.com',
    password: 'password123',
    app_metadata: { roleId: 1 }, // SUPERADMIN
  },
  {
    email: 'admin@example.com',
    password: 'password123',
    app_metadata: { roleId: 2 }, // ADMIN
  },
  {
    email: 'user@example.com',
    password: 'password123',
    app_metadata: { roleId: 3 }, // USER
  },
];

async function seed() {
  console.log('Seeding Supabase users...');

  for (const userData of SEED_USERS) {
    // Check if user already exists by listing users and finding by email
    const { data: existing } = await supabase.auth.admin.listUsers();
    const alreadyExists = existing?.users?.some(
      (u) => u.email === userData.email,
    );

    if (alreadyExists) {
      console.log(`  → Skipping ${userData.email} (already exists)`);
      continue;
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      app_metadata: userData.app_metadata,
    });

    if (error) {
      console.error(`  ✗ Failed to create ${userData.email}:`, error.message);
    } else {
      console.log(
        `  ✓ Created ${data.user.email} (roleId: ${userData.app_metadata.roleId})`,
      );
    }
  }

  console.log('Done.');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
