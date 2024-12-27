import express, { Router } from 'express';
import authRoute from './auth.route';
import docsRoute from './swagger.route';
import userRoute from './user.route';
import ticketRoute from './ticket.route';
import batchRoute from './batch.route';
import tagRoute from './tag.route';
import hotelRoute from './hotel.route';
import roomRoute from './room.route';
import linkRoute from './link.route';
import config from '../../config/config';

const router = express.Router();

interface IRoute {
  path: string;
  route: Router;
}

const defaultIRoute: IRoute[] = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/users',
    route: userRoute,
  },
  {
    path: '/tickets',
    route: ticketRoute,
  },
  {
    path: '/batches',
    route: batchRoute,
  },
  {
    path: '/tags',
    route: tagRoute,
  },
  {
    path: '/hotels',
    route: hotelRoute,
  },
  {
    path: '/rooms',
    route: roomRoute,
  },
  {
    path: '/links',
    route: linkRoute,
  },
];

const devIRoute: IRoute[] = [
  // IRoute available only in development mode
  {
    path: '/docs',
    route: docsRoute,
  },
];

defaultIRoute.forEach((route) => {
  router.use(route.path, route.route);
});

/* istanbul ignore next */
if (config.env === 'development') {
  devIRoute.forEach((route) => {
    router.use(route.path, route.route);
  });
}

export default router;
