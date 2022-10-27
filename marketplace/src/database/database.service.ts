import {
  Item,
  Submission,
  Vaulting,
  User,
  Listing,
  ActionLog,
  Inventory,
  SubmissionOrder,
} from '../database/database.entity';
import {
  Repository,
  getManager,
  In,
  Not,
  getConnection,
  EntityManager,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

import {
  BadRequestException,
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
  SubmissionOrderDetails,
  SubmissionRequest,
  VaultingUpdate,
} from '../marketplace/dtos/marketplace.dto';
import {
  ActionLogActorType,
  ActionLogEntityType,
  ActionLogType,
  InventoryStatus,
  ItemStatus,
  ListActionLogType,
  ListingStatus,
  SubmissionOrderStatus,
  SubmissionStatus,
  SubmissionUpdateType,
  VaultingStatus,
  VaultingUpdateType,
} from '../config/enum';
import {
  getInventoryLabel,
  newListingDetails,
  newSubmissionDetails,
  newSubmissionOrderDetails,
  trimInventoryLocation,
} from '../util/format';
import configuration, { RUNTIME_ENV } from '../config/configuration';
import { IsolationLevel } from 'typeorm/driver/types/IsolationLevel';
import {
  InventoryLocation,
  InventoryRequest,
  ListInventoryRequest,
  UpdateInventoryRequest,
} from '../inventory/dtos/inventory.dto';
import { sleep } from '../util/time';

export const DEFAULT_USER_SOURCE = 'cognito';
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
    @InjectRepository(Inventory) private inventoryRepo: Repository<Inventory>,
    @InjectRepository(SubmissionOrder)
    private submissionOrderRepo: Repository<SubmissionOrder>,
  ) {
    // read isolation setting from configuration
    let env = process.env[RUNTIME_ENV];
    let config = configuration()[env];
    this.isolation = config['db']['isolation'];
  }

  async getColumnNames(column: string): Promise<string[]> {
    const columns = await getConnection()
      .getMetadata(column)
      .columns.map((column) => column.propertyName);
    return columns;
  }

  async maybeCreateNewUser(user_uuid: string, source: string): Promise<User> {
    const maxTries = 10;
    var currentTry = 0;
    var tryTransaction = true;

    var user = null;
    while (tryTransaction) {
      currentTry++;
      try {
        user = await this.newUserWithLock(user_uuid, source);
      } catch (e) {
        this.logger.warn(`User with lock: ${e}`);
      }
      if (null !== user) {
        tryTransaction = false; // transaction succeeded
      }

      if (currentTry >= maxTries) {
        throw new Error('Deadlock on maybeCreateNewUser found.');
      }
    }

    return user;
  }

  async newUserWithLock(user_uuid: string, source: string): Promise<User> {
    return getManager().transaction(
      (entityManager: EntityManager): Promise<User> => {
        return entityManager
          .createQueryBuilder(User, 'user')
          .setLock('pessimistic_read')
          .where({ uuid: user_uuid })
          .getOne()
          .then(async (result) => {
            const env = process.env[RUNTIME_ENV];
            const config = configuration()[env];
            const userPoolId = config['cognito']['COGNITO_USER_POOL_ID'];
            var user = result;
            if (undefined === user) {
              user = new User();
              user.uuid = user_uuid;
              user.source = source;
              user.source_id = userPoolId;
              user.created_at = Math.round(Date.now() / 1000);
              return await entityManager.save(user);
            }
            return user;
          });
      },
    );
  }

  async maybeCreateSubmissionOrder(
    user: number,
    uuid: string,
  ): Promise<SubmissionOrder> {
    const maxTries = 10;
    var currentTry = 0;
    var tryTransaction = true;

    var submissionOrder = null;
    while (tryTransaction) {
      currentTry++;
      try {
        submissionOrder = await this.newSubmissionOrderWithLock(user, uuid);
      } catch (e) {
        this.logger.warn(`Submission order with lock: ${e}`);
      }
      if (null !== submissionOrder) {
        tryTransaction = false; // transaction succeeded
      }

      if (currentTry >= maxTries) {
        throw new Error('Deadlock on maybeCreateSubmissionOrder found.');
      }
    }

    return submissionOrder;
  }

  async newSubmissionOrderWithLock(
    user: number,
    uuid: string,
  ): Promise<SubmissionOrder> {
    return getManager().transaction(
      (entityManager: EntityManager): Promise<SubmissionOrder> => {
        return entityManager
          .createQueryBuilder(SubmissionOrder, 'order')
          .setLock('pessimistic_read')
          .where({ uuid: uuid })
          .getOne()
          .then(async (result) => {
            var submissionOrder = result;
            if (undefined === submissionOrder) {
              submissionOrder = new SubmissionOrder();
              submissionOrder.user = user;
              submissionOrder.uuid = uuid;
              submissionOrder.status = SubmissionOrderStatus.Created;
              submissionOrder.created_at = Math.round(Date.now() / 1000);
              return await entityManager.save(submissionOrder);
            }
            return submissionOrder;
          });
      },
    );
  }

  async discardSubmissionOrder(order_id: number) {
    // get submissions by order id
    const submissions = await this.getSubmissionsByOrder(order_id);

    // discard each submission
    for (let submission of submissions) {
      submission.status = SubmissionStatus.Failed;
      submission.updated_at = Math.round(Date.now() / 1000);
      await this.submissionRepo.save(submission);
    }

    // discard order
    const order = await this.submissionOrderRepo.findOne(order_id);
    order.status = SubmissionOrderStatus.Discarded;
    order.updated_at = Math.round(Date.now() / 1000);
    await this.submissionOrderRepo.save(order);
  }

  async getSubmissionsByOrder(order_id: number): Promise<Submission[]> {
    var where_filter = { order_id: order_id };
    var filter = {
      where: where_filter,
    };
    const submissions = await this.submissionRepo.find(filter);
    return submissions;
  }

  async createNewSubmission(
    submission: SubmissionRequest,
    user: User,
    submissionOrder: SubmissionOrder,
    imagePaths: [string, string],
  ) {
    var submission_id: number;
    var item_id: number;
    var uuid: string;
    var status: number;
    var order_id: number;
    try {
      order_id = submissionOrder.id;
      const newItem = this.itemRepo.create({
        uuid: uuidv4(),
        user: user.id,
        type: submission.type,
        issue: submission.issue,
        publisher: submission.publisher,
        player: submission.player,
        sport: submission.sport,
        set_name: submission.set_name,
        card_number: submission.card_number,
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
        order_id: submissionOrder.id,
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
    } catch (error) {
      status = SubmissionStatus.Failed;
      this.logger.error(error);
      throw new InternalServerErrorException(error);
    }
    status = SubmissionStatus.Submitted;

    return {
      submission_id: submission_id,
      item_id: item_id,
      uuid: uuid,
      status: status,
      order_id: order_id,
    };
  }

  async listSubmissions(
    userUUID: string,
    userUUIDs: string[],
    ids: number[],
    order_ids: number[],
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
      where_filter['user'] = user.id;
    }

    if (userUUIDs !== undefined) {
      // find users by uuids
      const users = await this.userRepo.find({
        where: { uuid: In(userUUIDs) },
      });
      if (!users) {
        throw new NotFoundException(`Users ${userUUIDs} not found`);
      }
      where_filter['user'] = In(users.map((user) => user.id));
    }

    // specify ids
    if (ids !== undefined) {
      where_filter['id'] = In(ids);
    }

    // specify order ids
    if (order_ids !== undefined) {
      where_filter['order_id'] = In(order_ids);
    }

    // by default, set status filter to be <not failed>
    where_filter['status'] = Not(SubmissionStatus.Failed);
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

    // get all user ids from submissions
    const user_ids = submissions.map((submission) => submission.user);
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

  // list submissions by item ids
  async listSubmissionsByItemIds(item_ids: number[]): Promise<Submission[]> {
    const submissions = await this.submissionRepo.find({
      where: { item_id: In(item_ids) },
    });
    return submissions;
  }

  async getSubmission(submission_id: number): Promise<Submission> {
    const submission = await this.submissionRepo.findOne(submission_id);
    // if we can not find submission, throw not found error
    if (!submission) {
      throw new NotFoundException(
        `Submission not found for id: ${submission_id}`,
      );
    }
    return submission;
  }

  async getSubmissionByItemUUID(uuid: string): Promise<Submission> {
    // find item by uuid
    const item = await this.itemRepo.findOne({
      where: { uuid: uuid },
    });
    if (!item) {
      throw new NotFoundException(`Item ${uuid} not found`);
    }
    const submission = await this.submissionRepo.findOne({
      where: { item_id: item.id },
    });
    // if we can not find submission, throw not found error
    if (!submission) {
      throw new NotFoundException(
        `Submission not found for item id: ${item.id}`,
      );
    }
    return submission;
  }

  async getSubmissionByItem(item_id: number): Promise<Submission> {
    const submission = await this.submissionRepo.findOne({
      where: { item_id: item_id },
    });
    // if we can not find submission, throw not found error
    if (!submission) {
      throw new NotFoundException(
        `Submission not found for item id: ${item_id}`,
      );
    }
    return submission;
  }

  async updateSubmission(submission: Submission, item: Item) {
    submission.updated_at = Math.round(Date.now() / 1000);
    const updatedSubmission = await this.submissionRepo.save(submission);
    if (!!item) {
      await this.itemRepo.save(item);
    }
    return updatedSubmission;
  }

  async updateSubmissionOrder(
    order_id: number,
    status: number,
  ): Promise<SubmissionOrder> {
    const submissionOrder = await this.submissionOrderRepo.findOne(order_id);
    if (!submissionOrder) {
      throw new NotFoundException(`Submission order ${order_id} not found`);
    }
    submissionOrder.status = status;
    submissionOrder.updated_at = Math.round(Date.now() / 1000);
    await this.submissionOrderRepo.save(submissionOrder);
    return submissionOrder;
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
      throw new NotFoundException(`Item ${item_id} not found`);
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

  // list users by user uuids
  async listUsersByUUID(user_uuids: string[]): Promise<User[]> {
    const users = await this.userRepo.find({
      where: { uuid: In(user_uuids) },
    });
    return users;
  }

  // get user by id
  async getUser(user_id: number): Promise<User> {
    const user = await this.userRepo.findOne(user_id);
    if (!user) {
      throw new NotFoundException(`User ${user_id} not found`);
    }
    return user;
  }

  // get user by uuid
  async getUserByUUID(user_uuid: string): Promise<User> {
    var user = await this.userRepo.findOne({
      where: { uuid: user_uuid },
    });
    if (!user) {
      user = await this.maybeCreateNewUser(user_uuid, DEFAULT_USER_SOURCE);
    }
    return user;
  }

  // create new vaulting item
  async maybeCreateNewVaulting(
    user: number,
    item_id: number,
    mint_job_id: number,
    s3url: string,
  ): Promise<Vaulting> {
    var vaulting: Vaulting;
    try {
      await getManager().transaction(
        this.isolation,
        async (transactionalEntityManager) => {
          // query vaulting by item id
          vaulting = await transactionalEntityManager.findOne(Vaulting, {
            where: { item_id: item_id },
          });
          // if vaulting does not exist, create a new one
          if (!vaulting) {
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
          } else {
            // update vaulting status
            vaulting.mint_job_id = mint_job_id;
            vaulting.status = VaultingStatus.Minting;
            vaulting.updated_at = Math.round(Date.now() / 1000);
            vaulting = await this.vaultingRepo.save(vaulting);
          }
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
    item: number,
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
      where_filter['user'] = user.id;
    }

    if (item !== undefined) {
      where_filter['item_id'] = item;
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

  // get vaulting by item id
  async getVaultingsByItemIDs(item_ids: number[]): Promise<Vaulting[]> {
    const vaultings = await this.vaultingRepo.find({
      where: { item_id: In(item_ids) },
    });
    return vaultings;
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
    var submission = await this.getSubmissionByItemUUID(
      vaultingUpdate.item_uuid,
    );
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
        Object.assign(vaulting, newVaulting);

        // update submission status
        submission.status = SubmissionStatus.Vaulted;
        submission.updated_at = Math.round(Date.now() / 1000);
        await this.submissionRepo.save(submission);

        // record user action
        var actionLogRequest = new ActionLogRequest({
          actor_type: ActionLogActorType.CognitoUser,
          actor: submission.user.toString(),
          entity_type: ActionLogEntityType.Submission,
          entity: submission.id.toString(),
          type: ActionLogType.SubmissionUpdate,
          extra: JSON.stringify({ status: SubmissionStatus.Vaulted }),
        });
        await this.createNewActionLog(actionLogRequest);

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
        this.isolation,
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
      where_filter['user'] = user.id;
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

  async getSubmissionOrder(
    submission_order_id: number,
  ): Promise<SubmissionOrder> {
    const submissionOrder = await this.submissionOrderRepo.findOne({
      where: { id: submission_order_id },
    });
    // throw error if submission order not found
    if (!submissionOrder) {
      throw new NotFoundException(
        `Submission order with id ${submission_order_id} not found`,
      );
    }
    return submissionOrder;
  }

  async listSubmissionsForOrder(
    submission_order_id: number,
  ): Promise<Submission[]> {
    const submissions = await this.submissionRepo.find({
      where: { order_id: submission_order_id },
    });
    return submissions;
  }

  async listSubmissionOrders(
    userUUID: string,
    status: number,
    offset: number,
    limit: number,
    order: string,
  ): Promise<SubmissionOrderDetails[]> {
    var where_filter = {};
    if (userUUID !== undefined) {
      // find user by uuid
      const user = await this.userRepo.findOne({
        where: { uuid: userUUID },
      });
      if (!user) {
        throw new NotFoundException(`User ${userUUID} not found`);
      }
      where_filter['user'] = user.id;
    }

    // by default, set status filter to be <not discarded>
    where_filter['status'] = Not(SubmissionOrderStatus.Discarded);
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
    const submissionOrders = await this.submissionOrderRepo.find(filter);
    // find all submissions for submission orders
    const submissionOrderIds = submissionOrders.map((submissionOrder) => {
      return submissionOrder.id;
    });
    const submissions = await this.submissionRepo.find({
      where: { order_id: In(submissionOrderIds) },
    });
    // build a map of submission_order_id to a list of submissions
    const submissionMap = new Map<number, Submission[]>();
    submissions.forEach((submission) => {
      const submissionOrderId = submission.order_id;
      if (!submissionMap.has(submissionOrderId)) {
        submissionMap.set(submissionOrderId, []);
      }
      submissionMap.get(submissionOrderId).push(submission);
    });
    // find all items for submissions
    const itemIds = submissions.map((submission) => {
      return submission.item_id;
    });
    const items = await this.itemRepo.find({
      where: { id: In(itemIds) },
    });
    // build a map of submission id to item
    const itemMap = new Map<number, Item>();
    items.forEach((item) => {
      itemMap.set(item.id, item);
    });
    // find all users for submission orders
    const userIds = submissionOrders.map((submissionOrder) => {
      return submissionOrder.user;
    });
    const users = await this.userRepo.find({
      where: { id: In(userIds) },
    });
    // build a map of user id to user
    const userMap = new Map<number, User>();
    users.forEach((user) => {
      userMap.set(user.id, user);
    });

    // for each submission order, format the submission order details
    const submissionOrderDetails = submissionOrders.map((submissionOrder) => {
      const submissionOrderDetails = newSubmissionOrderDetails(
        submissionOrder,
        userMap.get(submissionOrder.user),
        submissionMap.get(submissionOrder.id),
        itemMap,
        userMap,
      );
      return submissionOrderDetails;
    });

    return submissionOrderDetails;
  }

  async createNewInventory(
    inventoryRequest: InventoryRequest,
  ): Promise<Inventory> {
    var inventory: Inventory;
    try {
      await getManager().transaction(
        this.isolation,
        async (transactionalEntityManager) => {
          // trim whitespace from inventoryRequest
          inventoryRequest = trimInventoryLocation(
            inventoryRequest,
          ) as InventoryRequest;
          // generate the unique location label
          const label = getInventoryLabel(
            inventoryRequest as InventoryLocation,
          );

          // find if the item is already in inventory & has the same location & is not current
          const sameInventoryNotCurrent = await this.inventoryRepo.findOne({
            where: {
              item_id: inventoryRequest.item_id,
              label: label,
              status: Not(InventoryStatus.IsCurrent),
            },
          });

          // if there is an existing inventory which is same location & not current
          // set it to be current
          if (!!sameInventoryNotCurrent) {
            sameInventoryNotCurrent.status = InventoryStatus.IsCurrent;
            sameInventoryNotCurrent.updated_at = Math.round(Date.now() / 1000);
            inventory = await this.inventoryRepo.save(sameInventoryNotCurrent);
          } else {
            // otherwise, create a new inventory and update any existing
            // inventory for the item to be not current

            // update any existing inventory for the item to be not current
            const existingInventory = await this.inventoryRepo.findOne({
              where: {
                item_id: inventoryRequest.item_id,
                status: InventoryStatus.IsCurrent,
              },
            });
            if (!!existingInventory) {
              existingInventory.status = InventoryStatus.NotCurrent;
              await this.inventoryRepo.save(existingInventory);
            }

            // create new inventory
            const newInventory = this.inventoryRepo.create({
              item_id: inventoryRequest.item_id,
              vault: inventoryRequest.vault,
              zone: inventoryRequest.zone,
              shelf: inventoryRequest.shelf ? inventoryRequest.shelf : '',
              row: inventoryRequest.row ? inventoryRequest.row : '',
              box: inventoryRequest.box ? inventoryRequest.box : '',
              slot: inventoryRequest.slot ? inventoryRequest.slot : '',
              label: label,
              status: InventoryStatus.IsCurrent,
              note: inventoryRequest.note ? inventoryRequest.note : '',
              updated_at: 0,
              created_at: Math.round(Date.now() / 1000),
            });
            inventory = await this.inventoryRepo.save(newInventory);
          }
        },
      );
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error);
    }
    return inventory;
  }

  async isInventoryAvailable(label: string): Promise<boolean> {
    const inventory = await this.inventoryRepo.findOne({
      where: { label: label },
    });
    if (!!inventory) {
      return false;
    } else {
      return true;
    }
  }

  async isExistingInventory(item_id: number): Promise<boolean> {
    const inventory = await this.inventoryRepo.findOne({
      where: { item_id: item_id },
    });
    if (!!inventory) {
      return true;
    } else {
      return false;
    }
  }

  async deleteInventory(inventory_id: number) {
    const inventory = await this.inventoryRepo.findOne({
      where: { id: inventory_id },
    });
    if (!inventory) {
      throw new NotFoundException(
        `Inventory with id ${inventory_id} not found`,
      );
    }
    if (inventory.status == InventoryStatus.IsCurrent) {
      throw new InternalServerErrorException(
        `Inventory with id ${inventory_id} is currently in use`,
      );
    }
    inventory.status = InventoryStatus.Deprecated;
    await this.inventoryRepo.save(inventory);
  }

  async listInventory(
    listInventoryRequest: ListInventoryRequest,
  ): Promise<Inventory[]> {
    var where_filter = {};
    if (!!listInventoryRequest.item_ids) {
      // convert csv to number array
      const item_ids = listInventoryRequest.item_ids
        .split(',')
        .map((item_id) => parseInt(item_id));
      where_filter['item_id'] = In(item_ids);
    }
    if (!!listInventoryRequest.vault) {
      where_filter['vault'] = listInventoryRequest.vault;
    }
    if (!!listInventoryRequest.zone) {
      where_filter['zone'] = listInventoryRequest.zone;
    }
    if (!!listInventoryRequest.shelf) {
      where_filter['shelf'] = listInventoryRequest.shelf;
    }
    if (!!listInventoryRequest.row) {
      where_filter['row'] = listInventoryRequest.row;
    }
    if (!!listInventoryRequest.box) {
      where_filter['box'] = listInventoryRequest.box;
    }
    if (!!listInventoryRequest.slot) {
      where_filter['slot'] = listInventoryRequest.slot;
    }

    //exclude deprecated inventory
    where_filter['status'] = Not(InventoryStatus.Deprecated);

    const offset = listInventoryRequest.offset
      ? listInventoryRequest.offset
      : 0;
    var filter = {
      where: where_filter,
      skip: offset,
    };

    if (!!listInventoryRequest.limit) {
      filter['take'] = listInventoryRequest.limit;
    }

    // order by id
    if (!!listInventoryRequest.order) {
      filter['order'] = { id: listInventoryRequest.order };
    }

    const inventories = await this.inventoryRepo.find(filter);
    return inventories;
  }

  async getInventoryForItem(item_id: number): Promise<Inventory> {
    const inventory = await this.inventoryRepo.findOne({
      where: { item_id: item_id },
    });
    return inventory;
  }

  async getInventory(inventory_id: number) {
    const inventory = await this.inventoryRepo.findOne({
      where: { id: inventory_id, status: Not(InventoryStatus.Deprecated) },
    });
    if (!inventory) {
      throw new NotFoundException(
        `Inventory with id ${inventory_id} not found`,
      );
    }
    return inventory;
  }

  async updateInventory(
    inventory_id: number,
    updateInventoryRequest: UpdateInventoryRequest,
  ): Promise<Inventory> {
    // throw error if inventory is not found
    const inventory = await this.getInventory(inventory_id);
    // update inventory with new values
    inventory.status =
      updateInventoryRequest.status != undefined
        ? updateInventoryRequest.status
        : inventory.status;
    inventory.note =
      updateInventoryRequest.note != undefined
        ? updateInventoryRequest.note
        : inventory.note;
    inventory.updated_at = Math.round(Date.now() / 1000);
    // put updates into a single transaction
    await getManager().transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager.save(inventory);

      // find if the item is already in inventory and is current
      const existingInventory = await this.inventoryRepo.findOne({
        where: {
          item_id: inventory.item_id,
          status: InventoryStatus.IsCurrent,
        },
      });
      // if the update request is to make the inventory current,
      // we need to set any existing inventory to not current
      if (
        !!existingInventory &&
        existingInventory.id !== inventory.id &&
        inventory.status === InventoryStatus.IsCurrent
      ) {
        existingInventory.status = InventoryStatus.NotCurrent;
        await transactionalEntityManager.save(existingInventory);
      }
    });

    return inventory;
  }

  async sanityCheck(): Promise<[boolean, any]> {
    const env = process.env[RUNTIME_ENV];
    const config = configuration()[env];
    const settings = {
      type: config['db']['type'],
      host: config['db']['host'],
      database: config['db']['name'],
      sync: config['db']['sync'],
    };
    try {
      await this.submissionRepo.find({ take: 1 });
      return [true, settings];
    } catch (e) {
      return [false, { error: JSON.stringify(e), config: settings }];
    }
  }
}
