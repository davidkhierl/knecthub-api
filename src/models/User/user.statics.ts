import { User } from '..';

export async function findByPrimaryEmail(email: string) {
  return await User.findOne({ emails: { $elemMatch: { email, type: 'primary' } } }).populate(
    'profile'
  );
}
