import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiHeader,
  ApiOperation,
  ApiProduces,
  ApiResponse,
} from '@nestjs/swagger';
import { assertOwnerOrAdmin } from '../util/assert';
import { OnlyAllowGroups } from '../auth/groups.decorator';
import { GroupsGuard } from '../auth/groups.guard';
import { JwtAuthGuard } from '../auth/jwt.authguard';
import configuration, { RUNTIME_ENV } from '../config/configuration';
import {
  ActionLogActorType,
  ActionLogEntityType,
  Group,
  ListActionLogType,
} from '../config/enum';
import { DetailedLogger } from '../logger/detailed.logger';

import {
  ActionLogDetails,
  ListingDetails,
  ListingRequest,
  ListingResponse,
  ListActionLogsQuery,
  ListListingsQuery,
  ListSubmissionsQuery,
  ListVaultingsQuery,
  SubmissionDetails,
  SubmissionRequest,
  SubmissionResponse,
  VaultingDetails,
  VaultingRequest,
  VaultingResponse,
  VaultingUpdate,
  ListingUpdate,
  SubmissionOrderDetails,
  ListSubmissionOrdersQuery,
  SubmissionUpdate,
  SubmissionOrderUpdate,
} from './dtos/marketplace.dto';
import { MarketplaceService } from './marketplace.service';
import { assert } from 'console';

function InProd() {
  return 'prod' == process.env[RUNTIME_ENV];
}

function check_auth(request: any) {
  const should_check_auth =
    configuration()[process.env[RUNTIME_ENV]]['check_palantir_request_auth'];
  const auth =
    configuration()[process.env[RUNTIME_ENV]]['palantir_request_auth'];
  if (should_check_auth) {
    return request.auth == auth;
  } else {
    return true;
  }
}

@Controller('marketplace')
@UseInterceptors(ClassSerializerInterceptor)
export class MarketplaceController {
  private readonly logger = new DetailedLogger('MarketplaceController', {
    timestamp: true,
  });

  constructor(public marketplaceService: MarketplaceService) {}

  @Get('/health')
  @ApiOperation({
    summary: 'LB health check',
  })
  health() {
    return { status: 'ok' };
  }

  @Get('/submission/order/:submission_order_id')
  //@OnlyAllowGroups(Group.User, Group.Admin)
  //@UseGuards(JwtAuthGuard, GroupsGuard)
  @ApiOperation({
    summary: 'Get submission order by id',
  })
  @ApiResponse({
    status: 200,
    description: 'Submission order retrived',
    type: SubmissionDetails,
  })
  @ApiResponse({
    status: 404,
    description: 'Submission order not found',
  })
  @ApiProduces('application/json')
  async getSubmissionOrder(
    @Param('submission_order_id') submission_order_id: number,
    @Request() request: any,
  ): Promise<SubmissionOrderDetails> {
    const submissionDetails = await this.marketplaceService.getSubmissionOrder(
      submission_order_id,
    );
    //assertOwnerOrAdmin(request.user, submissionDetails, this.logger);
    return submissionDetails;
  }

  @Get('/submission/order')
  //@OnlyAllowGroups(Group.User, Group.Admin)
  //@UseGuards(JwtAuthGuard, GroupsGuard)
  @ApiOperation({
    summary: 'Get a list of submission orders from a user',
  })
  @ApiResponse({
    status: 200,
    description: "Returns a list of user's submission orders",
    type: SubmissionOrderDetails,
  })
  @ApiResponse({
    status: 500,
    description: "Can not retrieve user's submission orders",
  })
  @ApiProduces('application/json')
  async listSubmissionOrders(
    @Query() query: ListSubmissionOrdersQuery,
    @Request() request: any,
  ): Promise<SubmissionOrderDetails[]> {
    //assertOwnerOrAdmin(request.user, query, this.logger);
    //TODO: if user is not provided, return all submissions, but check if caller is admin
    const result = await this.marketplaceService.listSubmissionOrders(
      query.user,
      query.status,
      query.offset,
      query.limit,
      query.order,
    );
    return result;
  }

