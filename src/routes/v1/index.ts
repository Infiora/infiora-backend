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
import groupRoute from './group.route';
import subscriberRoute from './subscriber.route';
import healthRoute from './health.route';
import config from '../../config/config';

const router = express.Router();

interface IRoute {
  path: string;
  route: Router;
}

const defaultIRoute: IRoute[] = [
  {
    path: '/health',
    route: healthRoute,
  },
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
  {
    path: '/groups',
    route: groupRoute,
  },
  {
    path: '/subscribers',
    route: subscriberRoute,
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
if (config.env === 'dev') {
  devIRoute.forEach((route) => {
    router.use(route.path, route.route);
  });
}

export default router;
