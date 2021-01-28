import config from '../config';
import mail from '@sendgrid/mail';

mail.setApiKey(config.SENDGRID_API_KEY);

export default mail;