  @Put('/submission/order/:submission_order_id')
  //@OnlyAllowGroups(Group.User, Group.Admin)
  //@UseGuards(JwtAuthGuard, GroupsGuard)
  @ApiOperation({
    summary: 'Update submission order by id',
  })
  @ApiResponse({
    status: 200,
    description: 'Submission order updated',
    type: SubmissionDetails,
  })
  @ApiResponse({
    status: 404,
    description: 'Submission order not found',
  })
  @ApiProduces('application/json')
  async updateSubmissionOrder(
    @Param('submission_order_id') submission_order_id: number,
    @Body() body: SubmissionOrderUpdate,
  ): Promise<SubmissionOrderDetails> {
    const submissionDetails =
      await this.marketplaceService.updateSubmissionOrder(
        submission_order_id,
        body.status,
      );
    //assertOwnerOrAdmin(request.user, submissionDetails, this.logger);
    return submissionDetails;
  }

  @Get('/submission/:submission_id')
  //@OnlyAllowGroups(Group.User, Group.Admin)
  //@UseGuards(JwtAuthGuard, GroupsGuard)
  @ApiOperation({
    summary: 'Get submission by id',
  })
  @ApiResponse({
    status: 200,
    description: 'Submission retrived',
    type: SubmissionDetails,
  })
  @ApiResponse({
    status: 404,
    description: 'Submission not found',
  })
  @ApiProduces('application/json')
  async getSubmission(
    @Param('submission_id') submission_id: number,
    @Request() request: any,
  ): Promise<SubmissionDetails> {
    const submissionDetails = await this.marketplaceService.getSubmission(
      submission_id,
    );
    //assertOwnerOrAdmin(request.user, submissionDetails, this.logger);
    return submissionDetails;
  }

  @Put('/submission/:submission_id')
  //@OnlyAllowGroups(Group.Admin)
  //@UseGuards(JwtAuthGuard, GroupsGuard)
  @ApiOperation({
    summary: 'Update submission status by id (mainly used by admin)',
  })
  @ApiResponse({
    status: 200,
    description: 'Submission status updated',
    type: SubmissionDetails,
  })
  @ApiResponse({
    status: 404,
    description: 'Submission not found',
  })
  @ApiProduces('application/json')
  async updateSubmission(
    @Body() submissionUpdate: SubmissionUpdate,
    @Param('submission_id') submission_id: number,
  ): Promise<SubmissionDetails> {
    const submissionDetails = await this.marketplaceService.updateSubmission(
      submission_id,
      submissionUpdate,
    );
    return submissionDetails;
  }

  @Get('/submission')
  //@OnlyAllowGroups(Group.User, Group.Admin)
  //@UseGuards(JwtAuthGuard, GroupsGuard)
  @ApiOperation({
    summary: 'Get a list of submissions from a user',
  })
  @ApiResponse({
    status: 200,
    description: "Returns a list of user's submissions",
    type: SubmissionDetails,
  })
  @ApiResponse({
    status: 500,
    description: 'Can not retrieve the list of submissions',
  })
  @ApiProduces('application/json')
  async listSubmissions(
    @Query() query: ListSubmissionsQuery,
    @Request() request: any,
  ): Promise<SubmissionDetails[]> {
    //assertOwnerOrAdmin(request.user, query, this.logger);

    //TODO: if user is not provided, return all submissions, but check if caller is admin
    const result = await this.marketplaceService.listSubmissions(
      query.user,
      query.status,
      query.offset,
      query.limit,
      query.order,
    );
    return result;
  }

  @Post('/submission')
  //@OnlyAllowGroups(Group.User, Group.Admin)
  //@UseGuards(JwtAuthGuard, GroupsGuard)
  @ApiOperation({
    summary: 'Submit new item to marketplace',
  })
  @ApiResponse({
    status: 201,
    description: 'The item has been successfully submited.',
    type: SubmissionResponse,
  })
  @ApiResponse({
    status: 500,
    description: 'Submission of the item failed',
  })
  @ApiProduces('application/json')
  async submitItem(
    @Body() body: SubmissionRequest,
  ): Promise<SubmissionResponse> {
    const submissionResponse = await this.marketplaceService.submitItem(body);
    return submissionResponse;
  }

