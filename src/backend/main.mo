import AccessControl "./authorization/access-control";
import MixinAuthorization "./authorization/MixinAuthorization";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Time "mo:core/Time";

actor class Community() = this {
  // ── Types (must come before stable vars that reference them) ─────────────────
  public type NewsPost = { id: Nat; title: Text; body: Text; author: Principal; timestamp: Int };
  public type Announcement = { id: Nat; title: Text; text: Text; author: Principal; timestamp: Int };
  public type ForumTopic = { id: Nat; title: Text; body: Text; author: Principal; timestamp: Int };
  public type ForumReply = { id: Nat; topicId: Nat; body: Text; author: Principal; timestamp: Int };
  public type Poll = { id: Nat; question: Text; options: [Text]; author: Principal; timestamp: Int };
  public type PollResults = { pollId: Nat; question: Text; options: [Text]; votes: [Nat]; userVoted: ?Nat };
  public type Event = { id: Nat; title: Text; description: Text; date: Text; location: Text; author: Principal; timestamp: Int };
  public type Service = { id: Nat; name: Text; category: Text; phone: Text; description: Text };
  public type UserRole = AccessControl.UserRole;

  // ── Stable storage (persists across upgrades) ──────────────────────────────
  stable var stableAdminAssigned : Bool = false;
  stable var stableUserRoles : [(Principal, UserRole)] = [];

  stable var stableNewsCounter : Nat = 0;
  stable var stableNews : [(Nat, NewsPost)] = [];
  stable var stableAnnouncementCounter : Nat = 0;
  stable var stableAnnouncements : [(Nat, Announcement)] = [];
  stable var stableTopicCounter : Nat = 0;
  stable var stableTopics : [(Nat, ForumTopic)] = [];
  stable var stableReplyCounter : Nat = 0;
  stable var stableReplies : [(Nat, ForumReply)] = [];
  stable var stablePollCounter : Nat = 0;
  stable var stablePolls : [(Nat, Poll)] = [];
  stable var stablePollVoteCounts : [(Nat, [Nat])] = [];
  stable var stableUserVoteMap : [(Text, Nat)] = [];
  stable var stableEventCounter : Nat = 0;
  stable var stableEvents : [(Nat, Event)] = [];
  stable var stableServiceCounter : Nat = 0;
  stable var stableServices : [(Nat, Service)] = [];

  // ── In-memory state ────────────────────────────────────────────────────────
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  var newsCounter : Nat = 0;
  var newsMap = Map.empty<Nat, NewsPost>();
  var announcementCounter : Nat = 0;
  var announcementMap = Map.empty<Nat, Announcement>();
  var topicCounter : Nat = 0;
  var topicMap = Map.empty<Nat, ForumTopic>();
  var replyCounter : Nat = 0;
  var replyMap = Map.empty<Nat, ForumReply>();
  var pollCounter : Nat = 0;
  var pollMap = Map.empty<Nat, Poll>();
  var pollVoteCounts = Map.empty<Nat, [Nat]>();
  var userVoteMap = Map.empty<Text, Nat>();
  var eventCounter : Nat = 0;
  var eventMap = Map.empty<Nat, Event>();
  var serviceCounter : Nat = 0;
  var serviceMap = Map.empty<Nat, Service>();

  // ── Upgrade hooks ──────────────────────────────────────────────────────────
  system func preupgrade() {
    stableAdminAssigned := accessControlState.adminAssigned;
    stableUserRoles := accessControlState.userRoles.toArray();

    stableNewsCounter := newsCounter;
    stableNews := newsMap.toArray();
    stableAnnouncementCounter := announcementCounter;
    stableAnnouncements := announcementMap.toArray();
    stableTopicCounter := topicCounter;
    stableTopics := topicMap.toArray();
    stableReplyCounter := replyCounter;
    stableReplies := replyMap.toArray();
    stablePollCounter := pollCounter;
    stablePolls := pollMap.toArray();
    stablePollVoteCounts := pollVoteCounts.toArray();
    stableUserVoteMap := userVoteMap.toArray();
    stableEventCounter := eventCounter;
    stableEvents := eventMap.toArray();
    stableServiceCounter := serviceCounter;
    stableServices := serviceMap.toArray();
  };

  system func postupgrade() {
    accessControlState.adminAssigned := stableAdminAssigned;
    for ((p, role) in stableUserRoles.vals()) {
      accessControlState.userRoles.add(p, role);
    };

    newsCounter := stableNewsCounter;
    for ((k, v) in stableNews.vals()) { newsMap.add(k, v) };
    announcementCounter := stableAnnouncementCounter;
    for ((k, v) in stableAnnouncements.vals()) { announcementMap.add(k, v) };
    topicCounter := stableTopicCounter;
    for ((k, v) in stableTopics.vals()) { topicMap.add(k, v) };
    replyCounter := stableReplyCounter;
    for ((k, v) in stableReplies.vals()) { replyMap.add(k, v) };
    pollCounter := stablePollCounter;
    for ((k, v) in stablePolls.vals()) { pollMap.add(k, v) };
    for ((k, v) in stablePollVoteCounts.vals()) { pollVoteCounts.add(k, v) };
    for ((k, v) in stableUserVoteMap.vals()) { userVoteMap.add(k, v) };
    eventCounter := stableEventCounter;
    for ((k, v) in stableEvents.vals()) { eventMap.add(k, v) };
    serviceCounter := stableServiceCounter;
    for ((k, v) in stableServices.vals()) { serviceMap.add(k, v) };
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  func now() : Int { Time.now() };

  func canModerate(caller: Principal) : Bool {
    let role = AccessControl.getUserRole(accessControlState, caller);
    role == #admin or role == #user;
  };

  // ── Debug ──────────────────────────────────────────────────────────────────
  public query func getRole(p: Principal) : async Text {
    let role = AccessControl.getUserRole(accessControlState, p);
    switch(role) {
      case (#admin) { "admin" };
      case (#user) { "user" };
      case (#guest) { "guest" };
    }
  };

  // ── News ───────────────────────────────────────────────────────────────────
  public shared ({ caller }) func createNews(title: Text, body: Text) : async Nat {
    assert(canModerate(caller));
    let id = newsCounter;
    newsCounter += 1;
    newsMap.add(id, { id; title; body; author = caller; timestamp = now() });
    id
  };

  public query func getNews() : async [NewsPost] {
    newsMap.toArray().map(func((_, v): (Nat, NewsPost)) : NewsPost { v })
  };

  public shared ({ caller }) func deleteNews(id: Nat) : async () {
    assert(canModerate(caller));
    newsMap.remove(id);
  };

  // ── Announcements ──────────────────────────────────────────────────────────
  public shared ({ caller }) func createAnnouncement(title: Text, text: Text) : async Nat {
    assert(canModerate(caller));
    let id = announcementCounter;
    announcementCounter += 1;
    announcementMap.add(id, { id; title; text; author = caller; timestamp = now() });
    id
  };

  public query func getAnnouncements() : async [Announcement] {
    announcementMap.toArray().map(func((_, v): (Nat, Announcement)) : Announcement { v })
  };

  public shared ({ caller }) func deleteAnnouncement(id: Nat) : async () {
    assert(canModerate(caller));
    announcementMap.remove(id);
  };

  // ── Forum ──────────────────────────────────────────────────────────────────
  public shared ({ caller }) func createTopic(title: Text, body: Text) : async Nat {
    let role = AccessControl.getUserRole(accessControlState, caller);
    assert(role != #guest);
    let id = topicCounter;
    topicCounter += 1;
    topicMap.add(id, { id; title; body; author = caller; timestamp = now() });
    id
  };

  public query func getTopics() : async [ForumTopic] {
    topicMap.toArray().map(func((_, v): (Nat, ForumTopic)) : ForumTopic { v })
  };

  public shared ({ caller }) func createReply(topicId: Nat, body: Text) : async Nat {
    let role = AccessControl.getUserRole(accessControlState, caller);
    assert(role != #guest);
    let id = replyCounter;
    replyCounter += 1;
    replyMap.add(id, { id; topicId; body; author = caller; timestamp = now() });
    id
  };

  public query func getReplies(topicId: Nat) : async [ForumReply] {
    replyMap.toArray()
      .filter(func((_, v): (Nat, ForumReply)) : Bool { v.topicId == topicId })
      .map(func((_, v): (Nat, ForumReply)) : ForumReply { v })
  };

  // ── Polls ──────────────────────────────────────────────────────────────────
  public shared ({ caller }) func createPoll(question: Text, options: [Text]) : async Nat {
    assert(canModerate(caller));
    let id = pollCounter;
    pollCounter += 1;
    pollMap.add(id, { id; question; options; author = caller; timestamp = now() });
    pollVoteCounts.add(id, Array.repeat(0, options.size()));
    id
  };

  public query func getPolls() : async [Poll] {
    pollMap.toArray().map(func((_, v): (Nat, Poll)) : Poll { v })
  };

  public shared ({ caller }) func vote(pollId: Nat, optionIndex: Nat) : async () {
    let role = AccessControl.getUserRole(accessControlState, caller);
    assert(role != #guest);
    let key = pollId.toText() # ":" # caller.toText();
    assert(userVoteMap.get(key) == null);
    switch (pollVoteCounts.get(pollId)) {
      case (null) { assert(false) };
      case (?counts) {
        assert(optionIndex < counts.size());
        let updated = Array.tabulate(counts.size(), func i {
          if (i == optionIndex) { counts[i] + 1 } else { counts[i] }
        });
        pollVoteCounts.add(pollId, updated);
        userVoteMap.add(key, optionIndex);
      };
    };
  };

  public query ({ caller }) func getPollResults(pollId: Nat) : async ?PollResults {
    switch (pollMap.get(pollId)) {
      case (null) { null };
      case (?poll) {
        let counts = switch (pollVoteCounts.get(pollId)) {
          case (null) { Array.repeat(0, poll.options.size()) };
          case (?c) { c };
        };
        let key = pollId.toText() # ":" # caller.toText();
        let userVoted = userVoteMap.get(key);
        ?{ pollId; question = poll.question; options = poll.options; votes = counts; userVoted }
      };
    };
  };

  // ── Events ─────────────────────────────────────────────────────────────────
  public shared ({ caller }) func createEvent(title: Text, description: Text, date: Text, location: Text) : async Nat {
    assert(canModerate(caller));
    let id = eventCounter;
    eventCounter += 1;
    eventMap.add(id, { id; title; description; date; location; author = caller; timestamp = now() });
    id
  };

  public query func getEvents() : async [Event] {
    eventMap.toArray().map(func((_, v): (Nat, Event)) : Event { v })
  };

  public shared ({ caller }) func deleteEvent(id: Nat) : async () {
    assert(canModerate(caller));
    eventMap.remove(id);
  };

  // ── Services ───────────────────────────────────────────────────────────────
  public shared ({ caller }) func createService(name: Text, category: Text, phone: Text, description: Text) : async Nat {
    assert(canModerate(caller));
    let id = serviceCounter;
    serviceCounter += 1;
    serviceMap.add(id, { id; name; category; phone; description });
    id
  };

  public query func getServices() : async [Service] {
    serviceMap.toArray().map(func((_, v): (Nat, Service)) : Service { v })
  };

  public shared ({ caller }) func deleteService(id: Nat) : async () {
    assert(canModerate(caller));
    serviceMap.remove(id);
  };

  // ── Emergency ──────────────────────────────────────────────────────────────
  public shared func forceAdmin(p: Principal) : async () {
    accessControlState.userRoles.remove(p);
    accessControlState.userRoles.add(p, #admin);
    accessControlState.adminAssigned := true;
  };

};
