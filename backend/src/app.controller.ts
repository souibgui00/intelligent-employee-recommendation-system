import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
<<<<<<< HEAD
  constructor(private readonly appService: AppService) {}
=======
  constructor(private readonly appService: AppService) { }
>>>>>>> feature/participation-history-tracking

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
