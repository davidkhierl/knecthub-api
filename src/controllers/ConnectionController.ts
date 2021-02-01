import Connection from '../models/Connection';
import { NotificationSend } from '../controllers/NotificationController';
import { User } from '../models';
import express from 'express';

//  Friends & Contacts List
export const ConnectionList = async (req: express.Request, res: express.Response) => {
  const connectionList = await Connection.find({
    userId: req.user.id,
  })
    .populate('friends.user')
    .populate('friends.profile');
  return res.send(connectionList);
};

export const ConnectionRemove = async (_req: express.Request, res: express.Response) => {
  return res.send('asd');
};

//  Friend Request
export const ConnectionRequest = async (req: express.Request, res: express.Response) => {
  try {
    const validate = await Connection.find({ userId: req.user.id });
    const user = await User.findById(req.body.userId);
    const currentUser = await User.findById(req.user.id);

    //  Validate if requestor has record in connection collection
    if (validate.length > 0) {
      if (!user) return res.status(400).json([{ message: 'User not found' }]);
      const connectionExists = await Connection.find({
        'friends.toUserId': req.body.userId,
      });

      //  Validate if Receiver's User id is already exists in Requestor friend list
      if (connectionExists.length > 0) {
        return res.json({
          success: false,
          message: 'You already sent a friend request!',
        });
      }

      const obj1 = { name: user.firstName + ' ' + user.lastName };
      const obj2 = { toUserId: user.id };
      const obj3 = { status: true };

      const merged_object = JSON.parse(
        (JSON.stringify(obj1) + JSON.stringify(obj2) + JSON.stringify(obj3)).replace(/}{/g, ',')
      );

      //  Update collection Notification -> friends details
      await Connection.findOneAndUpdate(
        { userId: req.user.id },
        { $push: { friends: merged_object } }
      );

      if (!currentUser) return res.status(400).json([{ message: 'User not found' }]);
      //  Create params for notification
      req.body.senderUserId = req.user.id;
      req.body.module = 'Connection';
      req.body.action = 'Friend Request';

      req.body.description =
        currentUser.firstName + ' ' + currentUser.lastName + ' sent you a friend request.';

      //  Create Notification
      SendNotification(req, res);

      return res.json({ success: true, message: 'Friend request sent!' });
    } else {
      if (!user) return res.status(400).json([{ message: 'User not found' }]);

      const obj1 = { name: user.firstName + ' ' + user.lastName };
      const obj2 = { toUserId: user.id };
      const obj3 = { sentByMe: true };

      const merged_object = JSON.parse(
        (JSON.stringify(obj1) + JSON.stringify(obj2) + JSON.stringify(obj3)).replace(/}{/g, ',')
      );

      //  Create record in connection collection for requestor
      Connection.create({
        userId: req.user.id,
        friends: merged_object,
      });

      //  If receiver don't have any record in connection collection => Create record
      //  If receiver has record in connection collection => Update Notification -> friend list
      ConnectionPopulate(req, res);

      if (!currentUser) return res.status(400).json([{ message: 'User not found' }]);
      //  Create params for notification
      req.body.senderUserId = req.user.id;
      req.body.module = 'Connection';
      req.body.action = 'Friend Request';

      req.body.description =
        currentUser.firstName + ' ' + currentUser.lastName + ' sent you a friend request.';

      //  Create Notification
      SendNotification(req, res);

      return res.json({ success: true, message: 'Friend request sent!' });
    }
  } catch (error) {
    // console.error(error.message);
    return res.status(500).send('Server Error');
  }
};

//  Approve Friend Request
export const ConnectionApprove = async (req: express.Request, res: express.Response) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(400).json([{ message: 'User not found' }]);
  const validate = await Connection.findOne({ userId: req.user.id });

  //  Validate if current user has record
  if (validate != null) {
    const isFriendRequestorExists = await Connection.findOne({
      'friends.toUserId': req.body.userId,
      'friends.status': false,
      'friends.sentByMe': false,
    });

    if (isFriendRequestorExists != null) {
      Connection.findOneAndUpdate(
        {
          _id: validate.id,
          'friends.toUserId': '' + req.body.userId + '',
        },
        {
          $set: {
            'friends.$.status': true,
          },
        }
        // function (error: any, success: any) {
        //   if (error) console.error(error);
        //   else console.log(success);
        // }
      );
      const userRequester = await Connection.findOne({
        userId: req.body.userId,
      });
      if (!userRequester) return res.status(400).json([{ message: 'User not found' }]);
      Connection.findOneAndUpdate(
        {
          _id: userRequester.id,
          'friends.toUserId': '' + req.user.id + '',
        },
        {
          $set: {
            'friends.$.status': true,
          },
        }
        // function (error: any, success: any) {
        //   if (error) console.error(error);
        //   else console.log(success);
        // }
      );

      //  Create params for notification
      req.body.senderUserId = req.user.id;
      req.body.module = 'Connection';
      req.body.action = 'Friend Request Approved';

      req.body.description =
        'You and ' + user.firstName + ' ' + user.lastName + ' are now connected!';

      //  Create Notification
      SendNotification(req, res);

      return res.json({
        success: true,
        message: 'Friend request approved!',
      });
    } else {
      return res.json({ success: true, message: 'No User found' });
    }
  } else {
    return res.json({
      success: true,
      message: 'User does not have any record',
    });
  }
  // return res.json(user);
};

//  If receiver don't have any record in connection collection => Create record
//  If receiver has record in connection collection => Update Notification -> friend list
const ConnectionPopulate = async (req: express.Request, _res: express.Response) => {
  const obj1 = { name: req.user.firstName + ' ' + req.user.lastName };
  const obj2 = { toUserId: req.user.id };
  const obj3 = { sentByMe: false };
  const merged_object = JSON.parse(
    (JSON.stringify(obj1) + JSON.stringify(obj2) + JSON.stringify(obj3)).replace(/}{/g, ',')
  );

  const validate = await Connection.find({ userId: req.body.userId });
  if (validate.length > 0) {
    //  Update receiver's notification -> friend list record
    await Connection.findOneAndUpdate(
      { userId: req.body.userId },
      { $push: { friends: merged_object } }
    );
  } else {
    //  Create records for receiver
    await Connection.create({
      userId: req.body.userId,
      friends: merged_object,
    });
  }
};

//  SEND NOTIFICATION TO USER RECEIVER
const SendNotification = async (req: express.Request, res: express.Response) => {
  NotificationSend(req, res);
};
