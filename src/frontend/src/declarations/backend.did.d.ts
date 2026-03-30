/* eslint-disable */

// @ts-nocheck

import type { ActorMethod } from '@icp-sdk/core/agent';
import type { IDL } from '@icp-sdk/core/candid';
import type { Principal } from '@icp-sdk/core/principal';

export type UserRole = { 'admin': null } | { 'user': null } | { 'guest': null };

export interface NewsPost { id: bigint; title: string; body: string; author: Principal; timestamp: bigint; }
export interface Announcement { id: bigint; title: string; text: string; author: Principal; timestamp: bigint; }
export interface ForumTopic { id: bigint; title: string; body: string; author: Principal; timestamp: bigint; }
export interface ForumReply { id: bigint; topicId: bigint; body: string; author: Principal; timestamp: bigint; }
export interface Poll { id: bigint; question: string; options: Array<string>; author: Principal; timestamp: bigint; }
export interface PollResults { pollId: bigint; question: string; options: Array<string>; votes: Array<bigint>; userVoted: [] | [bigint]; }
export interface Event { id: bigint; title: string; description: string; date: string; location: string; author: Principal; timestamp: bigint; }
export interface Service { id: bigint; name: string; category: string; phone: string; description: string; }

export interface _SERVICE {
  '_initializeAccessControlWithSecret': ActorMethod<[string], undefined>;
  'assignCallerUserRole': ActorMethod<[Principal, UserRole], undefined>;
  'getCallerUserRole': ActorMethod<[], UserRole>;
  'isCallerAdmin': ActorMethod<[], boolean>;
  'getRole': ActorMethod<[Principal], string>;
  'forceAdmin': ActorMethod<[Principal], undefined>;
  'createNews': ActorMethod<[string, string], bigint>;
  'getNews': ActorMethod<[], Array<NewsPost>>;
  'deleteNews': ActorMethod<[bigint], undefined>;
  'createAnnouncement': ActorMethod<[string, string], bigint>;
  'getAnnouncements': ActorMethod<[], Array<Announcement>>;
  'deleteAnnouncement': ActorMethod<[bigint], undefined>;
  'createTopic': ActorMethod<[string, string], bigint>;
  'getTopics': ActorMethod<[], Array<ForumTopic>>;
  'createReply': ActorMethod<[bigint, string], bigint>;
  'getReplies': ActorMethod<[bigint], Array<ForumReply>>;
  'createPoll': ActorMethod<[string, Array<string>], bigint>;
  'getPolls': ActorMethod<[], Array<Poll>>;
  'vote': ActorMethod<[bigint, bigint], undefined>;
  'getPollResults': ActorMethod<[bigint], [] | [PollResults]>;
  'createEvent': ActorMethod<[string, string, string, string], bigint>;
  'getEvents': ActorMethod<[], Array<Event>>;
  'deleteEvent': ActorMethod<[bigint], undefined>;
  'createService': ActorMethod<[string, string, string, string], bigint>;
  'getServices': ActorMethod<[], Array<Service>>;
  'deleteService': ActorMethod<[bigint], undefined>;
}
export declare const idlService: IDL.ServiceClass;
export declare const idlInitArgs: IDL.Type[];
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
