import Notification from '../models/Notification';
import { User } from '../models';
import express from 'express';

export const NotificationSend = async (req: express.Request, _res: express.Response) => {
  const user = await User.findById(req.user.id);
  const validate = await Notification.find({ userId: req.body.userId });

  if (!user) {
    console.log('User not found');
  } else {
    const senderUserId = { senderUserId: req.body.senderUserId };
    const module = { module: req.body.module };
    const action = { action: req.body.action };
    const description = { description: req.body.description };
    const status = { status: false };

    const merged_object = JSON.parse(
      (
        JSON.stringify(senderUserId) +
        JSON.stringify(module) +
        JSON.stringify(action) +
        JSON.stringify(description) +
        JSON.stringify(status)
      ).replace(/}{/g, ',')
    );

    //  Vaidate if reciever user Id has record in notification collection
    if (validate.length > 0) {
      //  Reciever has record in notification collection
      //  Check in db if the receiver has record of requestor user id, Module is Connection, and Action is Friend Request
      const notificationExists = await Notification.find({
        'notifications.senderUserId': req.user.id,
        'notifications.module': 'Connection',
        'notifications.action': 'Friend Request',
      });

      //  Validate if checking of record with a record of requestor user id, Module is Connection, and Action is Friend Request exists
      if (notificationExists.length < 1) {
        await Notification.findOneAndUpdate(
          { userId: req.body.userId },
          { $push: { notifications: merged_object } }
        );
        console.log('Notification Created!');
      }
    } else {
      //  Reciever dont have record in notification collection
      Notification.create({
        userId: req.body.userId,
        notifications: merged_object,
      });
      console.log('Notification Created!');
    }
  }
};
