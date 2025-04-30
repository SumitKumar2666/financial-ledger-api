import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  NotFoundException,
  BadRequestException,
  ParseUUIDPipe,
} from '@nestjs/common';

import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionFilterDto } from './dto/transaction-filter.dto';
import { Transaction } from './entities/transaction.entity';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a transaction with entries' })
  @ApiResponse({
    status: 201,
    description: 'Transaction created successfully',
    type: Transaction,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid transaction or unbalanced entries',
  })
  async create(
    @Body() createTransactionDto: CreateTransactionDto,
  ): Promise<Transaction> {
    try {
      return await this.transactionsService.create(createTransactionDto);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        error.message || 'Failed to create transaction',
      );
    }
  }

  @Get()
  @ApiOperation({
    summary: 'Get a list of all transactions (optional filters)',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns transactions',
    type: [Transaction],
  })
  async findAll(
    @Query() filters?: TransactionFilterDto,
  ): Promise<Transaction[]> {
    return this.transactionsService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction by ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the transaction',
    type: Transaction,
  })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Transaction> {
    try {
      return await this.transactionsService.findOne(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`Transaction with ID "${id}" not found`);
    }
  }
}
