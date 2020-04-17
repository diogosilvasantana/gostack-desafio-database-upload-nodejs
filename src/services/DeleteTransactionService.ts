import { getRepository } from 'typeorm';
import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';

class DeleteTransactionService {
  public async execute(id: string): Promise<void> {
    const transactions = getRepository(Transaction);

    const findTransaction = await transactions.findOne(id);

    if (!findTransaction) {
      throw new AppError('Invalid Transaction ID');
    }

    await transactions.delete(id);
  }
}

export default DeleteTransactionService;
