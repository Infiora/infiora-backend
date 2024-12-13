import mongoose from 'mongoose';
import toJSON from '../toJSON/toJSON';
import paginate from '../paginate/paginate';
import { ITeamDoc, ITeamModel } from './team.interfaces';
import User from '../user/user.model';

const teamSchema = new mongoose.Schema<ITeamDoc, ITeamModel>(
  {
    superAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    stripeCustomer: { type: String, required: true },
    stripeSubscription: { type: String, required: true },
    company: String,
    logo: String,
    totalMembers: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
teamSchema.plugin(toJSON);
teamSchema.plugin(paginate);

teamSchema.pre('deleteOne', { document: true, query: false }, async function () {
  const team = this;
  const users = await User.find({ team: team._id });
  await Promise.allSettled(
    users.map(async (u) => {
      await User.findByIdAndUpdate(u.id, { $unset: { team: 1 }, isLocked: false });
    })
  );
});

const Team = mongoose.model<ITeamDoc, ITeamModel>('Team', teamSchema);

export default Team;
