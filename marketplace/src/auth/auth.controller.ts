import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Request,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { BadRequestException, Body, Post } from '@nestjs/common';
import { ApiOperation, ApiProduces, ApiResponse } from '@nestjs/swagger';
import { Group } from 'src/config/enum';
import { AuthService } from './auth.service';
import { AuthenticationRequest } from './dtos/auth.dto';
import { OnlyAllowGroups } from './groups.decorator';
import { GroupsGuard } from './groups.guard';
import { JwtAuthGuard } from './jwt.authguard';

@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'To get JWT token for test',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns JWT token',
  })
  @ApiProduces('application/json')
  async login(@Body() authenticationRequest: AuthenticationRequest) {
    try {
      return await this.authService.authenticateUser(authenticationRequest);
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  @Get('admin')
  @OnlyAllowGroups(Group.Admin)
  @UseGuards(JwtAuthGuard, GroupsGuard)
  @ApiOperation({
    summary: 'Test if admin oauth token works',
  })
  @ApiResponse({
    status: 200,
    description: 'Oauth token works',
  })
  @ApiProduces('application/json')
  async onlyAdmin(@Request() request: any) {
    return {
      message: 'Only admin can see this',
      user: request.user['user'],
      groups: request.user['groups'],
    };
  }

  @Get('user')
  @OnlyAllowGroups(Group.User)
  @UseGuards(JwtAuthGuard, GroupsGuard)
  @ApiOperation({
    summary: 'Test if user oauth token works',
  })
  @ApiResponse({
    status: 200,
    description: 'Oauth token works',
  })
  @ApiProduces('application/json')
  async onlyUser(@Request() request: any) {
    return {
      message: 'Only user can see this',
      user: request.user['user'],
      groups: request.user['groups'],
    };
  }
}
