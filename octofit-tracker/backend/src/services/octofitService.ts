import { Activity, Team, User, Workout } from '../models/index.js';
import mongoose from 'mongoose';

type ServiceError = Error & { status: number };

function requestError(status: number, message: string): ServiceError {
  return Object.assign(new Error(message), { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isObjectId(value: unknown): value is string {
  return typeof value === 'string' && mongoose.isValidObjectId(value);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) throw requestError(400, 'Activity details are required');
  const { userId, teamId, type, minutes } = input;
  if (!isObjectId(userId) || !isObjectId(teamId)) throw requestError(400, 'Valid userId and teamId are required');
  if (typeof type !== 'string' || !type.trim()) throw requestError(400, 'Activity type is required');
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) throw requestError(400, 'Minutes must be a positive number');

  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user || !team) throw requestError(400, 'Activity user and team must exist');

  return Activity.create({ user: user._id, team: team._id, type: type.trim(), minutes, points: minutes, occurredAt: new Date() });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) throw requestError(400, 'Team details are required');
  const { name, mascot } = input;
  const members = input.members ?? [];
  if (typeof name !== 'string' || !name.trim()) throw requestError(400, 'Team name is required');
  if (typeof mascot !== 'string' || !mascot.trim()) throw requestError(400, 'Team mascot is required');
  if (!Array.isArray(members) || !members.every(isObjectId)) throw requestError(400, 'Team members must be valid user IDs');

  const users = members.length ? await User.find({ _id: { $in: members } }).select('_id') : [];
  if (users.length !== members.length) throw requestError(400, 'All team members must exist');
  return Team.create({ name: name.trim(), mascot: mascot.trim(), members: users.map((user) => user._id) });
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate<{ _id: mongoose.Types.ObjectId; totalPoints: number }>([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1, _id: 1 } },
  ]);
  if (!totals.length) return [];

  const teams = await Team.find({ _id: { $in: totals.map(({ _id }) => _id) } }).select('_id name').lean();
  const names = new Map(teams.map((team) => [team._id.toString(), team.name]));
  return totals.flatMap(({ _id, totalPoints }) => {
    const teamName = names.get(_id.toString());
    return teamName ? [{ teamName, totalPoints, rank: 0 }] : [];
  }).map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.toLowerCase() }).lean();
  if (!user) throw requestError(404, 'No user found for that email address');

  const activities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(10).lean();
  const recentTypes = [...new Set(activities.map(({ type }) => type.trim().toLowerCase()).filter(Boolean))];
  const focusCandidates = [user.fitnessGoal.trim().toLowerCase(), ...recentTypes].filter(Boolean);

  for (const focus of [...new Set(focusCandidates)]) {
    const workouts = await Workout.find({ focus: new RegExp(`^${escapeRegExp(focus)}$`, 'i') }).lean();
    if (workouts.length) {
      const reason = focus === user.fitnessGoal.trim().toLowerCase()
        ? `Matches your ${user.fitnessGoal} fitness goal.`
        : `Builds on your recent ${focus} activity.`;
      return workouts.map((workout) => ({ ...workout, reason }));
    }
  }

  return [];
}

export { User };
