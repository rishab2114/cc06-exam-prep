import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthController } from './health.controller';

/**
 * Root module. Feature modules (auth, users, verification, catalog, tasks,
 * payments, webhooks, reviews, messaging, safety, disputes, notifications,
 * admin, jobs) are added here as they are implemented — see docs/07 for the
 * full module map. PrismaModule is global so feature services can inject it.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    // UsersModule, VerificationModule, CatalogModule, TasksModule,
    // PaymentsModule, WebhooksModule, ReviewsModule, MessagingModule,
    // SafetyModule, DisputesModule, NotificationsModule, AdminModule, JobsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