  @Post('/vaulting')
  @ApiOperation({
    summary: 'Store new vaulting records',
  })
  @ApiResponse({
    status: 201,
    description: 'The item has been successfully submited.',
    type: VaultingResponse,
  })
  @ApiResponse({
    status: 500,
    description: 'Submission of the item failed',
  })
  @ApiProduces('application/json')
  async vaultItem(@Body() body: VaultingRequest): Promise<VaultingResponse> {
    const submissionResponse = await this.marketplaceService.newVaulting(body);
    return submissionResponse;
  }

  // get vaulting by id
  @Get('/vaulting/:vaulting_id')
  @ApiOperation({
    summary: 'Get vaulting by id',
  })
  @ApiResponse({
    status: 200,
    description: 'Vaulting retrived',
    type: VaultingDetails,
  })
  @ApiResponse({
    status: 404,
    description: 'Vaulting not found',
  })
  @ApiProduces('application/json')
  async getVaulting(
    @Param('vaulting_id') vaulting_id: number,
  ): Promise<VaultingDetails> {
    const vaultingDetails = await this.marketplaceService.getVaulting(
      vaulting_id,
    );
    return vaultingDetails;
  }

  // get vaulting by id
  @Get('/vaulting/submission/:submission_id')
  @ApiOperation({
    summary: 'Get vaulting by submission id',
  })
  @ApiResponse({
    status: 200,
    description: 'Vaulting retrived',
    type: VaultingDetails,
  })
  @ApiResponse({
    status: 404,
    description: 'Submission not found',
  })
  @ApiProduces('application/json')
  async getVaultingBySubmissionID(
    @Param('submission_id') submission_id: number,
  ): Promise<VaultingDetails[]> {
    const vaultingDetails =
      await this.marketplaceService.getVaultingBySubmissionID(submission_id);
    // if no vaulting found, return null
    if (vaultingDetails == null) {
      return [];
    }
    return [vaultingDetails];
  }

  // get vaulting by user id
  @Get('/vaulting')
  @ApiOperation({
    summary: 'Get a list of vaultings from a user',
  })
  @ApiResponse({
    status: 200,
    description: 'Vaulting retrived',
    type: VaultingDetails,
  })
  @ApiResponse({
    status: 404,
    description: 'Vaulting not found',
  })
  @ApiProduces('application/json')
  async listVaultings(
    @Query() query: ListVaultingsQuery,
  ): Promise<VaultingDetails[]> {
    const vaultingDetails = await this.marketplaceService.listVaultings(
      query.user,
      query.offset,
      query.limit,
      query.order,
    );
    return vaultingDetails;
  }

  // withdraw vaulting by id
  @Delete('/vaulting/:vaulting_id')
  @ApiOperation({
    summary: 'Withdraw vaulting by id',
  })
  @ApiResponse({
    status: 200,
    description: 'Vaulting withdrawn',
    type: VaultingDetails,
  })
  @ApiResponse({
    status: 404,
    description: 'Vaulting not found',
  })
  @ApiProduces('application/json')
  async withdrawVaultings(
    @Param('vaulting_id') vaulting_id: number,
  ): Promise<VaultingDetails> {
    const vaultingDetails = await this.marketplaceService.withdrawVaulting(
      vaulting_id,
    );
    return vaultingDetails;
  }

  // update vaulting status id
  @Put('/vaulting')
  @ApiOperation({
    summary: 'Update vaulting record by id (callback for Bravo API)',
  })
  @ApiResponse({
    status: 200,
    description: 'Vaulting record updated',
    type: VaultingDetails,
  })
  @ApiResponse({
    status: 404,
    description: 'Vaulting not found',
  })
  @ApiProduces('application/json')
  async updateVaultings(
    @Body() body: VaultingUpdate,
  ): Promise<VaultingDetails> {
    const vaultingDetails = await this.marketplaceService.updateVaulting(body);
    return vaultingDetails;
  }

