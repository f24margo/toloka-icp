/* eslint-disable */
// @ts-nocheck
import { IDL } from '@icp-sdk/core/candid';

const UserRole = IDL.Variant({ admin: IDL.Null, user: IDL.Null, guest: IDL.Null });
const NewsPost = IDL.Record({ id: IDL.Nat, title: IDL.Text, body: IDL.Text, author: IDL.Principal, timestamp: IDL.Int });
const Announcement = IDL.Record({ id: IDL.Nat, title: IDL.Text, text: IDL.Text, author: IDL.Principal, timestamp: IDL.Int });
const ForumTopic = IDL.Record({ id: IDL.Nat, title: IDL.Text, body: IDL.Text, author: IDL.Principal, timestamp: IDL.Int });
const ForumReply = IDL.Record({ id: IDL.Nat, topicId: IDL.Nat, body: IDL.Text, author: IDL.Principal, timestamp: IDL.Int });
const Poll = IDL.Record({ id: IDL.Nat, question: IDL.Text, options: IDL.Vec(IDL.Text), author: IDL.Principal, timestamp: IDL.Int });
const PollResults = IDL.Record({ pollId: IDL.Nat, question: IDL.Text, options: IDL.Vec(IDL.Text), votes: IDL.Vec(IDL.Nat), userVoted: IDL.Opt(IDL.Nat) });
const Event = IDL.Record({ id: IDL.Nat, title: IDL.Text, description: IDL.Text, date: IDL.Text, location: IDL.Text, author: IDL.Principal, timestamp: IDL.Int });
const Service = IDL.Record({ id: IDL.Nat, name: IDL.Text, category: IDL.Text, phone: IDL.Text, description: IDL.Text });

export const idlFactory = ({ IDL }) => {
  const UserRole = IDL.Variant({ admin: IDL.Null, user: IDL.Null, guest: IDL.Null });
  const NewsPost = IDL.Record({ id: IDL.Nat, title: IDL.Text, body: IDL.Text, author: IDL.Principal, timestamp: IDL.Int });
  const Announcement = IDL.Record({ id: IDL.Nat, title: IDL.Text, text: IDL.Text, author: IDL.Principal, timestamp: IDL.Int });
  const ForumTopic = IDL.Record({ id: IDL.Nat, title: IDL.Text, body: IDL.Text, author: IDL.Principal, timestamp: IDL.Int });
  const ForumReply = IDL.Record({ id: IDL.Nat, topicId: IDL.Nat, body: IDL.Text, author: IDL.Principal, timestamp: IDL.Int });
  const Poll = IDL.Record({ id: IDL.Nat, question: IDL.Text, options: IDL.Vec(IDL.Text), author: IDL.Principal, timestamp: IDL.Int });
  const PollResults = IDL.Record({ pollId: IDL.Nat, question: IDL.Text, options: IDL.Vec(IDL.Text), votes: IDL.Vec(IDL.Nat), userVoted: IDL.Opt(IDL.Nat) });
  const Event = IDL.Record({ id: IDL.Nat, title: IDL.Text, description: IDL.Text, date: IDL.Text, location: IDL.Text, author: IDL.Principal, timestamp: IDL.Int });
  const Service = IDL.Record({ id: IDL.Nat, name: IDL.Text, category: IDL.Text, phone: IDL.Text, description: IDL.Text });
  return IDL.Service({
    _initializeAccessControlWithSecret: IDL.Func([IDL.Text], [], []),
    assignCallerUserRole: IDL.Func([IDL.Principal, UserRole], [], []),
    createAnnouncement: IDL.Func([IDL.Text, IDL.Text], [IDL.Nat], []),
    createEvent: IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text], [IDL.Nat], []),
    createNews: IDL.Func([IDL.Text, IDL.Text], [IDL.Nat], []),
    createPoll: IDL.Func([IDL.Text, IDL.Vec(IDL.Text)], [IDL.Nat], []),
    createReply: IDL.Func([IDL.Nat, IDL.Text], [IDL.Nat], []),
    createService: IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text], [IDL.Nat], []),
    createTopic: IDL.Func([IDL.Text, IDL.Text], [IDL.Nat], []),
    deleteAnnouncement: IDL.Func([IDL.Nat], [], []),
    deleteEvent: IDL.Func([IDL.Nat], [], []),
    deleteNews: IDL.Func([IDL.Nat], [], []),
    deleteService: IDL.Func([IDL.Nat], [], []),
    getAnnouncements: IDL.Func([], [IDL.Vec(Announcement)], ['query']),
    getCallerUserRole: IDL.Func([], [UserRole], ['query']),
    getEvents: IDL.Func([], [IDL.Vec(Event)], ['query']),
    getNews: IDL.Func([], [IDL.Vec(NewsPost)], ['query']),
    getPollResults: IDL.Func([IDL.Nat], [IDL.Opt(PollResults)], ['query']),
    getPolls: IDL.Func([], [IDL.Vec(Poll)], ['query']),
    getReplies: IDL.Func([IDL.Nat], [IDL.Vec(ForumReply)], ['query']),
    getServices: IDL.Func([], [IDL.Vec(Service)], ['query']),
    getTopics: IDL.Func([], [IDL.Vec(ForumTopic)], ['query']),
    isCallerAdmin: IDL.Func([], [IDL.Bool], ['query']),
    vote: IDL.Func([IDL.Nat, IDL.Nat], [], []),
  });
};
export const idlInitArgs = [];
export const init = ({ IDL }) => { return []; };
