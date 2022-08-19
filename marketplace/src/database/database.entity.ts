import { ItemType } from '../config/enum';
import {
  Entity,
  Index,
  Column,
  BeforeInsert,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
@Index(['uuid'], { unique: true })
@Index(['user', 'status'])
export class SubmissionOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user: number;

  @Column()
  uuid: string;

  @Column()
  status: number;

  @Column()
  created_at: number;

  @Column({ default: 0 })
  updated_at: number;
}

@Entity()
@Index(['user', 'item_id'], { unique: true })
export class Submission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user: number;

  @Column({ default: 0 })
  order_id: number;

  @Column()
  item_id: number;

  @Column()
  status: number;

  @Column({ length: 500, default: '' })
  extra: string;

  @Column()
  image: string;

  @Column()
  image_rev: string;

  @Column()
  created_at: number;

  @Column()
  received_at: number;

  @Column()
  rejected_at: number;

  @Column()
  approved_at: number;

  @Column({ default: 0 })
  updated_at: number;
}

@Entity()
@Index(['uuid'])
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  uuid: string;

  //TODO: hard code cognito first
  @Column()
  source: string;

  @Column()
  created_at: number;
}

@Entity()
@Index(['uuid'], { unique: true })
@Index(['user'])
export class Item {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  uuid: string;

  @Column()
  user: number;

  @Column({ default: ItemType.card })
  type: number;

  @Column({ default: '' })
  issue: string;

  @Column({ default: '' })
  publisher: string;

  @Column({ default: '' })
  player: string;

  @Column({ default: '' })
  sport: string;

  @Column({ default: '' })
  set_name: string;

  @Column({ default: '' })
  card_number: string;

  @Column()
  grading_company: string;

  @Column()
  serial_number: string;

  @Column()
  title: string;

  @Column({ length: 10000 })
  description: string;

  @Column()
  genre: string;

  @Column()
  manufacturer: string;

  @Column()
  year: number;

  @Column()
  overall_grade: string;

  @Column()
  sub_grades: string;

  @Column()
  autograph: string;

  @Column()
  subject: string;

  @Column()
  est_value: number;

  @Column()
  status: number;
}

@Entity()
@Index(['user'])
@Index(['item_id'], { unique: true })
@Index(['collection', 'token_id'])
export class Vaulting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  item_id: number;

  @Column()
  user: number;

  @Column()
  mint_job_id: number;

  @Column()
  burn_job_id: number;

  @Column()
  chain_id: number;

  @Column()
  mint_tx_hash: string;

  @Column()
  burn_tx_hash: string;

  @Column()
  collection: string;

  @Column()
  token_id: number;

  @Column()
  image: string;

  @Column()
  status: number;

  @Column()
  created_at: number;

  @Column()
  updated_at: number;

  @Column()
  minted_at: number;

  @Column()
  burned_at: number;

  @BeforeInsert()
  toLowerCaseCollection() {
    this.collection = this.collection.toLowerCase();
  }
}

@Entity()
@Index(['user', 'status'])
@Index(['vaulting_id'], { unique: true })
export class Listing {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  vaulting_id: number;

  @Column()
  user: number;

  @Column()
  price: number;

  @Column()
  status: number;

  @Column()
  created_at: number;

  @Column()
  updated_at: number;
}

@Entity()
@Index(['item_id'], { unique: true })
@Index(['vault', 'zone', 'shelf'])
export class Inventory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  item_id: number;

  @Column()
  vault: string;

  @Column()
  zone: string;

  @Column({ default: '' })
  shelf: string;

  @Column({ default: '' })
  row: string;

  @Column({ default: '' })
  box: string;

  @Column({ default: '' })
  slot: string;

  @Column()
  label: string;

  @Column({ default: '' })
  note: string;

  @Column()
  status: number;

  @Column()
  created_at: number;

  @Column()
  updated_at: number;
}

@Entity()
@Index(['entity', 'entity_type'])
@Index(['actor', 'actor_type'])
@Index(['created_at'])
@Index(['type'])
export class ActionLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  type: number;

  @Column()
  actor: string;

  @Column()
  actor_type: number;

  @Column()
  entity: string;

  @Column()
  entity_type: number;

  @Column()
  created_at: number;

  @Column({ length: 10000 })
  extra: string;
}
