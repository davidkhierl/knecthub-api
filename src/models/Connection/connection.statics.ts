import { Connection } from '..';
import { UserDocument } from '../User/user.types';

export async function findUserConnections(user: UserDocument) {
  return Connection.find({
    $or: [{ sender: user }, { receiver: user }],
  });
}
