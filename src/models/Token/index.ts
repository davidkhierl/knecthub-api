import { model } from 'mongoose';

import TokenSchema from './token.schema';
import { TokenDocument } from './token.types';

const Token = model<TokenDocument>('Token', TokenSchema);

export default Token;
