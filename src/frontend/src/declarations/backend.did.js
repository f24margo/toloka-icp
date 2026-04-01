/* eslint-disable */

// @ts-nocheck
// HARDCODED IDL - DO NOT OVERWRITE
// This file is restored by scripts/restore-idl.js before each build.

import { IDL } from '@icp-sdk/core/candid';

const NewsPost = IDL.Record({
  id: IDL.Nat,
  title: IDL.Text,
  body: IDL.Text,
  author: IDL.Principal,
  timestamp: IDL.Int,
});

const Announcement = IDL.Record({
  id: IDL.Nat,
  title: IDL.Text,
  text: IDL.Text,
  author: IDL.Principal,
  timestamp: IDL.Int,
});

const ForumTopic = IDL.Record({
  id: IDL.Nat,
  title: IDL.Text,
  body: IDL.Text,
  author: IDL.Principal,
  timestamp: IDL.Int,
});

const ForumReply = IDL.Record({
  id: IDL.Nat,
  topicId: IDL.Nat,
  body: IDL.Text,
  author: IDL.Principal,
  timestamp: IDL.Int,
});

const Poll = IDL.Record({
  id: IDL.Nat,
  question: IDL.Text,
  options: IDL.Vec(IDL.Text),
  author: IDL.Principal,
  timestamp: IDL.Int,
});

const PollResults = IDL.Record({
  pollId: IDL.Nat,
  question: IDL.Text,
  options: IDL.Vec(IDL.Text),
  votes: IDL.Vec(IDL.Nat),
  userVoted: IDL.Opt(IDL.Nat),
});

const Event = IDL.Record({
  id: IDL.Nat,
  title: IDL.Text,
  description: IDL.Text,
  date: IDL.Text,
  location: IDL.Text,
  author: IDL.Principal,
  timestamp: IDL.Int,
});

const Service = IDL.Record({
  id: IDL.Nat,
  name: IDL.Text,
  category: IDL.Text,
  phone: IDL.Text,
  description: IDL.Text,
});

const UserRole = IDL.Variant({
  admin: IDL.Null,
  user: IDL.Null,
  guest: IDL.Null,
});

export const idlService = IDL.Service({
  _initializeAccessControlWithSecret: IDL.Func([IDL.Text], [], []),
  assignCallerUserRole: IDL.Func([IDL.Principal, UserRole], [], []),
  getCallerUserRole: IDL.Func([], [UserRole], ['query']),
  isCallerAdmin: IDL.Func([], [IDL.Bool], ['query']),
  getRole: IDL.Func([IDL.Principal], [IDL.Text], ['query']),
  forceAdmin: IDL.Func([IDL.Principal], [], []),
  createNews: IDL.Func([IDL.Text, IDL.Text], [IDL.Nat], []),
  getNews: IDL.Func([], [IDL.Vec(NewsPost)], ['query']),
  deleteNews: IDL.Func([IDL.Nat], [], []),
  createAnnouncement: IDL.Func([IDL.Text, IDL.Text], [IDL.Nat], []),
  getAnnouncements: IDL.Func([], [IDL.Vec(Announcement)], ['query']),
  deleteAnnouncement: IDL.Func([IDL.Nat], [], []),
  createTopic: IDL.Func([IDL.Text, IDL.Text], [IDL.Nat], []),
  getTopics: IDL.Func([], [IDL.Vec(ForumTopic)], ['query']),
  createReply: IDL.Func([IDL.Nat, IDL.Text], [IDL.Nat], []),
  getReplies: IDL.Func([IDL.Nat], [IDL.Vec(ForumReply)], ['query']),
  createPoll: IDL.Func([IDL.Text, IDL.Vec(IDL.Text)], [IDL.Nat], []),
  getPolls: IDL.Func([], [IDL.Vec(Poll)], ['query']),
  vote: IDL.Func([IDL.Nat, IDL.Nat], [], []),
  getPollResults: IDL.Func([IDL.Nat], [IDL.Opt(PollResults)], ['query']),
  createEvent: IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text], [IDL.Nat], []),
  getEvents: IDL.Func([], [IDL.Vec(Event)], ['query']),
  deleteEvent: IDL.Func([IDL.Nat], [], []),
  createService: IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text], [IDL.Nat], []),
  getServices: IDL.Func([], [IDL.Vec(Service)], ['query']),
  deleteService: IDL.Func([IDL.Nat], [], []),
  listUsers: IDL.Func([], [IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Text))], ['query']),
  setUserRole: IDL.Func([IDL.Principal, IDL.Text], [], []),
});

