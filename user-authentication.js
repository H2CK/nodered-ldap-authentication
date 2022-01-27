const ldap = require('ldapjs');

const bindDn = 'cn=admin,dc=example,dc=com';
const bindCredentials = '123456';

const baseDn = 'ou=people,dc=example,dc=com';
const filter = '(|(memberOf=cn=node-red-admin,ou=groups,dc=example,dc=com)(memberOf=cn=node-red-guest,ou=groups,dc=example,dc=com))';
const idAttribute = 'uid';
const adminGroupDn = 'cn=node-red-admin,ou=groups,dc=example,dc=com';
const guestGroupDn = 'cn=node-red-guest,ou=groups,dc=example,dc=com';

const client = ldap.createClient({
    url: ['ldap://192.168.1.1:1389'],
    reconnect: true
});

client.on('error', (err) => {
    // handle connection error
    console.log('ERROR: LDAP client error: %s', err);
})

module.exports = {
    type: "credentials",
    users: function (username) {
        return new Promise(function (resolve) {
            // Do whatever work is needed to check username is a valid user.

            authenticateUser(client, bindDn, bindCredentials, null, (err) => {
                if (err) resolve(null);
                searchUser(client, baseDn, filter, idAttribute, username, (err1, res1) => {
                    if (err1 || res1  == null) {
                        resolve(null);
                    } else {
                        if (res1.memberOf == null || res1.mail == null) {
                            resolve(null);
                        } else {
                            if (userIsMemberOf(res1.memberOf, adminGroupDn)) {
                                var user = { username: res1.mail, permissions: "*" };
                                resolve(user);
                            } else if (userIsMemberOf(res1.memberOf, guestGroupDn)) {
                                var user = { username: res1.mail, permissions: "read" };
                                resolve(user);
                            } else resolve(null);
                        }
                    }
                });
            });

        });
    },
    authenticate: function (username, password) {
        return new Promise(function (resolve) {
            // Do whatever work is needed to validate the username/password combination.

            authenticateUser(client, bindDn, bindCredentials, null, (err, res) => {
                if (err) resolve(null);
                searchUser(client, baseDn, filter, idAttribute, username, (err1, res1) => {
                    if (err1 || res1 == null) {
                        resolve(null);
                    } else {
                        if (res1.dn == null || res1.memberOf == null || res1.mail == null) {
                            resolve(null);
                        } else {
                            authenticateUser(client, res1.dn, password, res1, (err2) => {
                                if (err2) {
                                    resolve(null);
                                } else {
                                    if (userIsMemberOf(res1.memberOf, adminGroupDn)) {
                                        var user = { username: res1.mail, permissions: "*" };
                                        resolve(user);
                                    } else if (userIsMemberOf(res1.memberOf, guestGroupDn)) {
                                        var user = { username: res1.mail, permissions: "read" };
                                        resolve(user);
                                    } else resolve(null);
                                }
                            });
                        }
                    }
                });
            });

        });
    },
    default: function () {
        return new Promise(function (resolve) {
            // Resolve with the user object for the default user.
            // If no default user exists, resolve with null.
            // resolve({ anonymous: true, permissions: "read" });
            resolve(null);
        });
    }
}

/// ---- Functions

function userIsMemberOf(memberOf, groupDn) {
    for (const k of Object.keys(memberOf)) {
        const groupDnObj = ldap.parseDN(memberOf[k]);
        if (groupDnObj.equals(groupDn)) {
            return true;
        }
    }
    return false;
}

function authenticateUser(ldapClient, userDn, userCredentials, userData, next) {
    console.log('Perform BIND for %s', userDn);
    ldapClient.bind(userDn, userCredentials, (err) => {
        if (err) {
            console.log('ERROR: BIND failed for %: ', userDn, err);
            next(err);
        }
        next(null, true, userData);
    });
}

function searchUser(ldapClient, peopleBaseDn, userFilter, userIdAttribute, userName, next) {
    const opts = {
        filter: '(&' + userFilter + '(' + userIdAttribute + '=' + userName + '))',
        scope: 'sub',
        attributes: ['dn', 'sn', 'cn', 'uid', 'mail', 'memberOf']
    };

    var searchData = [];

    ldapClient.search(peopleBaseDn, opts, (err, res) => {
        if (err) {
            console.log('ERROR: searchUser: %s', err);
            next(err);
        }

        res.on('searchEntry', (entry) => {
            searchData.push(entry.object);
        });
        res.on('error', (err1) => {
            console.error('ERROR: searchUser: %s' + err1.message);
            next(err1);
        });
        res.on('end', (result) => {
            if (searchData.length == 0) {
                console.log('ERROR: searchUser: User %s not found.', userName);
                next(new Error('User not found'));
            } else {
                next(null, searchData[0]);
            }
        });
    });
}
