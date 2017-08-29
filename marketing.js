const _ = require('underscore');
const Utility = require('./utility');
const Recurly = require('./recurly');
const config  = require('../config');
//use const or let instead of var to make the code consistent.
var Analytics = require('analytics-node');
var analytics = new Analytics(config.SEGMENT_WRITE_KEY);

exports.createGettingStartedMessage = function(user,team) {
  // Would need to account for multiple teams
  return createMarketingMessage(user,team,Utility.SEGMENT_WAIT_TIME.GETTING_STARTED,Utility.SEGMENT_MSG_TYPE.GETTING_STARTED)
} // should be terminated using ;.

exports.createSoloSignUpMessage = function(wolfRecord,team) {
  function createMessageObject(wolfRecord,team,days,type) {
      function createSendAtDate(days) {
          var date = new Date();
          date.setDate(date.getDate() + days);
          return Parse.Promise.as(date);
      }
      function buildInitialMessage(sendAtDate) {

        // there is no user, this needs rework

          var MarketingMessage = Parse.Object.extend('MarketingMessage');
          var message = new MarketingMessage();
          message.set('team',team);
          message.set('sendAt',sendAtDate);
          message.set('sendTo',wolfRecord.attributes.targetEmail)
          message.set('type',type);
          return Parse.Promise.as(message);
      }
      function createAndSetOptions(wolfRecord,team,message) {
        let nameArray = wolfRecord.attributes.personName.split(" ");
        let firstName = nameArray[0];
        let lastName;
        if (nameArray.length > 1) {
          lastName = nameArray.pop();
        }
          let options = {
              firstName: firstName,
              lastName: lastName,
              email: wolfRecord.attributes.targetEmail,
              teamName: wolfRecord.attributes.companyName
          }
          message.set('options',options);
          return message.save(null,{useMasterKey:true});
      }
      return createSendAtDate(days)
          .then(sendAtDate => buildInitialMessage(wolfRecord,team,sendAtDate))
          .then(message => createAndSetOptions(wolfRecord,team,message))
    }
  return createMessageObject(wolfRecord,team,Utility.SEGMENT_WAIT_TIME.SOLO_SIGN_UP,Utility.SEGMENT_MSG_TYPE.SOLO_SIGN_UP)
}

// Needs the user who the email is being sent to
// and the team of that user
// Returns the message if needed
// Otherwise will return undefined
exports.createLoneWolfReportMessage = function(team) {
  // Team name is the email for a wolf team 
  // Only create this message if there isn't one for this user already
  function getMarketingMessagesForUser(team) {
    var MarketingMessage = Parse.Object.extend('MarketingMessage');
    var query = new Parse.Query(MarketingMessage);
    query.limit(1000);
    query.equalTo('sendTo',team.attributes.name);
    query.equalTo('type',Utility.SEGMENT_MSG_TYPE.LONE_WOLF_REPORT);
    return query.find({useMasterKey:true});
  }
  function checkMessages(messages,team) {
    if (messages.length == 0) { // it should be a strict comparison with the value type as well as value.
      // need to add this to the unit test
      function createSendAtDate() {
            var date = new Date();
            date.setDate(date.getDate() + Utility.SEGMENT_WAIT_TIME.LONE_WOLF_REPORT);
            return Parse.Promise.as(date);
        }
        function buildInitialMessage(sendAtDate) {
            var MarketingMessage = Parse.Object.extend('MarketingMessage');
        var message = new MarketingMessage(); //Indentation fix.
            message.set('team',team);
            message.set('sendAt',sendAtDate);
            message.set('sendTo',team.attributes.name);
            message.set('type',Utility.SEGMENT_MSG_TYPE.LONE_WOLF_REPORT);
            return Parse.Promise.as(message);
        }
        function getWolf(message) {
          var WolfSignUp = Parse.Object.extend('WolfSignup');
          var query = new Parse.Query(WolfSignUp);
          query.limit(1000);
          query.equalTo('targetEmail',team.attributes.name);
          return query.first({useMasterKey:true})
            .then(wolfSignUp => Parse.Promise.as({wolfSignUp:wolfSignUp,message:message}))
        }
        function createAndSetOptions(obj) {
          let nameArray = obj.wolfSignUp.get('personName').split(" ");
          let firstName = nameArray[0];
          let lastName;
          if (nameArray.length > 1) {
            lastName = nameArray.pop();
          }
            let options = {
                firstName: firstName,
                lastName: lastName,
                email: obj.wolfSignUp.attributes.targetEmail,
                teamName: obj.wolfSignUp.attributes.companyName
            }
            obj.message.set('options',options);
            return obj.message.save({useMasterKey:true});
        }
        return createSendAtDate()
            .then(sendAtDate => buildInitialMessage(sendAtDate))
            .then(message => getWolf(message))
            .then(obj => createAndSetOptions(obj))
    } else {
      return Parse.Promise.as(messages);
    }
  }
  return getMarketingMessagesForUser(team)
    .then(messages => checkMessages(messages,team))
}

