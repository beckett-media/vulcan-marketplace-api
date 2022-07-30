import {
  Item,
  Submission,
  Vaulting,
  User,
  Listing,
  ActionLog,
} from '../database/database.entity';
import { Repository, getManager, In } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DetailedLogger } from '../logger/detailed.logger';
import {
  ActionLogRequest,
  ListingDetails,
  SubmissionDetails,
  SubmissionRequest,
  VaultingUpdate,
} from '../marketplace/dtos/marketplace.dto';
import {
  ItemStatus,
  ListActionLogType,
  ListingStatus,
  SubmissionStatus,
  VaultingStatus,
  VaultingUpdateType,
} from '../config/enum';
import { newListingDetails, newSubmissionDetails } from '../util/format';
import configuration, { RUNTIME_ENV } from '../config/configuration';
import { IsolationLevel } from 'typeorm/driver/types/IsolationLevel';

const DEFAULT_USER_SOURCE = 'cognito';
const INIT_COLLECTION = '';
const INIT_TOKEN_ID = 0;

@Injectable()
export class DatabaseService {
  private readonly logger = new DetailedLogger('DatabaseService', {
    timestamp: true,
  });
  private isolation = 'REPEATABLE READ' as IsolationLevel;

  constructor(
    @InjectRepository(Submission)
    private submissionRepo: Repository<Submission>,
    @InjectRepository(Item) private itemRepo: Repository<Item>,
    @InjectRepository(Vaulting) private vaultingRepo: Repository<Vaulting>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Listing) private listingRepo: Repository<Listing>,
    @InjectRepository(ActionLog) private actionLogRepo: Repository<ActionLog>,
  ) {
    // read isolation setting from configuration
    let env = process.env[RUNTIME_ENV];
    let config = configuration()[env];
    this.isolation = config['db']['isolation'];
  }

  async maybeCreateNewUser(user_uuid: string, source: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { uuid: user_uuid },
    });
    if (!user) {
      const newUser = this.userRepo.create({
        uuid: user_uuid,
        created_at: Math.round(Date.now() / 1000),
        source: source,
      });
      await this.userRepo.save(newUser);
      return newUser;
    }
    return user;
  }

  async createNewSubmission(
    submission: SubmissionRequest,
    imagePaths: [string, string],
  ) {
    var submission_id: number;
    var item_id: number;
    var uuid: string;
    var status: number;
    try {
      await getManager().transaction(
        this.isolation,
        async (transactionalEntityManager) => {
          const user = await this.maybeCreateNewUser(
            submission.user,
            DEFAULT_USER_SOURCE,
          );
          const newItem = this.itemRepo.create({
            uuid: uuidv4(),
            user: user.id,
            grading_company: submission.grading_company,
            serial_number: submission.serial_number,
            title: submission.title,
            description: submission.description,
            genre: submission.genre,
            manufacturer: submission.manufacturer,
            year: submission.year,
            overall_grade: submission.overall_grade,
            sub_grades: submission.sub_grades,
            autograph: submission.autograph,
            subject: submission.subject,
            est_value: submission.est_value,
            status: ItemStatus.Submitted,
          });
          const itemSaved = await this.itemRepo.save(newItem);
          item_id = itemSaved.id;
          uuid = itemSaved.uuid;
          const newSubmission = this.submissionRepo.create({
            user: user.id,
            item_id: itemSaved.id,
            status: SubmissionStatus.Submitted,
            image: imagePaths[0],
            image_rev: imagePaths[1],
            created_at: Math.round(Date.now() / 1000),
            received_at: 0,
            approved_at: 0,
            rejected_at: 0,
          });
          const submissionSaved = await this.submissionRepo.save(newSubmission);
          submission_id = submissionSaved.id;
        },
      );
    } catch (error) {
      status = SubmissionStatus.Failed;
      this.logger.error(error);
    }
    status = SubmissionStatus.Submitted;

    return {
      submission_id: submission_id,
      item_id: item_id,
      uuid: uuid,
      status: status,
    };
  }

  async listSubmissions(
    userUUID: string,
    status: number,
    offset: number,
    limit: number,
    order: string,
  ): Promise<SubmissionDetails[]> {
    var where_filter = {};
    if (userUUID !== undefined) {
      // find user by uuid
      const user = await this.userRepo.findOne({
        where: { uuid: userUUID },
      });
      if (!user) {
        throw new NotFoundException(`User ${userUUID} not found`);
      }
      where_filter = { user: user.id };
    }

    if (status !== undefined) {
      where_filter['status'] = status;
    }
    if (offset == undefined) {
      offset = 0;
    }
    var filter = {
      where: where_filter,
      skip: offset,
    };
    if (limit != undefined) {
      filter['take'] = limit;
    }

    // order by id
    if (!!order) {
      filter['order'] = { id: order };
    }

    const submissions = await this.submissionRepo.find(filter);
    // get all item ids from submissions
    const item_ids = submissions.map((submission) => submission.item_id);
    // get all items from item_ids
    const items = await this.itemRepo.find({
      where: { id: In(item_ids) },
    });
    // build a map of item_id to item
    const itemMap = new Map<number, Item>();
    items.forEach((item) => {
      itemMap.set(item.id, item);
    });

    // get all user ids from items
    const user_ids = items.map((item) => item.user);
    // get all users from user_ids
    const users = await this.userRepo.find({
      where: { id: In(user_ids) },
    });
    // build a map of user_id to user
    const userMap = new Map<number, User>();
    users.forEach((user) => {
      userMap.set(user.id, user);
    });

    var submissionDetails: SubmissionDetails[] = [];
    submissions.forEach((submission) => {
      const item = itemMap.get(submission.item_id);
      const user = userMap.get(item.user);
      submissionDetails.push(newSubmissionDetails(submission, item, user));
    });

    return submissionDetails;
  }

  async getSubmission(submission_id: number): Promise<Submission> {
    const submission = await this.submissionRepo.findOne(submission_id);
    // if we can not find submission, throw not found error
    if (!submission) {
      throw new NotFoundException('Submission not found');
    }
    return submission;
  }

  async updateSubmission(submission_id: number, status: number) {
    const submission = await this.submissionRepo.findOne(submission_id);
    if (!submission) {
      throw new NotFoundException(`Submission ${submission_id} not found`);
    }

    submission.status = status;
    switch (status) {
      case SubmissionStatus.Received:
        submission.received_at = Math.round(Date.now() / 1000);
        break;
      case SubmissionStatus.Approved:
        submission.approved_at = Math.round(Date.now() / 1000);
        break;
      case SubmissionStatus.Rejected:
        submission.rejected_at = Math.round(Date.now() / 1000);
        break;
    }

    await this.submissionRepo.save(submission);
    return submission;
  }

  // list items by item ids
  async listItems(item_ids: number[]): Promise<Item[]> {
    const items = await this.itemRepo.find({
      where: { id: In(item_ids) },
    });
    return items;
  }

  async getItem(item_id: number): Promise<Item> {
    const item = await this.itemRepo.findOne(item_id);
    if (!item) {
      throw new NotFoundException('Item not found');
    }
    return item;
  }

  // list users by user ids
  async listUsers(user_ids: number[]): Promise<User[]> {
    const users = await this.userRepo.find({
      where: { id: In(user_ids) },
    });
    return users;
  }

  // get user by id
  async getUser(user_id: number): Promise<User> {
    const user = await this.userRepo.findOne(user_id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  // get user by uuid
  async getUserByUUID(user_uuid: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { uuid: user_uuid },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  // create new vaulting item
  async createNewVaulting(
    user: number,
    item_id: number,
    mint_job_id: number,
    s3url: string,
  ): Promise<Vaulting> {
    var vaulting: Vaulting;
    try {
      await getManager().transaction(
        'SERIALIZABLE',
        async (transactionalEntityManager) => {
          const newVaulting = this.vaultingRepo.create({
            user: user,
            item_id: item_id,
            mint_job_id: mint_job_id,
            mint_tx_hash: '',
            burn_job_id: 0,
            burn_tx_hash: '',
            chain_id: 0,
            collection: INIT_COLLECTION,
            token_id: INIT_TOKEN_ID,
            status: VaultingStatus.Minting,
            image: s3url,
            minted_at: 0,
            burned_at: 0,
            updated_at: Math.round(Date.now() / 1000),
            created_at: Math.round(Date.now() / 1000),
          });
          vaulting = await this.vaultingRepo.save(newVaulting);
        },
      );
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error);
    }
    return vaulting;
  }

  // list vaulting items by user id
  async listVaultings(
    userUUID: string,
    offset: number,
    limit: number,
    order: string,
  ): Promise<Vaulting[]> {
    var where_filter = {};
    if (userUUID !== undefined) {
      // find user by uuid
      const user = await this.userRepo.findOne({
        where: { uuid: userUUID },
      });
      if (!user) {
        throw new NotFoundException(`User ${userUUID} not found`);
      }
      where_filter = { user: user.id };
    }

    if (offset == undefined) {
      offset = 0;
    }
    var filter = {
      where: where_filter,
      skip: offset,
    };
    if (limit != undefined) {
      filter['take'] = limit;
    }

    // order by id
    if (!!order) {
      filter['order'] = { id: order };
    }

    const vaultings = await this.vaultingRepo.find(filter);
    return vaultings;
  }

  async getVaulting(vaulting_id: number): Promise<Vaulting> {
    const vaulting = await this.vaultingRepo.findOne(vaulting_id);
    if (!vaulting) {
      throw new NotFoundException('Vaulting not found');
    }
    return vaulting;
  }

  // get vaulting by item uuid
  async getVaultingByItemUUID(item_uuid: string): Promise<Vaulting> {
    // get item by uuid
    const item = await this.itemRepo.findOne({
      where: { uuid: item_uuid },
    });
    if (!item) {
      throw new NotFoundException(`Item ${item_uuid} not found`);
    }
    const vaulting = await this.vaultingRepo.findOne({
      where: { item_id: item.id },
    });
    if (!vaulting) {
      throw new NotFoundException(`Vaulting not found for item ${item.id}`);
    }
    return vaulting;
  }

  // get vaulting by item id
  async getVaultingByItemID(item_id: number): Promise<Vaulting> {
    const vaulting = await this.vaultingRepo.findOne({
      where: { item_id: item_id },
    });
    if (!vaulting) {
      throw new NotFoundException(`Vaulting not found for item ${item_id}`);
    }
    return vaulting;
  }

  async getVaultingBySubmissionID(submission_id: number): Promise<Vaulting> {
    const submission = await this.submissionRepo.findOne(submission_id);
    if (!submission) {
      throw new NotFoundException(`Submission not found for ${submission_id}`);
    }
    const vaulting = await this.vaultingRepo.findOne({
      where: { item_id: submission.item_id },
    });
    return vaulting;
  }

  async updateVaulting(vaultingUpdate: VaultingUpdate): Promise<Vaulting> {
    const vaulting = await this.getVaultingByItemUUID(vaultingUpdate.item_uuid);
    if (!vaulting) {
      throw new NotFoundException(
        `Vaulting not found for item ${vaultingUpdate.item_uuid}`,
      );
    }

    // if we don't have collection, update the whole vaulting object
    // otherwise update only the status
    var newVaulting = {};
    switch (vaultingUpdate.type) {
      case VaultingUpdateType.Minted:
        newVaulting = {
          chain_id: vaultingUpdate.chain_id,
          collection: vaultingUpdate.collection,
          token_id: vaultingUpdate.token_id,
          mint_tx_hash: vaultingUpdate.mint_tx_hash,
          minted_at: Math.round(Date.now() / 1000),
          status: VaultingStatus.Minted,
          updated_at: Math.round(Date.now() / 1000),
        };

        if (vaultingUpdate.status == VaultingStatus.Withdrawn) {
          newVaulting['burned_at'] = Math.round(Date.now() / 1000);
        }

        Object.assign(vaulting, newVaulting);
        break;
      case VaultingUpdateType.Burned:
        newVaulting = {
          burn_tx_hash: vaultingUpdate.burn_tx_hash,
          burned_at: Math.round(Date.now() / 1000),
          status: VaultingStatus.Withdrawn,
          updated_at: Math.round(Date.now() / 1000),
        };

        Object.assign(vaulting, newVaulting);
        break;
      case VaultingUpdateType.ToBurn:
        newVaulting = {
          burn_job_id: vaultingUpdate.burn_job_id,
          status: VaultingStatus.Withdrawing,
          updated_at: Math.round(Date.now() / 1000),
        };
        Object.assign(vaulting, newVaulting);
        break;
    }

    await this.vaultingRepo.save(vaulting);
    return vaulting;
  }

  // get listing by id
  async getListing(listing_id: number): Promise<Listing> {
    const listing = await this.listingRepo.findOne(listing_id);
    if (!listing) {
      throw new NotFoundException(`Listing ${listing_id} not found`);
    }
    return listing;
  }

  // get listing by vaulting id
  async getListingByVaultingID(vaulting_id: number): Promise<Listing> {
    const vaulting = await this.getVaulting(vaulting_id);
    if (!vaulting) {
      throw new NotFoundException(`Vaulting ${vaulting_id} not found`);
    }
    const listing = await this.listingRepo.findOne({
      where: { vaulting_id: vaulting.id },
    });
    return listing;
  }

  // create new listing
  async createNewListing(
    user: number,
    vaulting_id: number,
    price: number,
  ): Promise<Listing> {
    var listing: Listing;
    try {
      await getManager().transaction(
        'SERIALIZABLE',
        async (transactionalEntityManager) => {
          const newListing = this.listingRepo.create({
            user: user,
            vaulting_id: vaulting_id,
            price: price,
            status: ListingStatus.Listed,
            created_at: Math.round(Date.now() / 1000),
            updated_at: Math.round(Date.now() / 1000),
          });
          listing = await this.listingRepo.save(newListing);
        },
      );
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error);
    }
    return listing;
  }

  // update listing
  async updateListing(listing_id: number, price: number): Promise<Listing> {
    const listing = await this.getListing(listing_id);
    if (!listing || listing.status != ListingStatus.Listed) {
      throw new NotFoundException(`Listing ${listing_id} not found`);
    }

    let newListing = {
      price: price,
      updated_at: Math.round(Date.now() / 1000),
    };

    Object.assign(listing, newListing);

    await this.listingRepo.save(listing);
    return listing;
  }

  async listListings(
    userUUID: string,
    offset: number,
    limit: number,
    order: string,
  ): Promise<ListingDetails[]> {
    var where_filter = {};
    if (userUUID !== undefined) {
      // find user by uuid
      const user = await this.userRepo.findOne({
        where: { uuid: userUUID },
      });
      if (!user) {
        throw new NotFoundException(`User ${userUUID} not found`);
      }
      where_filter = { user: user.id };
    }

    if (offset == undefined) {
      offset = 0;
    }
    var filter = {
      where: where_filter,
      skip: offset,
    };
    if (limit != undefined) {
      filter['take'] = limit;
    }

    // order by id
    if (!!order) {
      filter['order'] = { id: order };
    }

    const listings = await this.listingRepo.find(filter);

    // get all vaulting ids from listings
    const vaulting_ids = listings.map((listing) => listing.vaulting_id);
    // get all vaulting from vaulting_ids
    const vaultings = await this.vaultingRepo.find({
      where: { id: In(vaulting_ids) },
    });
    // build a map of item_id to item
    const vaultingMap = new Map<number, Vaulting>();
    vaultings.forEach((vaulting) => {
      vaultingMap.set(vaulting.id, vaulting);
    });

    // get all item ids from submissions
    const item_ids = vaultings.map((vaulting) => vaulting.item_id);
    // get all items from item_ids
    const items = await this.itemRepo.find({
      where: { id: In(item_ids) },
    });
    // build a map of item_id to item
    const itemMap = new Map<number, Item>();
    items.forEach((item) => {
      itemMap.set(item.id, item);
    });

    // get all user ids from listings
    const user_ids = listings.map((listing) => listing.user);
    // get all users from user_ids
    const users = await this.userRepo.find({
      where: { id: In(user_ids) },
    });
    // build a map of user_id to user
    const userMap = new Map<number, User>();
    users.forEach((user) => {
      userMap.set(user.id, user);
    });

    var listingDetails: ListingDetails[] = [];
    listings.forEach((listing) => {
      const vaulting = vaultingMap.get(listing.vaulting_id);
      const item = itemMap.get(listing.vaulting_id);
      const user = userMap.get(listing.user);
      listingDetails.push(newListingDetails(listing, item, user, vaulting));
    });

    return listingDetails;
  }

  // create new action log
  async createNewActionLog(request: ActionLogRequest): Promise<ActionLog> {
    var actionLog: ActionLog;
    try {
      await getManager().transaction(
        'SERIALIZABLE',
        async (transactionalEntityManager) => {
          const newActionLog = this.actionLogRepo.create({
            type: request.type,
            actor_type: request.actor_type,
            actor: request.actor,
            entity_type: request.entity_type,
            entity: request.entity,
            created_at: Math.round(Date.now() / 1000),
            extra: request.extra,
          });
          actionLog = await this.actionLogRepo.save(newActionLog);
        },
      );
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error);
    }
    return actionLog;
  }

  // list action logs for user
  async listActionLogs(
    listType: number,
    actor: string,
    actor_type: number,
    entity: string,
    entity_type: number,
    offset: number,
    limit: number,
    order: string,
  ): Promise<ActionLog[]> {
    var where_filter = {};
    switch (listType) {
      case ListActionLogType.Actor:
        where_filter = { actor: actor, actor_type: actor_type };
        break;
      case ListActionLogType.Entity:
        where_filter = { entity: entity, entity_type: entity_type };
        break;
      case ListActionLogType.ActorAndEntity:
        where_filter = {
          actor: actor,
          entity: entity,
          actor_type: actor_type,
          entity_type: entity_type,
        };
        break;
    }

    if (offset == undefined) {
      offset = 0;
    }
    var filter = {
      where: where_filter,
      skip: offset,
    };
    if (limit != undefined) {
      filter['take'] = limit;
    }
    // order by id
    if (!!order) {
      filter['order'] = { id: order };
    }

    const actionLogs = await this.actionLogRepo.find(filter);

    // find all users for action logs
    const userIds = actionLogs.map((actionLog) => Number(actionLog.actor));
    // remove NaN from userIds
    userIds.forEach((userId, index) => {
      if (isNaN(userId)) {
        userIds.splice(index, 1);
      }
    });
    const users = await this.userRepo.find({
      where: { id: In(userIds) },
    });
    // build a map of user_id to user
    const userMap = new Map<string, string>();
    users.forEach((user) => {
      userMap.set(user.id.toString(), user.uuid);
    });
    // replace actor with user_uuid in action logs
    actionLogs.forEach((actionLog) => {
      const uuid = userMap.get(actionLog.actor);
      if (uuid) {
        actionLog.actor = uuid;
      }
    });

    return actionLogs;
  }
}