export const idlInitArgs = [];

export const idlFactory = ({ IDL }) => {
  const NewsPost = IDL.Record({ id: IDL.Nat, title: IDL.Text, body: IDL.Text, author: IDL.Principal, timestamp: IDL.Int });
  const Announcement = IDL.Record({ id: IDL.Nat, title: IDL.Text, text: IDL.Text, author: IDL.Principal, timestamp: IDL.Int });
  const ForumTopic = IDL.Record({ id: IDL.Nat, title: IDL.Text, body: IDL.Text, author: IDL.Principal, timestamp: IDL.Int });
  const ForumReply = IDL.Record({ id: IDL.Nat, topicId: IDL.Nat, body: IDL.Text, author: IDL.Principal, timestamp: IDL.Int });
  const Poll = IDL.Record({ id: IDL.Nat, question: IDL.Text, options: IDL.Vec(IDL.Text), author: IDL.Principal, timestamp: IDL.Int });
  const PollResults = IDL.Record({ pollId: IDL.Nat, question: IDL.Text, options: IDL.Vec(IDL.Text), votes: IDL.Vec(IDL.Nat), userVoted: IDL.Opt(IDL.Nat) });
  const Event = IDL.Record({ id: IDL.Nat, title: IDL.Text, description: IDL.Text, date: IDL.Text, location: IDL.Text, author: IDL.Principal, timestamp: IDL.Int });
  const Service = IDL.Record({ id: IDL.Nat, name: IDL.Text, category: IDL.Text, phone: IDL.Text, description: IDL.Text });
  const UserRole = IDL.Variant({ admin: IDL.Null, user: IDL.Null, guest: IDL.Null });
  return IDL.Service({
    _initializeAccessControlWithSecret: IDL.Func([IDL.Text], [], []),
    assignCallerUserRole: IDL.Func([IDL.Principal, UserRole], [], []),
    getCallerUserRole: IDL.Func([], [UserRole], ['query']),
    isCallerAdmin: IDL.Func([], [IDL.Bool], ['query']),
    getRole: IDL.Func([IDL.Principal], [IDL.Text], ['query']),
    forceAdmin: IDL.Func([IDL.Principal], [], []),
    createNews: IDL.Func([IDL.Text, IDL.Text], [IDL.Nat], []),
    getNews: IDL.Func([], [IDL.Vec(NewsPost)], ['query']),
    deleteNews: IDL.Func([IDL.Nat], [], []),
    createAnnouncement: IDL.Func([IDL.Text, IDL.Text], [IDL.Nat], []),
    getAnnouncements: IDL.Func([], [IDL.Vec(Announcement)], ['query']),
    deleteAnnouncement: IDL.Func([IDL.Nat], [], []),
    createTopic: IDL.Func([IDL.Text, IDL.Text], [IDL.Nat], []),
    getTopics: IDL.Func([], [IDL.Vec(ForumTopic)], ['query']),
    createReply: IDL.Func([IDL.Nat, IDL.Text], [IDL.Nat], []),
    getReplies: IDL.Func([IDL.Nat], [IDL.Vec(ForumReply)], ['query']),
    createPoll: IDL.Func([IDL.Text, IDL.Vec(IDL.Text)], [IDL.Nat], []),
    getPolls: IDL.Func([], [IDL.Vec(Poll)], ['query']),
    vote: IDL.Func([IDL.Nat, IDL.Nat], [], []),
    getPollResults: IDL.Func([IDL.Nat], [IDL.Opt(PollResults)], ['query']),
    createEvent: IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text], [IDL.Nat], []),
    getEvents: IDL.Func([], [IDL.Vec(Event)], ['query']),
    deleteEvent: IDL.Func([IDL.Nat], [], []),
    createService: IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text], [IDL.Nat], []),
    getServices: IDL.Func([], [IDL.Vec(Service)], ['query']),
    deleteService: IDL.Func([IDL.Nat], [], []),
    listUsers: IDL.Func([], [IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Text))], ['query']),
    setUserRole: IDL.Func([IDL.Principal, IDL.Text], [], []),
  });
};

export const init = ({ IDL }) => { return []; };