exports.createNewUserMarketingMessages = function(user,team) {
  // for each one I need to have a sendAt, type, User, and options
  function createMessageObject(user,team,days,type) {
    function createSendAtDate(days) {
      var date = new Date();
      date.setDate(date.getDate() + days);
      return Parse.Promise.as(date);
    }
    function buildInitialMessage(user,team,type,sendAtDate) {
      var MarketingMessage = Parse.Object.extend('MarketingMessage');
      var message = new MarketingMessage();
      message.set('sendTo',user.attributes.email);
      message.set('team',team);
      message.set('user',user);
      message.set('sendAt',sendAtDate);
      message.set('type',type);
      return Parse.Promise.as(message);
    }
    function createAndSetOptions(message) {
      let options = {
        firstName: user.attributes.firstName,
        lastName: user.attributes.lastName,
        email: user.attributes.email,
        teamName: team.attributes.name
      }
      message.set('options',options);
      return message.save();
    }
    return createSendAtDate(days)
      .then(sendAtDate => buildInitialMessage(user,team,type,sendAtDate))
      .then(message => createAndSetOptions(message))
  }
  function createInviteMessage(user,team) {
    return createMessageObject(user,team,Utility.SEGMENT_WAIT_TIME.INVITE,Utility.SEGMENT_MSG_TYPE.INVITE);
  }
  function createApproversPayersMessage(user,team) {
    return createMessageObject(user,team,Utility.SEGMENT_WAIT_TIME.ADMINS,Utility.SEGMENT_MSG_TYPE.ADMINS);
  }
  function createAddBankAccountMessage(user,team) {
    return createMessageObject(user,team,Utility.SEGMENT_WAIT_TIME.BANKING,Utility.SEGMENT_MSG_TYPE.BANKING);
  }
  function createCategoriesMessage(user,team) {
    return createMessageObject(user,team,Utility.SEGMENT_WAIT_TIME.CATEGORIES,Utility.SEGMENT_MSG_TYPE.CATEGORIES);
  }
  function createTrialEndingMessage(user,team) {
    return createMessageObject(user,team,Utility.SEGMENT_WAIT_TIME.TRIALENDING,Utility.SEGMENT_MSG_TYPE.TRIALENDING);
  }
  function createTrialOverMessage(user,team) {
    return createMessageObject(user,team,Utility.SEGMENT_WAIT_TIME.EXPIRED,Utility.SEGMENT_MSG_TYPE.EXPIRED);
  }
  return createApproversPayersMessage(user,team)
    .then(_ => createInviteMessage(user,team))
    .then(_ => createAddBankAccountMessage(user,team))
    .then(_ => createCategoriesMessage(user,team))
    .then(_ => createTrialEndingMessage(user,team))
    .then(_ => createTrialOverMessage(user,team))
    .then(_ => Parse.Promise.as(team))
}

