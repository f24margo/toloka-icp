import AccessControl "./authorization/access-control";
import MixinAuthorization "./authorization/MixinAuthorization";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Time "mo:core/Time";

actor class Community() = this {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type NewsPost = { id: Nat; title: Text; body: Text; author: Principal; timestamp: Int };
  public type Announcement = { id: Nat; title: Text; text: Text; author: Principal; timestamp: Int };
  public type ForumTopic = { id: Nat; title: Text; body: Text; author: Principal; timestamp: Int };
  public type ForumReply = { id: Nat; topicId: Nat; body: Text; author: Principal; timestamp: Int };
  public type Poll = { id: Nat; question: Text; options: [Text]; author: Principal; timestamp: Int };
  public type PollResults = { pollId: Nat; question: Text; options: [Text]; votes: [Nat]; userVoted: ?Nat };
  public type Event = { id: Nat; title: Text; description: Text; date: Text; location: Text; author: Principal; timestamp: Int };
  public type Service = { id: Nat; name: Text; category: Text; phone: Text; description: Text };

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
  // votes stored as [Nat] immutable, replaced on each vote
  var pollVoteCounts = Map.empty<Nat, [Nat]>();
  var userVoteMap = Map.empty<Text, Nat>();
  var eventCounter : Nat = 0;
  var eventMap = Map.empty<Nat, Event>();
  var serviceCounter : Nat = 0;
  var serviceMap = Map.empty<Nat, Service>();

  func now() : Int { Time.now() };

  func canModerate(caller: Principal) : Bool {
    let role = AccessControl.getUserRole(accessControlState, caller);
    role == #admin or role == #user;
  };

  // News
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

  // Announcements
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

  // Forum
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

  // Polls
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

  // Events
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

  // Services
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
};
