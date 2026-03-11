import Map "mo:core/Map";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  module Text {
    public func compare(t1 : Text, t2 : Text) : Order.Order {
      Text.compare(t1, t2);
    };
  };

  public type DailyEntry = {
    deepWorkHours : Float;
    screenTimeMinutes : Float;
    sleepRecharge : Float;
    pranayamaMinutes : Float;
    microRestRating : Float;
    nadiShodhanSessions : Float;
    mentalHealthRating : Float;
    physicalEnergyRating : Float;
    baselinePurityRating : Float;
    uTurnEfficiencyRating : Float;
    sensoryGuardingRating : Float;
    pmoOccurrence : Bool;
    guruPranamMinutes : Float;
    procrastinationRating : Float;
    passivePhoneRating : Float;
    fantasyRuminationRating : Float;
    daySatisfactionRating : Float;
    outsideFood : Bool;
    shutdownRitual : Bool;
    eyeRelaxationRating : Float;
    speechPracticeCycles : Nat;
  };

  public type WeeklyHobbies = {
    guitar : Bool;
    poetry : Bool;
    storyWriting : Bool;
  };

  public type UserProfile = {
    name : Text;
  };

  // Initialize the access control state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User-specific data storage: Map<Principal, Map<Text, DailyEntry>>
  let userDailyEntries = Map.empty<Principal, Map.Map<Text, DailyEntry>>();

  // User-specific weekly hobbies: Map<Principal, Map<Text, WeeklyHobbies>>
  let userWeeklyHobbies = Map.empty<Principal, Map.Map<Text, WeeklyHobbies>>();

  // User profiles
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Helper function to get or create user's daily entries map
  func getUserDailyEntriesMap(user : Principal) : Map.Map<Text, DailyEntry> {
    switch (userDailyEntries.get(user)) {
      case (?entries) { entries };
      case (null) {
        let newMap = Map.empty<Text, DailyEntry>();
        userDailyEntries.add(user, newMap);
        newMap;
      };
    };
  };

  // Helper function to get or create user's weekly hobbies map
  func getUserWeeklyHobbiesMap(user : Principal) : Map.Map<Text, WeeklyHobbies> {
    switch (userWeeklyHobbies.get(user)) {
      case (?hobbies) { hobbies };
      case (null) {
        let newMap = Map.empty<Text, WeeklyHobbies>();
        userWeeklyHobbies.add(user, newMap);
        newMap;
      };
    };
  };

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Daily Entry Management
  public shared ({ caller }) func saveDailyEntry(dateKey : Text, entry : DailyEntry) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save daily entries");
    };
    let userEntries = getUserDailyEntriesMap(caller);
    userEntries.add(dateKey, entry);
  };

  public query ({ caller }) func getDailyEntry(dateKey : Text) : async ?DailyEntry {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access daily entries");
    };
    let userEntries = getUserDailyEntriesMap(caller);
    userEntries.get(dateKey);
  };

  public query ({ caller }) func getEntriesForWeek(weekKey : Text, weekDates : [Text]) : async [(Text, DailyEntry)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access daily entries");
    };
    let userEntries = getUserDailyEntriesMap(caller);

    let filteredEntries = weekDates.map(
      func(date) { (date, userEntries.get(date)) }
    );

    filteredEntries.filter(
      func(entry : (Text, ?DailyEntry)) : Bool {
        switch (entry.1) {
          case (null) { false };
          case (?_) { true };
        };
      }
    ).map<(Text, ?DailyEntry), (Text, DailyEntry)>(
      func(entry) {
        switch (entry.1) {
          case (null) { Runtime.trap("Entry should never be null here") };
          case (?e) { (entry.0, e) };
        };
      }
    );
  };

  public query ({ caller }) func getDailyEntriesByDates(dates : [Text]) : async [(Text, DailyEntry)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access daily entries");
    };
    let userEntries = getUserDailyEntriesMap(caller);

    let validEntries = dates.map(
      func(date) { (date, userEntries.get(date)) }
    );

    let nonEmptyEntries = validEntries.filter(
      func(entry : (Text, ?DailyEntry)) : Bool {
        switch (entry.1) {
          case (null) { false };
          case (?_) { true };
        };
      }
    );

    let finalEntries = nonEmptyEntries.map(
      func(entry) {
        switch (entry.1) {
          case (null) { Runtime.trap("Entry should never be null here") };
          case (?e) { (entry.0, e) };
        };
      }
    );

    finalEntries;
  };

  // Weekly Hobbies Management
  public shared ({ caller }) func saveWeeklyHobbies(weekKey : Text, hobbies : WeeklyHobbies) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save weekly hobbies");
    };
    let userHobbies = getUserWeeklyHobbiesMap(caller);
    userHobbies.add(weekKey, hobbies);
  };

  public query ({ caller }) func getWeeklyHobbies(weekKey : Text) : async ?WeeklyHobbies {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access weekly hobbies");
    };
    let userHobbies = getUserWeeklyHobbiesMap(caller);
    userHobbies.get(weekKey);
  };

  public query ({ caller }) func getAllDailyEntryDates() : async [Text] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access daily entry dates");
    };
    let userEntries = getUserDailyEntriesMap(caller);
    userEntries.keys().toArray().sort();
  };
};
