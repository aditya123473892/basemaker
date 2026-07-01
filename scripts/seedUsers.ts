import { UserService } from '../src/services/userService';
import { UserRepository } from '../src/repositories/user/UserRepository';
import * as bcrypt from 'bcryptjs';

async function seedUsers() {
  const userRepository = new UserRepository();
  const userService = new UserService(userRepository);

  try {
    console.log('🌱 Seeding users...');

    // Create sample users for the demo company
    const sampleUsers = [
      {
        companyId: '550e8400-e29b-41d4-a716-446655440000', // Use the same company ID as auth system
        email: 'admin@example.com',
        fullName: 'John Admin',
        password: 'admin123',
        role: 'ADMIN'
      },
      {
        companyId: '550e8400-e29b-41d4-a716-446655440000',
        email: 'manager@example.com',
        fullName: 'Sarah Manager',
        password: 'manager123',
        role: 'MANAGER'
      },
      {
        companyId: '550e8400-e29b-41d4-a716-446655440000',
        email: 'user1@example.com',
        fullName: 'Mike Johnson',
        password: 'user123',
        role: 'USER'
      },
      {
        companyId: '550e8400-e29b-41d4-a716-446655440000',
        email: 'user2@example.com',
        fullName: 'Emily Davis',
        password: 'user123',
        role: 'USER'
      },
      {
        companyId: '550e8400-e29b-41d4-a716-446655440000',
        email: 'owner@example.com',
        fullName: 'Robert Owner',
        password: 'owner123',
        role: 'OWNER'
      }
    ];

    for (const userData of sampleUsers) {
      try {
        await userService.createUser(userData);
        console.log(`✅ Created user: ${userData.email}`);
      } catch (error) {
        console.log(`⚠️  User ${userData.email} may already exist:`, error.message);
      }
    }

    console.log('🎉 User seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding users:', error);
  }
}

// Run the seed function
seedUsers().then(() => {
  console.log('Seed script finished');
  process.exit(0);
}).catch((error) => {
  console.error('Seed script failed:', error);
  process.exit(1);
});
