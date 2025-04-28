import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Entry } from '../../entries/entities/entry.entity';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 500 })
  description: string;

  @Column({ type: 'date' })
  transactionDate: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reference: string;

  @OneToMany(() => Entry, (entry) => entry.transaction, {
    cascade: true,
    eager: true,
  })
  entries: Entry[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
