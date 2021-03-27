import { Connection, User } from '../models';
import { ParamsDictionary, StandardResponse } from '../typings/express';
import { Request, Response } from 'express';

import { find } from 'lodash';

async function GetUserConnections(req: Request, res: Response<StandardResponse>) {
  try {
    const connections = await Connection.find({
      $or: [{ sender: req.user }, { receiver: req.user }],
    })
      .populate({
        path: 'sender',
        match: { _id: { $ne: req.user._id } },
        populate: { path: 'profile' },
      })
      .populate({
        path: 'receiver ',
        match: { _id: { $ne: req.user._id } },
        populate: { path: 'profile' },
      })
      .exec();

    if (!connections)
      return res.status(400).send({ message: 'No connections found.', success: false });

    // const populatedConnections = await Connection.populate(connections, {retain});

    return res.send({ data: connections, message: 'User connections.', success: true });
  } catch (error) {
    console.error(error.message);

    return res.status(500).send({ message: 'Server error.', success: false });
  }
}

async function RequestConnection(
  req: Request<ParamsDictionary, any, any, { email: string }>,
  res: Response<StandardResponse>
) {
  try {
    const { email } = req.query;

    if (email === find(req.user.emails, { email })?.email)
      return res.status(400).send({
        errors: [
          {
            location: 'query',
            message: 'You cannot send a request to your own account.',
            param: 'email',
            value: email,
          },
        ],
        message: 'Connection request failed.',
        success: false,
      });

    const receiver = await User.findByPrimaryEmail(email);

    if (!receiver)
      return res.status(400).send({
        errors: [
          {
            location: 'query',
            message: `User with email ${email} doesn't exist`,
            param: 'email',
            value: email,
          },
        ],
        message: 'Connection request failed.',
        success: false,
      });

    const connection = await Connection.findOne({
      $or: [
        { sender: req.user.id, receiver },
        { sender: receiver, receiver: req.user.id },
      ],
    });

    if (connection) {
      if (connection.status === 'pending')
        return res.status(400).send({
          errors: [
            {
              location: 'query',
              message: 'Already have a pending request.',
              param: 'email',
              value: email,
            },
          ],
          message: 'Connection request failed.',
          success: false,
        });

      if (connection.status === 'accepted')
        return res
          .status(400)
          .send({ message: 'User already on your connections', success: false });
    }

    Connection.create(
      {
        sender: req.user.id,
        status: 'pending',
        receiver: receiver,
      },
      (error) => {
        if (error) throw new Error();

        return res.send({ message: 'Request sent.', success: true });
      }
    );
    return;
  } catch (error) {
    console.error(error.message);
    return res.status(500).send({ message: 'Server error.', success: false });
  }
}

async function AcceptConnection(
  req: Request<ParamsDictionary, any, any, { email: string }>,
  res: Response<StandardResponse>
) {
  try {
    const { email } = req.query;

    if (email === find(req.user.emails, { email })?.email)
      return res.status(400).send({ message: 'Invalid connection.', success: false });

    const sender = await User.findByPrimaryEmail(email);

    const connection = await Connection.findOne({
      $or: [
        { sender: req.user.id, receiver: sender },
        { sender: sender, receiver: req.user.id },
      ],
    });

    if (!connection)
      return res.status(400).send({ message: 'Connection request not found.', success: false });

    if (connection.status === 'accepted')
      return res.status(400).send({ message: 'Already accepted.', success: false });

    if (connection.status === 'ignored')
      return res.status(400).send({
        message: 'This connection has been ignored, user needs to send a new connection request',
        success: false,
      });

    connection.status = 'accepted';

    await connection.save();

    return res.send({ message: 'Connection accepted.', success: true });
  } catch (error) {
    console.error(error.message);
    return res.status(500).send({ message: 'Server error.', success: false });
  }
}

export default { RequestConnection, AcceptConnection, GetUserConnections };
