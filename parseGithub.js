var fs = require('fs');
var request = require('request');
var async = require('async');
var _ = require('lodash');
require('dotenv').load();

var apiRoot = "https://api.github.com";
var API_KEY = process.env.OAUTH_TOKEN;
var oAuthAppend = "?access_token=" + API_KEY;
var standardHeaders = {
  "User-Agent": "benkahle"
};

var storedReposByOwnerFile = "./reposByOwner.json";
var storedCollabsByPersonFile = "./collabsByPerson.json";
var storedBDCollabsByPersonFile = "./bdCollabsByPerson.json";

var namesList = fs.readFileSync("./githubnames.txt", "utf-8").split("\n").slice(0,-1);

//Users -> Repos
var reposByOwner = {};
//Repos -> Collaborators(users)
var collabsByPerson= {};

// Get repositories by a github username
var getUserRepos = (userName, callback) => {
  var options = {
    url: `${apiRoot}/users/${userName}/repos${oAuthAppend}`,
    headers: standardHeaders
  };
  
  request.get(options, (err, res, body) => {
    if (!err && res.statusCode === 200) {
      var info = JSON.parse(body);
      // Grab just the list of repository names from the response
      var repoNames = info.map(repo => repo.name);
      callback(null, repoNames);
    }
  });
};

// Get list of collaborators from a user's repository
var getCollabsFromUserRepo = (userName, repo, callback) => {
  console.log(userName, repo);
  var options = {
    url: `${apiRoot}/repos/${userName}/${repo}/contributors${oAuthAppend}`,
    headers: standardHeaders
  };

  request.get(options, (err, res, body) => {
    if (err) {
      console.log(err);
      callback(err);
    } else if (res.statusCode !== 200) {
      //empty repositories result in 204:
      if (res.statusCode !== 204) {
        // No idea what went wrong, log to investigate
        console.log(res);
      }
      // Send error that no data was found
      callback("no data");
    } else {
      var info = JSON.parse(body);
      // Get just the collaborators' usernames
      var collabs = info.map(collab => collab.login);
      // Remove yourself from list of collaborators
      if (collabs.indexOf(userName) !== -1) {
        collabs.splice(collabs.indexOf(userName), 1);
      }
      callback(null, collabs);
    }
  });
};

//NOTE: Generate Repos by Owners
async.forEach(namesList, (name, cb) => {
  getUserRepos(name, (err, repos) => {
    reposByOwner[name] = repos;
    cb();
  });
}, (err) => {
  fs.writeFileSync(storedReposByOwnerFile, JSON.stringify(reposByOwner));
});
// Use cached data instead of querying Github again
// reposByOwner = JSON.parse(fs.readFileSync(storedReposByOwnerFile, "utf-8"));

//NOTE: Count repositories (number of github requests to make)
// var count = 0;
// Object.keys(reposByOwner).forEach(owner => {
//   reposByOwner[owner].forEach(repo => count++)
// });
// console.log(count);


// NOTE: Generate Collabs
async.forEach(Object.keys(reposByOwner), (repoOwner, outerCallback) => {
  collabsByPerson[repoOwner] = {};
  async.forEach(reposByOwner[repoOwner], (repo, innerCallback) => {

    getCollabsFromUserRepo(repoOwner, repo, (err, collabs) => {
      if (err){
        console.error(err);
      } else{
        collabs.forEach((collab) => {
          if (collabsByPerson[repoOwner][collab]){
            collabsByPerson[repoOwner][collab] += 1;
            if(collabsByPerson[collab]){
              if(collabsByPerson[collab][repoOwner]){

                delete collabsByPerson[collab][repoOwner];
              }
            }
          } else {
            collabsByPerson[repoOwner][collab] = 1;
            if(collabsByPerson[collab]){
              if(collabsByPerson[collab][repoOwner]){

                delete collabsByPerson[collab][repoOwner];
              }
            }
          }
        })
      }
      innerCallback();
    });
  }, (err) => {
    outerCallback();
  });
}, (err) => {
  console.log("writing");
  fs.writeFileSync(storedCollabsByPersonFile, JSON.stringify(collabsByPerson));
});
// Use cached data instead of querying Github again
// collabsByPerson = JSON.parse(fs.readFileSync(storedCollabsByPersonFile, "utf-8"));

//NOTE: Make collaborator data bi-directional
Object.keys(collabsByPerson).forEach(person => {
  Object.keys(collabsByPerson[person]).forEach(collab => {
    if (collabsByPerson[collab]) {
      if (collabsByPerson[collab][person]){
        collabsByPerson[collab][person] += collabsByPerson[person][collab];
        collabsByPerson[person][collab] = collabsByPerson[collab][person];
      } else {
        collabsByPerson[collab][person] = collabsByPerson[person][collab];
      }
    } else {
      collabsByPerson[collab] = {};
      collabsByPerson[collab][person] = collabsByPerson[person][collab];
    }
  });
});
fs.writeFileSync(storedBDCollabsByPersonFile, JSON.stringify(collabsByPerson));

//NOTE: Find the most collaborations between any two people
var max = 0;
Object.keys(collabsByPerson).forEach(person => {
  Object.keys(collabsByPerson[person]).forEach(collab => {
    if(collabsByPerson[person][collab] > max){
      max = collabsByPerson[person][collab];
    }
  });
});
console.log(max);
