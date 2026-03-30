/* eslint-disable */

// @ts-nocheck

// NOTE: This file was auto-generated but the bindgen tool produced an empty interface.
// It has been manually patched to include all methods. Do NOT overwrite without updating.

import { Actor, HttpAgent, type HttpAgentOptions, type ActorConfig, type Agent, type ActorSubclass } from "@icp-sdk/core/agent";
import type { Principal } from "@icp-sdk/core/principal";
import { idlFactory, type _SERVICE } from "./declarations/backend.did";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
function some<T>(value: T): Some<T> {
    return {
        __kind__: "Some",
        value: value
    };
}
function none(): None {
    return {
        __kind__: "None"
    };
}
function isNone<T>(option: Option<T>): option is None {
    return option.__kind__ === "None";
}
function isSome<T>(option: Option<T>): option is Some<T> {
    return option.__kind__ === "Some";
}
function unwrap<T>(option: Option<T>): T {
    if (isNone(option)) {
        throw new Error("unwrap: none");
    }
    return option.value;
}
function candid_some<T>(value: T): [T] {
    return [
        value
    ];
}
function candid_none<T>(): [] {
    return [];
}
export class ExternalBlob {
    onProgress?: (progress: number) => void;
    private _bytes?: Uint8Array;
    private _url?: string;
    async getBytes(): Promise<Uint8Array> {
        if (this._bytes) return this._bytes;
        if (this._url) {
            const res = await fetch(this._url);
            this._bytes = new Uint8Array(await res.arrayBuffer());
            return this._bytes;
        }
        return this.data;
    }
    static fromURL(url: string): ExternalBlob {
        const blob = new ExternalBlob(new Uint8Array(), "");
        blob._url = url;
        return blob;
    }
    constructor(public data: Uint8Array, public mimeType: string){}
}
export interface backendInterface {
    _initializeAccessControlWithSecret(userSecret: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: { admin: null } | { user: null } | { guest: null }): Promise<void>;
    getCallerUserRole(): Promise<{ admin: null } | { user: null } | { guest: null }>;
    isCallerAdmin(): Promise<boolean>;
    getRole(p: Principal): Promise<string>;
    forceAdmin(p: Principal): Promise<void>;
    createNews(title: string, body: string): Promise<bigint>;
    getNews(): Promise<Array<{ id: bigint; title: string; body: string; author: Principal; timestamp: bigint }>>;
    deleteNews(id: bigint): Promise<void>;
    createAnnouncement(title: string, text: string): Promise<bigint>;
    getAnnouncements(): Promise<Array<{ id: bigint; title: string; text: string; author: Principal; timestamp: bigint }>>;
    deleteAnnouncement(id: bigint): Promise<void>;
    createTopic(title: string, body: string): Promise<bigint>;
    getTopics(): Promise<Array<{ id: bigint; title: string; body: string; author: Principal; timestamp: bigint }>>;
    createReply(topicId: bigint, body: string): Promise<bigint>;
    getReplies(topicId: bigint): Promise<Array<{ id: bigint; topicId: bigint; body: string; author: Principal; timestamp: bigint }>>;
    createPoll(question: string, options: string[]): Promise<bigint>;
    getPolls(): Promise<Array<{ id: bigint; question: string; options: string[]; author: Principal; timestamp: bigint }>>;
    vote(pollId: bigint, optionIndex: bigint): Promise<void>;
    getPollResults(pollId: bigint): Promise<[] | [{ pollId: bigint; question: string; options: string[]; votes: bigint[]; userVoted: [] | [bigint] }]>;
    createEvent(title: string, description: string, date: string, location: string): Promise<bigint>;
    getEvents(): Promise<Array<{ id: bigint; title: string; description: string; date: string; location: string; author: Principal; timestamp: bigint }>>;
    deleteEvent(id: bigint): Promise<void>;
    createService(name: string, category: string, phone: string, description: string): Promise<bigint>;
    getServices(): Promise<Array<{ id: bigint; name: string; category: string; phone: string; description: string }>>;
    deleteService(id: bigint): Promise<void>;
}
export class Backend implements backendInterface {
    constructor(private actor: ActorSubclass<_SERVICE>, private _uploadFile: (file: ExternalBlob) => Promise<Uint8Array>, private _downloadFile: (file: Uint8Array) => Promise<ExternalBlob>, private processError?: (error: unknown) => never){}