exports.checkForMessagesToSend = function() {
  var self = this;
  function queryForMessages() {
    var date = new Date();
    var MarketingMessage = Parse.Object.extend('MarketingMessage');
    var query = new Parse.Query(MarketingMessage);
    query.limit(1000);
    query.include('user');
    query.include('user.teams')
    query.include('team');
    query.include('team.adminRole');
    query.lessThan('sendAt',date);
    return query.find({useMasterKey:true});
  }
  function validateMessages(messages) {
    // console.log(JSON.stringify(messages[0].attributes));
    var finalMessages = messages;
    var promises = new Array();
    _.each(messages, function(message) {
      switch (message.attributes.type) {
        case Utility.SEGMENT_MSG_TYPE.INVITE:
          var promise = validateInviteMsg(messages, message)
            .then(messages => {
              finalMessages = messages;
            })
          promises.push(promise);
          break;
        case Utility.SEGMENT_MSG_TYPE.ADMINS:
          var promise = validateAdminMsg(messages,message)
            .then(messages => {
              finalMessages = messages;
            });
          promises.push(promise);
          break;
        case Utility.SEGMENT_MSG_TYPE.BANKING:
          var promise = validateBankingMsg(messages,message)
            .then(messages => {
              finalMessages = messages;
            });
          promises.push(promise);
          break;
        case Utility.SEGMENT_MSG_TYPE.CATEGORIES:
          var promise = validateCategoryMsg(messages,message)
            .then(messages => {
              finalMessages = messages;
            });
          promises.push(promise);
          break;
        case Utility.SEGMENT_MSG_TYPE.TRIALENDING:
          var promise = validateTrialMsg(messages,message)
            .then(messages => {
              finalMessages = messages;
            })
          promises.push(promise);
          break;
        case Utility.SEGMENT_MSG_TYPE.EXPIRED:
          var promise = validateTrialMsg(messages,message)
            .then(messages => {
              finalMessages = messages;
            })
          promises.push(promise);
          break;
        case Utility.SEGMENT_MSG_TYPE.GETTING_STARTED:
          var promise = validateGettingStartedMessage(messages,message)
            .then(messages => {
              finalMessages = messages;
            })
          promises.push(promise);
          break;
        default:
          // statements_def
          break;
      }
    })
    return Parse.Promise.when(promises)
      .then(_ => Parse.Promise.as(finalMessages))
  }
  function createSegmentEvents(messages) {
    var user = Parse.User.current();
    _.each(messages, function(message) {
      analytics.track({
          event: message.attributes.type,
          properties: message.attributes.options
      });
    })
    return Parse.Promise.as(messages)
  }
  function deleteMessages(messages) {
    // Don't delete the lone wolf report messages
    for (var x = 0; x < messages.length; x++) {
      if (messages[x].attributes.type == Utility.SEGMENT_MSG_TYPE.LONE_WOLF_REPORT) {
        messages.splice(x,1);
      }
    }
    return Parse.Object.destroyAll(messages,{useMasterKey:true})
  }
  return queryForMessages()
    .then(messages => validateMessages(messages))
    .then(messages => createSegmentEvents(messages))
    .then(messages => deleteMessages(messages))
    .then(_ => Parse.Promise.as({success:true}))
}

function createMarketingMessage(user,team,days,type) {
  function createMessageObject(days,type) {
    function createSendAtDate(days) {
      var date = new Date();
      date.setDate(date.getDate() + days);
      return Parse.Promise.as(date);
    }
    function buildInitialMessage(sendAtDate) {
      var MarketingMessage = Parse.Object.extend('MarketingMessage');
      var message = new MarketingMessage();
      if (team) {
        message.set('team',team);
      }
      message.set('user',user);
      message.set('sendTo',user.attributes.email);
      message.set('sendAt',sendAtDate);
      message.set('type',type);
      return Parse.Promise.as(message);
    }
    function createAndSetOptions(message) {
      let options = {
        firstName: user.attributes.firstName,
        lastName: user.attributes.lastName,
        email: user.attributes.email,
        teamName: team.attributes.name
      }
      message.set('options',options);
      return message.save();
    }
    return createSendAtDate(days)
      .then(sendAtDate => buildInitialMessage(sendAtDate))
      .then(message => createAndSetOptions(message))
  }
}

/*
*   Methods for validating the message by type
*/

// Used for validating the Segment Invite users message
function validateInviteMsg(messages,message) {
  // check the TeamInvite table for any invites to that team, if they have invites
  // delete the message and don't create segment event.
  function getTeamInvites() {
    var TeamInvite = Parse.Object.extend('TeamInvite');
    var query = new Parse.Query(TeamInvite);
    query.limit(1000);
    query.equalTo('team',message.attributes.team);
    return query.find({useMasterKey:true});
  }
  function checkInvites(invites) {
    if (invites.length > 0) {
      for (var x = 0; x < messages.length; x++) {
        if (message.id == messages[x].id) {
          messages.splice(x,1);
          message.destroy({useMasterKey:true});
        }
      }
    }
    return Parse.Promise.as(messages);
  }
  return getTeamInvites()
    .then(invites => checkInvites(invites))
    .then(messages => Parse.Promise.as(messages))
}