  @Get('/listing/:listing_id')
  @ApiOperation({
    summary: 'Get listing by id',
  })
  @ApiResponse({
    status: 200,
    description: 'Listing retrived',
    type: ListingDetails,
  })
  @ApiResponse({
    status: 404,
    description: 'Listing not found',
  })
  @ApiProduces('application/json')
  async getListing(
    @Param('listing_id') listing_id: number,
  ): Promise<ListingDetails> {
    const listingDetails = await this.marketplaceService.getListing(listing_id);
    return listingDetails;
  }

  @Get('/listing')
  @ApiOperation({
    summary: 'Get all listings for a given user',
  })
  @ApiResponse({
    status: 200,
    description: 'Listing retrived',
    type: ListingDetails,
  })
  @ApiResponse({
    status: 404,
    description: 'Listing not found',
  })
  @ApiProduces('application/json')
  async listListings(
    @Query() query: ListListingsQuery,
  ): Promise<ListingDetails[]> {
    const listingDetails = await this.marketplaceService.listListings(
      query.user,
      query.offset,
      query.limit,
      query.order,
    );
    return listingDetails;
  }

  @Post('/listing')
  @ApiOperation({
    summary: 'Create new listing for vaulted item',
  })
  @ApiResponse({
    status: 200,
    description: 'Listing created',
  })
  @ApiProduces('application/json')
  async createListing(@Body() body: ListingRequest): Promise<ListingResponse> {
    const listingDetails = await this.marketplaceService.newListing(body);
    return listingDetails;
  }

  @Get('/action/user/:uuid')
  @ApiOperation({
    summary:
      "Get a list of user's actions for all entities (submissions, listings, vaultings, etc)",
  })
  @ApiResponse({
    status: 200,
    description:
      'A list of user actions for all entities (submissions, listings, vaultings, etc)',
  })
  @ApiProduces('application/json')
  async listUserActionLogs(
    @Param('uuid') userUUID: string,
    @Query() query: ListActionLogsQuery,
  ): Promise<ActionLogDetails[]> {
    const user = await this.marketplaceService.getUserByUUID(userUUID);
    const actor = user.id.toString();

    const actionLogs = await this.marketplaceService.listActionLogs(
      ListActionLogType.Actor,
      ActionLogActorType.CognitoUser,
      actor,
      0,
      '',
      query.offset,
      query.limit,
      query.order,
    );
    return actionLogs;
  }

  @Put('/listing/:listing_id')
  @ApiOperation({
    summary: 'Update listing for vaulted item',
  })
  @ApiResponse({
    status: 200,
    description: 'Listing updated',
  })
  @ApiProduces('application/json')
  async updateListing(
    @Param('listing_id') listing_id: number,
    @Body() body: ListingUpdate,
  ): Promise<ListingDetails> {
    const listingDetails = await this.marketplaceService.updateListing(
      listing_id,
      body,
    );
    return listingDetails;
  }

  @Get('/action/:entity/:id')
  @ApiOperation({
    summary: 'Get a list of all user actions associated with an entity',
  })
  @ApiResponse({
    status: 200,
    description:
      'A list of all user actions associated with the specified entity (submissions, listings, vaultings, etc)',
    type: ActionLogDetails,
  })
  @ApiProduces('application/json')
  async listEntityActionLogs(
    @Param('entity') entity: string,
    @Param('id') id: string,
    @Query() query: ListActionLogsQuery,
  ): Promise<ActionLogDetails[]> {
    var entityType: number;
    switch (entity) {
      case 'submission':
        entityType = ActionLogEntityType.Submission;
        break;
      case 'listing':
        entityType = ActionLogEntityType.Listing;
        break;
      case 'vaulting':
        entityType = ActionLogEntityType.Vaulting;
        break;
      default:
        throw new BadRequestException(
          'Invalid entity type. Must be one of submission, listing, or vaulting',
        );
    }

    const actionLogs = await this.marketplaceService.listActionLogs(
      ListActionLogType.Entity,
      0,
      '',
      entityType,
      id,
      query.offset,
      query.limit,
      query.order,
    );
    return actionLogs;
  }
}