    async _initializeAccessControlWithSecret(userSecret: string): Promise<void> {
        return this.actor._initializeAccessControlWithSecret(userSecret);
    }
    async assignCallerUserRole(user: Principal, role: { admin: null } | { user: null } | { guest: null }): Promise<void> {
        return this.actor.assignCallerUserRole(user, role);
    }
    async getCallerUserRole(): Promise<{ admin: null } | { user: null } | { guest: null }> {
        return this.actor.getCallerUserRole();
    }
    async isCallerAdmin(): Promise<boolean> {
        return this.actor.isCallerAdmin();
    }
    async getRole(p: Principal): Promise<string> {
        return this.actor.getRole(p);
    }
    async forceAdmin(p: Principal): Promise<void> {
        return this.actor.forceAdmin(p);
    }
    async createNews(title: string, body: string): Promise<bigint> {
        return this.actor.createNews(title, body);
    }
    async getNews() {
        return this.actor.getNews();
    }
    async deleteNews(id: bigint): Promise<void> {
        return this.actor.deleteNews(id);
    }
    async createAnnouncement(title: string, text: string): Promise<bigint> {
        return this.actor.createAnnouncement(title, text);
    }
    async getAnnouncements() {
        return this.actor.getAnnouncements();
    }
    async deleteAnnouncement(id: bigint): Promise<void> {
        return this.actor.deleteAnnouncement(id);
    }
    async createTopic(title: string, body: string): Promise<bigint> {
        return this.actor.createTopic(title, body);
    }
    async getTopics() {
        return this.actor.getTopics();
    }
    async createReply(topicId: bigint, body: string): Promise<bigint> {
        return this.actor.createReply(topicId, body);
    }
    async getReplies(topicId: bigint) {
        return this.actor.getReplies(topicId);
    }
    async createPoll(question: string, options: string[]): Promise<bigint> {
        return this.actor.createPoll(question, options);
    }
    async getPolls() {
        return this.actor.getPolls();
    }
    async vote(pollId: bigint, optionIndex: bigint): Promise<void> {
        return this.actor.vote(pollId, optionIndex);
    }
    async getPollResults(pollId: bigint) {
        return this.actor.getPollResults(pollId);
    }
    async createEvent(title: string, description: string, date: string, location: string): Promise<bigint> {
        return this.actor.createEvent(title, description, date, location);
    }
    async getEvents() {
        return this.actor.getEvents();
    }
    async deleteEvent(id: bigint): Promise<void> {
        return this.actor.deleteEvent(id);
    }
    async createService(name: string, category: string, phone: string, description: string): Promise<bigint> {
        return this.actor.createService(name, category, phone, description);
    }
    async getServices() {
        return this.actor.getServices();
    }
    async deleteService(id: bigint): Promise<void> {
        return this.actor.deleteService(id);
    }
}
export interface CreateActorOptions {
    agent?: Agent;
    agentOptions?: HttpAgentOptions;
    actorOptions?: ActorConfig;
    processError?: (error: unknown) => never;
}
export function createActor(canisterId: string, _uploadFile: (file: ExternalBlob) => Promise<Uint8Array>, _downloadFile: (file: Uint8Array) => Promise<ExternalBlob>, options: CreateActorOptions = {}): Backend {
    const agent = options.agent || HttpAgent.createSync({
        ...options.agentOptions
    });
    if (options.agent && options.agentOptions) {
        console.warn("Detected both agent and agentOptions passed to createActor. Ignoring agentOptions and proceeding with the provided agent.");
    }
    const actor = Actor.createActor<_SERVICE>(idlFactory, {
        agent,
        canisterId: canisterId,
        ...options.actorOptions
    });
    return new Backend(actor, _uploadFile, _downloadFile, options.processError);
}
