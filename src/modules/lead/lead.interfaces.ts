import { Model, Document } from 'mongoose';
import { QueryResult } from '../paginate/paginate';
import { IProfileDoc } from '../profile/profile.interfaces';
import { IUserDoc } from '../user/user.interfaces';
import { ILinkDoc } from '../link/link.interfaces';
import { IPlatformDoc } from '../platform/platform.interfaces';

export interface ILead {
  user: IUserDoc & {
    live: (IProfileDoc & { direct: (ILinkDoc & (IPlatformDoc | null)) | null }) | null;
  };
  profile?: IProfileDoc & {
    user:
      | (IUserDoc & {
          live: (IProfileDoc & { direct: (ILinkDoc & (IPlatformDoc | null)) | null }) | null;
        })
      | null;
  };
  type?: string;
  image?: string;
  cover?: string;
  logo?: string;
  latitude?: number;
  longitude?: number;
  data?: any;
}

export interface ILeadDoc extends ILead, Document {}

export interface ILeadModel extends Model<ILeadDoc> {
  paginate(filter: Record<string, any>, options: Record<string, any>): Promise<QueryResult>;
}

export type UpdateLeadBody = Partial<ILead>;
export type NewCreatedLead = ILead;

export const leadPopulate = [
  {
    path: 'user',
    populate: {
      path: 'live',
      populate: {
        path: 'direct',
        populate: {
          path: 'platform',
        },
      },
    },
  },
  {
    path: 'profile',
    populate: [
      {
        path: 'direct',
        populate: {
          path: 'platform',
        },
      },
      {
        path: 'user',
        populate: {
          path: 'live',
          populate: {
            path: 'direct',
            populate: {
              path: 'platform',
            },
          },
        },
      },
    ],
  },
];
