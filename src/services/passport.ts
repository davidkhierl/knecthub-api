import { Profile, User } from '../models';

import { OAuth2Strategy as GoogleStrategy } from 'passport-google-oauth';
import { Strategy as JwtStrategy } from 'passport-jwt';
import { Strategy as LocalStrategy } from 'passport-local';
import { PassportStatic } from 'passport';
import bcrypt from 'bcryptjs';
import config from '../config';
import randomColor from 'randomcolor';
import { startCase } from 'lodash';

function passportStrategy(passport: PassportStatic) {
  // Local Strategy
  passport.use(
    new LocalStrategy({ usernameField: 'email' }, async function (email, password, done) {
      try {
        const user = await User.findOne({ email }).populate('profile');

        if (!user) return done(null, false, { message: 'User not found' });

        if (!user.password && user.googleId)
          return done(null, false, {
            message: 'Seems like this account used to sign in with google.',
          });

        if (!(await bcrypt.compare(password, user.password)))
          return done(null, false, { message: 'Invalid login details' });
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  // Jwt Strategy
  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: (req) => {
          if (req && req.cookies) return req.cookies['accessToken'];

          return null;
        },
        secretOrKey: config.JWT_SECRET,
      },
      async (payload, done) => {
        try {
          const user = await User.findById(payload.sub).populate('profile');

          if (user) {
            return done(null, user);
          } else {
            return done(null, false);
          }
        } catch (error) {
          return done(error, false);
        }
      }
    )
  );

  // Google Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.GOOGLE_CLIENT_ID,
        clientSecret: config.GOOGLE_CLIENT_SECRET,
        callbackURL: config.GOOGLE_CALLBACK_URL,
      },
      async (_accessToken, _refreshToken, google_profile, done) => {
        try {
          const user = await User.findByEmail(google_profile._json.email);

          if (!user) {
            // create user profile first
            const profile = await Profile.create({
              avatarBgColor: randomColor({
                luminosity: 'light',
                seed: `${google_profile.displayName}`,
              }),
              profilePicture: google_profile._json.picture.replace('=s96-c', '=s500-c'),
            });

            // proceed creating user
            const user = await User.create({
              firstName: startCase(google_profile.name?.givenName),
              lastName: startCase(google_profile.name?.familyName),
              email: google_profile._json.email,
              emailVerified: google_profile._json.email_verified,
              profile,
              googleId: google_profile.id,
            });

            // populate user profile
            await user.populate('profile').execPopulate();

            return done(null, user);
          } else {
            if (!user.googleId) {
              user.googleId = google_profile.id;

              await user.save();
            }

            // TODO: Add optional update of picture
            // if (
            //   user.profile?.profilePicture !==
            //   google_profile._json.picture.replace('=s96-c', '=s500-c')
            // )
            //   await Profile.findByIdAndUpdate(user.profile, {
            //     profilePicture: google_profile._json.picture.replace('=s96-c', '=s500-c'),
            //   });

            return done(null, user);
          }
        } catch (error) {
          return done(error, false);
        }
      }
    )
  );
}

export default passportStrategy;
