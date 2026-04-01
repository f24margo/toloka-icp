import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> { __kind__: "Some"; value: T; }
export interface None { __kind__: "None"; }
export type Option<T> = Some<T> | None;

export type UserRole = { admin: null } | { user: null } | { guest: null };

export interface NewsPost { id: bigint; title: string; body: string; author: Principal; timestamp: bigint; }
export interface Announcement { id: bigint; title: string; text: string; author: Principal; timestamp: bigint; }
export interface ForumTopic { id: bigint; title: string; body: string; author: Principal; timestamp: bigint; }
export interface ForumReply { id: bigint; topicId: bigint; body: string; author: Principal; timestamp: bigint; }
export interface Poll { id: bigint; question: string; options: string[]; author: Principal; timestamp: bigint; }
export interface PollResults { pollId: bigint; question: string; options: string[]; votes: bigint[]; userVoted: [] | [bigint]; }
export interface Event { id: bigint; title: string; description: string; date: string; location: string; author: Principal; timestamp: bigint; }
export interface Service { id: bigint; name: string; category: string; phone: string; description: string; }

export interface backendInterface {
  _initializeAccessControlWithSecret(userSecret: string): Promise<void>;
  assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
  getCallerUserRole(): Promise<UserRole>;
  isCallerAdmin(): Promise<boolean>;

  // Debug
  getRole(p: Principal): Promise<string>;

  // Emergency
  forceAdmin(p: Principal): Promise<void>;

  createNews(title: string, body: string): Promise<bigint>;
  getNews(): Promise<NewsPost[]>;
  deleteNews(id: bigint): Promise<void>;

  createAnnouncement(title: string, text: string): Promise<bigint>;
  getAnnouncements(): Promise<Announcement[]>;
  deleteAnnouncement(id: bigint): Promise<void>;

  createTopic(title: string, body: string): Promise<bigint>;
  getTopics(): Promise<ForumTopic[]>;
  createReply(topicId: bigint, body: string): Promise<bigint>;
  getReplies(topicId: bigint): Promise<ForumReply[]>;

  createPoll(question: string, options: string[]): Promise<bigint>;
  getPolls(): Promise<Poll[]>;
  vote(pollId: bigint, optionIndex: bigint): Promise<void>;
  getPollResults(pollId: bigint): Promise<[] | [PollResults]>;

  createEvent(title: string, description: string, date: string, location: string): Promise<bigint>;
  getEvents(): Promise<Event[]>;
  deleteEvent(id: bigint): Promise<void>;

  createService(name: string, category: string, phone: string, description: string): Promise<bigint>;
  getServices(): Promise<Service[]>;
  deleteService(id: bigint): Promise<void>;
  listUsers(): Promise<[string, string][]>;
  setUserRole(target: string, role: string): Promise<void>;
}