// Used for validating the Segment add payers/approvers message
function validateAdminMsg(messages,message) {
  // console.log('calls no admins');
  // check if there is an approver or payer associated with the team
  function getSubRoles(role) {
    var rolesRelation = role.relation('roles');
    var queryRoles = rolesRelation.query();
    // get the approver and payer sub roles
    return queryRoles.find({useMasterKey:true});
  }
  function checkLengthOfUsersArray(subRoles) {
    // check the length of the subroles users
    function getUsers(role) {
      var roleQuery = role.relation('users').query();
      roleQuery.limit(1000);
      return roleQuery.find({useMasterKey:true});
    }
    var hasUsers = false;
    var promises = new Array();
    for (var y = 0; y<subRoles.length; y++) {
      var promise = getUsers(subRoles[y]).then(function(fetchedUsers) {
        if (fetchedUsers.length > 0) {
          hasUsers = true;
        }
      });
      promises.push(promise);
    }
    return Parse.Promise.when(promises)
      .then(_ => Parse.Promise.as(hasUsers));
  }
  function checkIfUsers(hasUsers) {
    // console.log('checks if has users');
    // console.log(hasUsers);
    if (hasUsers == true) {
      var index = -1;
      for (var x = 0; x < messages.length; x++) {
        if (message.id == messages[x].id) {
          messages.splice(x,1);
          message.destroy({useMasterKey:true});
        }
      }
    }
    return Parse.Promise.as(messages);
  }
  return message.attributes.team.fetch({useMasterKey:true})
    .then(team => getSubRoles(team.attributes.adminRole))
    .then(subRoles => checkLengthOfUsersArray(subRoles))
    .then(hasUsers => checkIfUsers(hasUsers))
    .then(messages => Parse.Promise.as(messages))
}

function validateBankingMsg(messages,message) {
  // console.log('calls banking')
  // console.log(JSON.stringify(message))
  // check if the team has a funding source or not.
  function queryForFundingSource() {
    var FundingSource = Parse.Object.extend('FundingSource');
    var query = new Parse.Query(FundingSource);
    query.limit(1000);
    query.equalTo('team',message.attributes.team)
    return query.find({useMasterKey:true});
  }
  function checkFundingResponse(fundingSources) {
    if (fundingSources.length > 0) {
      for (var x = 0; x < messages.length; x++) {
        if (message.id == messages[x].id) {
          messages.splice(x,1);
          message.destroy({useMasterKey:true});
        }
      }
    }
    return Parse.Promise.as(messages);
  }
  return queryForFundingSource()
    .then(fundingSources => checkFundingResponse(fundingSources));
}

// Used for validating the Segment add custom category message
function validateCategoryMsg(messages,message) {
  // see if there are any custom categories for the team
  function queryForCategories() {
    var Category = Parse.Object.extend('Category');
    var query = new Parse.Query(Category);
    query.limit(1000);
    query.equalTo('team',message.attributes.team)
    return query.find({useMasterKey:true});
  }
  function validateResults(categories) {
    if (categories.length > 0) {
      for (var x = 0; x < messages.length; x++) {
        if (message.id == messages[x].id) {
          messages.splice(x,1);
          message.destroy({useMasterKey:true});
        }
      }
    }
    return Parse.Promise.as(messages);
  }
  return queryForCategories()
    .then(categories => validateResults(categories))
}

// Used for validating the Segment trial expired message
function validateTrialMsg(messages,message) {
  // should check to see if the owner has entered billing info for this team.
  function checkBillingInfo(billingInfo) {
    if (billingInfo.status == 'ok') {
      // remove from messages and delete
      for (var x = 0; x < messages.length; x++) {
        if (message.id == messages[x].id) {
          messages.splice(x,1);
          message.destroy({useMasterKey:true});
        }
      }
    }
    return Parse.Promise.as(messages);
  }
  return Recurly.getBillingInfo(message.attributes.team.id)
    .then(billingInfo => checkBillingInfo(billingInfo))
    .then(messages => Parse.Promise.as(messages))
}

// Used for validating the Segment new user getting started message
function validateGettingStartedMessage(messages,message) {
  // check to see if the user is an admin or not
  console.log('it calls started validate')
  function getRolesUserIsIn() {
    var user = message.attributes.user;
    const query = new Parse.Query(Parse.Role);
      query.equalTo('users',user);
      return query.find({useMasterKey:true});
  }
  function checkRolesLength(roles) {
    if (roles.length > 0) {
      for (var x = 0; x < messages.length; x++) {
        if (message.id == messages[x].id) {
          messages.splice(x,1);
          message.destroy({useMasterKey:true})
        }
      }
    }
    return Parse.Promise.as(messages);
  }

  return getRolesUserIsIn()
    .then(roles => checkRolesLength(roles))
}